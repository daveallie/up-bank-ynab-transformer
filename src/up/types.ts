type RelationshipWebhook = {
  data: {
    type: "webhooks";
    id: string;
  };
  links?: {
    related: string;
  };
};

export type RelationshipTransaction = {
  data: {
    type: "transactions";
    id: string;
  };
  links?: {
    related: string;
  };
};

export type WebhookEvent = {
  data: {
    type: "webhook-events";
    id: string;
    attributes: {
      eventType: "TRANSACTION_CREATED" | "TRANSACTION_SETTLED" | "TRANSACTION_DELETED" | "PING";
      createdAt: string;
    };
    relationships: {
      webhook: RelationshipWebhook;
      transaction?: RelationshipTransaction;
    };
  };
};

type Money = {
  currencyCode: string;
  value: string;
  valueInBaseUnits: number;
};

type Relationship<T> = {
  data: {
    type: T;
    id: string;
  };
  links?: {
    related: string;
  };
};

type NullableRelationship<T> = {
  data: {
    type: T;
    id: string;
  } | null;
  links?: {
    related: string;
  };
};

export type Transaction = {
  data: {
    type: "transactions";
    id: string;
    attributes: {
      status: "HELD" | "SETTLED";
      rawText: string | null;
      description: string;
      message: string | null;
      holdInfo: {
        amount: Money;
        foreignAmount: Money | null;
      } | null;
      roundUp: {
        amount: Money;
        boostPortion: Money | null;
      } | null;
      cashback: {
        description: string;
        amount: Money;
      } | null;
      amount: Money;
      foreignAmount: Money | null;
      settledAt: string | null;
      createdAt: string;
    };
    relationships: {
      account: Relationship<"accounts">;
      transferAccount: NullableRelationship<"accounts">;
      category: NullableRelationship<"categories">;
      parentCategory: NullableRelationship<"categories">;
      tags: {
        data: Array<{
          type: "tags";
          id: string;
        }>;
        links?: {
          self: string;
        };
      };
    };
    links?: {
      self: string;
    };
  };
};
