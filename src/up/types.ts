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
      account: {
        data: {
          type: "accounts";
          id: string;
        };
        links?: {
          related: string;
        };
      };
      category: {
        data: {
          type: "categories";
          id: string;
        } | null;
        links?: {
          related: string;
        };
      };
      parentCategory: {
        data: {
          type: "categories";
          id: string;
        } | null;
        links?: {
          related: string;
        };
      };
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
