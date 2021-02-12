import axios from "axios";
import { Transaction } from "./types";

const API_BASE = "https://api.up.com.au/api/v1";
const UP_API_KEY = process.env.UP_API_KEY || "";

export async function getTransaction(id: string): Promise<Transaction> {
  const resp = await axios.get(`${API_BASE}/transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${UP_API_KEY}`,
    },
  });

  if (resp.status !== 200) {
    throw `Got non-200 status (${resp.status})`;
  }

  return resp.data as Transaction;
}
