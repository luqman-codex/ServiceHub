// src/lib/auth-storage.ts (05 §7.1)
// The JWT is a credential, so it lives in expo-secure-store (iOS Keychain /
// Android Keystore). All calls are async — always await them.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'servicehub.access_token';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
