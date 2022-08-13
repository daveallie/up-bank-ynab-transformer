import { UpApi, TransactionResource as UpTransaction, Relationship, RelationshipData } from "up-bank-api";
import { SaveTransaction as YnabTransaction } from "ynab/dist/api";
import { createTransaction, deleteTransaction, getPayees, updateTransaction } from "./ynab/api";
import { buildImportId, upAccountIdToYnabAccountId, upToYnabTransaction } from "./transformer";

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

  await createTransaction(ynabTransaction).catch((e) => {
    if (e && e.error && e.error.name === "conflict") {
      console.log("Duplicate transaction");
      return;
    }
    throw e;
  });
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
