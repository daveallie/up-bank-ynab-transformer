import { API, SaveTransaction as YnabTransaction } from "ynab";

const YNAB_BUDGET_ID = process.env.YNAB_BUDGET_ID || "";
const YNAB_API_KEY = process.env.YNAB_API_KEY || "";

const client = new API(YNAB_API_KEY);

export async function createTransaction (transaction: YnabTransaction) {
    const resp = await client.transactions.createTransaction(YNAB_BUDGET_ID, { transaction });
    console.log(`YNAB save: ${JSON.stringify(resp)}`);
}

export async function updateTransaction (transaction: YnabTransaction) {
    const transactions = await client.transactions.getTransactionsByAccount(YNAB_BUDGET_ID, transaction.account_id, transaction.date);
    const existingTransaction = transactions.data.transactions.find(t => t.import_id === transaction.import_id);

    if (!existingTransaction) {
        console.log("Could not find existing transaction, attempting to create");
        await createTransaction(transaction);
        return;
    }

    const resp = await client.transactions.updateTransaction(YNAB_BUDGET_ID, existingTransaction.id, { transaction });
    console.log(`YNAB update: ${JSON.stringify(resp)}`);
}
