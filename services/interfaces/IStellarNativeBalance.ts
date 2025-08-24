import { IStellarAsset } from "./IStellarAsset";

export interface IStellarNativeBalance extends IStellarAsset {
  asset: string;
  balance: string;
}
