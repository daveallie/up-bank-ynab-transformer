import { API, Payee, SaveTransaction as YnabTransaction, TransactionDetail } from "ynab";

const YNAB_BUDGET_ID = process.env.YNAB_BUDGET_ID || "";
const YNAB_API_KEY = process.env.YNAB_API_KEY || "";

const client = new API(YNAB_API_KEY);

export async function createTransaction(transaction: YnabTransaction) {
  const resp = await client.transactions.createTransaction(YNAB_BUDGET_ID, { transaction });
  console.log(`YNAB save: ${JSON.stringify(resp)}`);

  if (
    resp.data.transaction?.transfer_transaction_id &&
    resp.data.transaction.cleared === TransactionDetail.ClearedEnum.Cleared
  ) {
    console.log("Clearing other side of transfer");
    const transactionId = resp.data.transaction.transfer_transaction_id;
    const transferTransaction = (await client.transactions.getTransactionById(YNAB_BUDGET_ID, transactionId)).data
      .transaction;
    transferTransaction.cleared = TransactionDetail.ClearedEnum.Cleared;
    const transferResp = await client.transactions.updateTransaction(YNAB_BUDGET_ID, transactionId, {
      transaction: transferTransaction,
    });
    console.log(`YNAB save: ${JSON.stringify(transferResp)}`);
  }
}

export async function updateTransaction(transaction: YnabTransaction) {
  const transactions = await client.transactions.getTransactionsByAccount(
    YNAB_BUDGET_ID,
    transaction.account_id,
    transaction.date
  );
  const existingTransaction = transactions.data.transactions.find((t) => t.import_id === transaction.import_id);

  if (!existingTransaction) {
    console.log("Could not find existing transaction, attempting to create");
    await createTransaction(transaction);
    return;
  }

  const resp = await client.transactions.updateTransaction(YNAB_BUDGET_ID, existingTransaction.id, { transaction });
  console.log(`YNAB update: ${JSON.stringify(resp)}`);
}

export async function getPayees(): Promise<Array<Payee>> {
  const payees = (await client.payees.getPayees(YNAB_BUDGET_ID)).data.payees;
  console.log(`Payees: ${JSON.stringify(payees)}`);
  return payees;
}
