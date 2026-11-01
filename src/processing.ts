import { UpApi, TransactionResource as UpTransaction, Relationship, RelationshipData } from "up-bank-api";
import { SaveTransaction as YnabTransaction } from "ynab/dist/api";
import { createTransaction, deleteTransaction, getPayees, moveCategoryMoney, updateTransaction } from "./ynab/api";
import { buildImportId, upAccountIdToMapping, upAccountIdToYnabAccountId, upToYnabTransaction } from "./transformer";

const up = new UpApi(process.env.UP_API_KEY || "");

async function buildYnabCreateTransaction(upTransaction: UpTransaction): Promise<YnabTransaction | null> {
  if (upTransaction.relationships.transferAccount.data?.id) {
    console.log("Internal transfer");
    if (upTransaction.attributes.amount.valueInBaseUnits < 0) {
      console.log("Skipping negative side of internal transfer");
      return null;
    }

    const sourceTransferYnabId = upAccountIdToYnabAccountId(upTransaction.relationships.account.data.id);
    const destTransferYnabId = upAccountIdToYnabAccountId(upTransaction.relationships.transferAccount.data.id);

    if (sourceTransferYnabId === destTransferYnabId) {
      console.log("Attempting to create transfer between same YNAB account. Skipping");
      return null;
    }

    const payees = await getPayees();
    const transferPayee = payees.find((p) => !p.deleted && p.transfer_account_id === destTransferYnabId);

    if (!transferPayee) {
      throw "Can't find transfer payee!";
    }

    return upToYnabTransaction(upTransaction, transferPayee.id);
  } else {
    return upToYnabTransaction(upTransaction);
  }
}

export async function transactionCreated(t: Relationship<RelationshipData<"transactions">> | undefined) {
  if (!t) return;

  console.log("Creating transaction");
  const upTransaction = (await up.transactions.retrieve(t.data.id)).data;
  console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

  const ynabTransaction = await buildYnabCreateTransaction(upTransaction);
  if (!ynabTransaction) return;

  const created = await createTransaction(ynabTransaction)
    .then(() => true)
    .catch((e) => {
      if (e && e.error && e.error.name === "conflict") {
        console.log("Duplicate transaction");
        return false;
      }
      throw e;
    });

  // Only on first create, so webhook retries don't move the budget twice
  if (created) await mirrorTransferInBudget(upTransaction);
}

// Moving money out of a pot changes what it's for, so move the matching budget between categories too
async function mirrorTransferInBudget(upTransaction: UpTransaction) {
  const sourceUpId = upTransaction.relationships.transferAccount.data?.id;
  if (!sourceUpId) return;

  // Only transfers a person made: payday splits, Scheduled Transfers and Round Ups have no performing customer
  // and are already planned in the budget
  const { performingCustomer } = upTransaction.attributes as { performingCustomer?: { displayName: string } | null };
  if (!performingCustomer) {
    console.log("Automatic transfer, not moving budget");
    return;
  }

  const source = upAccountIdToMapping(sourceUpId);
  const dest = upAccountIdToMapping(upTransaction.relationships.account.data.id);
  if (!source?.categoryId || !dest?.categoryId || source.categoryId === dest.categoryId) {
    console.log("Transfer doesn't map to a budget move. Skipping");
    return;
  }

  const date = upTransaction.attributes.createdAt.slice(0, 10);
  const milliunits = upTransaction.attributes.amount.valueInBaseUnits * 10;
  console.log(`Moving ${milliunits} budget from ${source.name} to ${dest.name}`);
  await moveCategoryMoney(date, source.categoryId, dest.categoryId, milliunits).catch((e) =>
    console.log(`Budget move failed, do it by hand: ${JSON.stringify(e)}`)
  );
}

export async function transactionUpdated(t: Relationship<RelationshipData<"transactions">> | undefined) {
  if (!t) return;

  console.log("Updating transaction");
  const upTransaction = (await up.transactions.retrieve(t.data.id)).data;
  console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

  const ynabTransaction = upToYnabTransaction(upTransaction);
  await updateTransaction(ynabTransaction);
}

export async function transactionDeleted(t: Relationship<RelationshipData<"transactions">> | undefined) {
  if (!t) return;

  console.log("Deleting transaction");
  await deleteTransaction(buildImportId(t.data.id));
}
