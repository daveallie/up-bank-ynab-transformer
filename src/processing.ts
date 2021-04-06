import { RelationshipTransaction, Transaction as UpTransaction } from "./up/types";
import { getTransaction } from "./up/api";
import { createTransaction, getPayees, updateTransaction } from "./ynab/api";
import { upAccountIdToYnabAccountId, upToYnabTransaction } from "./transformer";
import { SaveTransaction as YnabTransaction } from "ynab/dist/api";

async function buildYnabCreateTransaction(upTransaction: UpTransaction): Promise<YnabTransaction | null> {
  if (upTransaction.data.relationships.transferAccount.data?.id) {
    console.log("Internal transfer");
    if (upTransaction.data.attributes.amount.valueInBaseUnits < 0) {
      console.log("Skipping negative side of internal transfer");
      return null;
    }

    const sourceTransferYnabId = upAccountIdToYnabAccountId(upTransaction.data.relationships.account.data.id);
    const destTransferYnabId = upAccountIdToYnabAccountId(upTransaction.data.relationships.transferAccount.data.id);

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

export async function transactionCreated(t: RelationshipTransaction | undefined) {
  if (!t) return;

  console.log("Creating transaction");
  const upTransaction = await getTransaction(t.data.id);
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

export async function transactionUpdated(t: RelationshipTransaction | undefined) {
  if (!t) return;

  console.log("Updating transaction");
  const upTransaction = await getTransaction(t.data.id);
  console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

  const ynabTransaction = upToYnabTransaction(upTransaction);
  await updateTransaction(ynabTransaction);
}
