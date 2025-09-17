import AsyncStorage from "@react-native-async-storage/async-storage";

let tokenCache = null;

export async function getToken() {
  if (tokenCache) return tokenCache;
  const token = await AsyncStorage.getItem("jwt");
  tokenCache = token;
  return token;
}

export async function setToken(token) {
  tokenCache = token;
  await AsyncStorage.setItem("jwt", token);
}