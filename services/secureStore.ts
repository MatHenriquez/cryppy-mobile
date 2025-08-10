import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWebPlatform = Platform.OS === 'web';

export async function setSecureItem(key: string, value: string) {
  if (isWebPlatform) {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string) {
  if (isWebPlatform) {
    try {
      return localStorage.getItem(key);
    } catch {}
    return null;
  }
  return SecureStore.getItemAsync(key);
}

export async function deleteSecureItem(key: string) {
  if (isWebPlatform) {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
