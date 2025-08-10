import { IStellarAsset } from "./IStellarAsset";

export interface IStellarBalance extends IStellarAsset {
  asset: string;
  balance: string;
}
