// src/services/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
// 필요하면: import { API_URL } from "../config";
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// 공통 fetch
async function jsonFetch(path, { method = "GET", body, headers } = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (__DEV__) console.log("[api] →", path, method, body);

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : null; } catch { json = null; }

    if (!res.ok) {
      const msg = (json && (json.message || json.error?.message || json.error)) || `HTTP ${res.status} ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = json;
      if (__DEV__) console.warn("[api] ← error", path, res.status, json);
      throw err;
    }
    if (__DEV__) console.log("[api] ←", path, json);
    return json;
  } finally {
    clearTimeout(t);
  }
}

// 🔑 JWT 가져오기 (통일: 'jwt')
let tokenCache = null;
async function getToken() {
  if (tokenCache) return tokenCache;
  const t = await AsyncStorage.getItem("jwt");
  tokenCache = t;
  return t;
}

// ✅ 인증 필요 요청용 래퍼: 자동으로 Authorization 붙여줌
async function authFetch(path, options = {}, timeoutMs) {
  const token = await getToken();
  if (!token) {
    const e = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  return jsonFetch(path, { ...options, headers }, timeoutMs);
}

/** ① 장소 추천 (기존 그대로) */
export async function postLocationRecommendations(input) {
  const body = {
    category: input.category,
    keywords: Array.isArray(input.keywords) ? input.keywords : [],
    moods: Array.isArray(input.moods) ? input.moods : [],
    center: input.center && typeof input.center.lat === "number" && typeof input.center.lng === "number"
      ? { lat: input.center.lat, lng: input.center.lng }
      : undefined,
    radius_km: typeof input.radius_km === "number" ? input.radius_km : 3,
  };
  return jsonFetch("/recommendations/locations", { method: "POST", body });
}

/** ② 무드 기반 다음 추천 (기존 그대로) */
export async function postRouteNext(input) {
  const body = {
    moods: Array.isArray(input.moods) ? input.moods : [],
    exclude_location_ids: Array.isArray(input.exclude_location_ids) ? input.exclude_location_ids : [],
    exclude_categories: Array.isArray(input.exclude_categories) ? input.exclude_categories : [],
    region: input.region || undefined,
    center: input.center && typeof input.center.lat === "number" && typeof input.center.lng === "number"
      ? { lat: input.center.lat, lng: input.center.lng }
      : undefined,
    radius_km: typeof input.radius_km === "number" ? input.radius_km : 3,
  };
  return jsonFetch("/recommendations/routes/next", { method: "POST", body });
}

/** ③ 특정 장소 교체 (기존 그대로) */
export async function postReplaceOne(input) {
  const body = {
    category: input.category,
    exclude_location_ids: Array.isArray(input.exclude_location_ids) ? input.exclude_location_ids : [],
    center: input.center && typeof input.center.lat === "number" && typeof input.center.lng === "number"
      ? { lat: input.center.lat, lng: input.center.lng }
      : undefined,
  };
  return jsonFetch("/recommendations/locations/replace-one", { method: "POST", body });
}

// ✅ 토글(권장)
export async function toggleLocationLike(locationId) {
  return authFetch(`/locations/${locationId}/like/toggle`, { method: "POST" });
}

// 필요시 개별 add/remove
export async function postLocationLike(locationId) {
  return authFetch(`/locations/${locationId}/like`, { method: "POST" });
}
export async function deleteLocationLike(locationId) {
  return authFetch(`/locations/${locationId}/like`, { method: "DELETE" });
}

// 내가 좋아요한 장소 목록
export async function getMyLikedLocations({ page = 1, limit = 20 } = {}) {
  return authFetch(`/me/locations/likes?page=${page}&limit=${limit}`, { method: "GET" });
}