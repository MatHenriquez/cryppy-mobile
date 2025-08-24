export interface IStellarTransaction {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  type_i: number;
  type: string;
  memo?: string;
  memo_type?: string;
}