import { Transaction as UpTransaction } from "./up/types";
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
    account_id: upAccountIdToYnabAccountId(upTransaction.data.relationships.account.data.id),
    amount: upTransaction.data.attributes.amount.valueInBaseUnits * 10,
    date: upTransaction.data.attributes.createdAt.slice(0, 10),
    cleared:
      upTransaction.data.attributes.status === "HELD"
        ? YnabTransaction.ClearedEnum.Uncleared
        : YnabTransaction.ClearedEnum.Cleared,
    import_id: buildImportId(upTransaction.data.id),
    memo: upTransaction.data.attributes.message,
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
      payee_name: upTransaction.data.attributes.description,
    };
  }
}
