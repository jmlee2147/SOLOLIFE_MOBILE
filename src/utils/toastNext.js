import AsyncStorage from "@react-native-async-storage/async-storage";
const KEY = "pending_toast";

// toast: { type, message, subText?, duration?, targetRoute? }
export async function setPendingToast(toast) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(toast));
  } catch {}
}

export async function peekPendingToast() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function consumePendingToast() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}