import { TransactionResource as UpTransaction } from "up-bank-api";
import { SaveTransaction as YnabTransaction } from "ynab/dist/api";
import ACCOUNT_MAPPING_LIST from "./accountMapping.json";

type AccountMapping = {
  name: string;
  upId: string;
  ynabId: string;
};
type AccountMappingList = Array<AccountMapping>;

const ACCOUNT_MAPPING: { [upId: string]: AccountMapping } = (ACCOUNT_MAPPING_LIST as AccountMappingList).reduce(
  (acc, map) => ({ ...acc, [map.upId]: map }),
  {}
);

export function upAccountIdToYnabAccountId(upAccountId: string): string {
  return (ACCOUNT_MAPPING[upAccountId] || ACCOUNT_MAPPING.UP_CATCHALL).ynabId;
}

export function buildImportId(upTransactionId: string): string {
  return `UP_BANK:${upTransactionId.slice(9)}`;
}

export function upToYnabTransaction(upTransaction: UpTransaction, payeeId?: string): YnabTransaction {
  const baseEvent = {
    account_id: upAccountIdToYnabAccountId(upTransaction.relationships.account.data.id),
    amount: upTransaction.attributes.amount.valueInBaseUnits * 10,
    date: upTransaction.attributes.createdAt.slice(0, 10),
    cleared:
      upTransaction.attributes.status === "HELD"
        ? YnabTransaction.ClearedEnum.Uncleared
        : YnabTransaction.ClearedEnum.Cleared,
    import_id: buildImportId(upTransaction.id),
    memo: upTransaction.attributes.message,
    approved: true,
  };

  if (payeeId) {
    return {
      ...baseEvent,
      payee_id: payeeId,
    };
  } else {
    return {
      ...baseEvent,
      payee_name: upTransaction.attributes.description,
    };
  }
}
