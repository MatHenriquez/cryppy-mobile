import { Alert } from "react-native";
import 'react-native-get-random-values';
import {
    Account,
    Asset,
    Keypair,
    Networks,
    Operation,
    TransactionBuilder,
} from "stellar-base";

const HORIZON = "https://horizon-testnet.stellar.org";

export interface StellarBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
  buying_liabilities: string;
  selling_liabilities: string;
}

export interface StellarTransaction {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  type_i: number;
  type: string;
  memo?: string;
  memo_type?: string;
}

export interface StellarAccount {
  id: string;
  account_id: string;
  sequence: string;
  balances: StellarBalance[];
}

export function createKeypair() {
  try {
    const kp = Keypair.random();
    return { publicKey: kp.publicKey(), secret: kp.secret() };
  } catch (e: any) {
    console.error("Create error:", e);
    Alert.alert("Error creando cuenta", String(e?.message ?? e));
  }
}

export async function fundTestnet(publicKey: string) {
  try {
    const res = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    if (!res.ok) throw new Error(`Friendbot error: ${res.status}`);
    return res.json();
  } catch (e: any) {
    console.error("Balances error:", e);
    Alert.alert("Error obteniendo balances", String(e?.message ?? e));
  }
}

export async function getBalances(publicKey: string) {
  const res = await fetch(`${HORIZON}/accounts/${publicKey}`);
  if (!res.ok) throw new Error(`Horizon error: ${res.status}`);
  const data = await res.json();
  return data.balances.map((b: any) => ({
    asset: b.asset_type === "native" ? "XLM" : b.asset_code,
    balance: b.balance,
  }));
}

export async function getAccountTransactions(publicKey: string, limit: number = 20): Promise<StellarTransaction[]> {
  try {
    const response = await fetch(`${HORIZON}/accounts/${publicKey}/transactions?order=desc&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data._embedded.records;
  } catch (error) {
    console.error('Error getting account transactions:', error);
    return [];
  }
}

export async function getTransactionOperations(transactionId: string) {
  try {
    const response = await fetch(`${HORIZON}/transactions/${transactionId}/operations`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data._embedded.records;
  } catch (error) {
    console.error('Error getting transaction operations:', error);
    return [];
  }
}

export async function isAccountActivated(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${HORIZON}/accounts/${publicKey}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export function formatBalance(balance: string, decimals: number = 7): string {
  const num = parseFloat(balance);
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}

export async function getXLMPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd');
    const data = await response.json();
    return data.stellar?.usd || 0;
  } catch (error) {
    console.error('Error getting XLM price:', error);
    return 0;
  }
}

export async function payNative(
  senderSecret: string,
  destination: string,
  amount: string
) {
  const sender = Keypair.fromSecret(senderSecret);
  // 1) Load account and sequence
  const acctRes = await fetch(`${HORIZON}/accounts/${sender.publicKey()}`);
  if (!acctRes.ok) throw new Error(`Load account error: ${acctRes.status}`);
  const acct = await acctRes.json();

  // 2) Fee (simple: 100)
  // ToDo: query fee_stats
  let fee = "100";
  try {
    const feeRes = await fetch(`${HORIZON}/fee_stats`);
    if (feeRes.ok) {
      const stats = await feeRes.json();
      fee = String(stats.max_fee?.mode ?? stats.fee_charged?.p50 ?? 100);
    }
  } catch {}

  // 3) Build and sign tx
  const tx = new TransactionBuilder(new Account(acct.id, acct.sequence), {
    fee,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(60)
    .build();

  tx.sign(sender);

  // 4) Send to Horizon
  const submit = await fetch(`${HORIZON}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: `tx=${encodeURIComponent(tx.toXDR())}`,
  });

  const body = await submit.json();
  if (!submit.ok) {
    throw new Error(body?.detail ?? "Transaction failed");
  }
  return body;
}
