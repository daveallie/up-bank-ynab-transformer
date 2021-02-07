import { RelationshipTransaction } from "./up/types";
import { getTransaction } from "./up/api";
import { createTransaction, updateTransaction } from "./ynab/api";
import {buildImportId, upAccountIdToYnabAccountId, upToYnabTransaction} from "./transformer";

export async function transactionCreated (t: RelationshipTransaction | undefined) {
    if (!t) return;

    console.log("Creating transaction");
    const upTransaction = await getTransaction(t.data.id);
    console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

    const ynabTransaction = upToYnabTransaction(upTransaction);
    await createTransaction(ynabTransaction).catch(e => {
        if (e && e.error && e.error.name === "conflict") {
            console.log("Duplicate transaction");
            return;
        }
        throw e;
    });
}

export async function transactionUpdated (t: RelationshipTransaction | undefined) {
    if (!t) return;

    console.log("Updating transaction");
    const upTransaction = await getTransaction(t.data.id);
    console.log(`Up Transaction: ${JSON.stringify(upTransaction)}`);

    const ynabTransaction = upToYnabTransaction(upTransaction);
    await updateTransaction(ynabTransaction);
}
