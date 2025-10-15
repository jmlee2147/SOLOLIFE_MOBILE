import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// ========================
// 🌐 BASE URL 정규화
// ========================
const RAW_BASE = String(process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
const BASE_URL = RAW_BASE.replace(/\/+$/, ""); // 끝 슬래시 제거
if (__DEV__) console.log("[api:init] BASE_URL =", BASE_URL);

// ========================
// ⚙️ axios 인스턴스 (JWT 자동 추가)
// ========================
const axiosApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

let tokenCache = null;

async function getToken() {
  if (tokenCache) return tokenCache;
  const t = await AsyncStorage.getItem("jwt");
  tokenCache = t;
  return t;
}

axiosApi.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("[api] ⚠️ JWT 로드 실패:", e.message);
  }

  config.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(config.headers || {}),
  };

  if (__DEV__)
    console.log(
      "[api →]",
      config.method?.toUpperCase(),
      config.url,
      config.data || ""
    );
  return config;
});

axiosApi.interceptors.response.use(
  (res) => {
    if (__DEV__) console.log("[api ←]", res.status, res.config.url, res.data);
    return res;
  },
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.warn(
      "[api:error]",
      status,
      error.config?.url,
      data || error.message
    );
    return Promise.reject(error);
  }
);

// ========================
// 🧠 공통 fetch (토큰 수동 포함 가능)
// ========================
async function jsonFetch(
  path,
  { method = "GET", body, headers } = {},
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const safePath = path.startsWith("/") ? path : `/${path}`;
    const url = `${BASE_URL}${safePath}`;
    if (__DEV__) console.log("[fetch →]", method, url, body || "");

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const msg =
        (json && (json.message || json.error?.message || json.error)) ||
        `HTTP ${res.status} ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = json;
      console.warn("[fetch:error]", res.status, url, msg);
      throw err;
    }

    if (__DEV__) console.log("[fetch ←]", res.status, url, json);
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

// ========================
// 🔐 인증 요청용 fetch
// ========================
async function authFetch(path, options = {}, timeoutMs) {
  const token = await getToken();
  if (!token) {
    const e = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  return jsonFetch(path, { ...options, headers }, timeoutMs);
}

// ========================
// 📍 기존 추천 관련 API
// ========================
export async function postLocationRecommendations(input) {
  const body = {
    category: input.category,
    keywords: Array.isArray(input.keywords) ? input.keywords : [],
    moods: Array.isArray(input.moods) ? input.moods : [],
    center:
      input.center &&
      typeof input.center.lat === "number" &&
      typeof input.center.lng === "number"
        ? { lat: input.center.lat, lng: input.center.lng }
        : undefined,
    radius_km: typeof input.radius_km === "number" ? input.radius_km : 3,
  };
  return jsonFetch("/recommendations/locations", { method: "POST", body });
}

export async function postRouteNext(input) {
  const body = {
    moods: Array.isArray(input.moods) ? input.moods : [],
    exclude_location_ids: Array.isArray(input.exclude_location_ids)
      ? input.exclude_location_ids
      : [],
    exclude_categories: Array.isArray(input.exclude_categories)
      ? input.exclude_categories
      : [],
    region: input.region || undefined,
    center:
      input.center &&
      typeof input.center.lat === "number" &&
      typeof input.center.lng === "number"
        ? { lat: input.center.lat, lng: input.center.lng }
        : undefined,
    radius_km: typeof input.radius_km === "number" ? input.radius_km : 3,
  };
  return jsonFetch("/recommendations/routes/next", { method: "POST", body });
}

export async function postReplaceOne(input) {
  const body = {
    category: input.category,
    exclude_location_ids: Array.isArray(input.exclude_location_ids)
      ? input.exclude_location_ids
      : [],
    center:
      input.center &&
      typeof input.center.lat === "number" &&
      typeof input.center.lng === "number"
        ? { lat: input.center.lat, lng: input.center.lng }
        : undefined,
  };
  return jsonFetch("/recommendations/locations/replace-one", {
    method: "POST",
    body,
  });
}

export async function postRandomRecommendations(body) {
  const res = await fetch(`${BASE_URL}/recommendations/random`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`랜덤 추천 실패 (${res.status}): ${msg}`);
  }
  return await res.json();
}

// ========================
// ❤️ 장소 좋아요 관련
// ========================
export async function toggleLocationLike(locationId) {
  return authFetch(`/locations/${locationId}/like/toggle`, { method: "POST" });
}

export async function postLocationLike(locationId) {
  return authFetch(`/locations/${locationId}/like`, { method: "POST" });
}

export async function deleteLocationLike(locationId) {
  return authFetch(`/locations/${locationId}/like`, { method: "DELETE" });
}

export async function getMyLikedLocations({ page = 1, limit = 20 } = {}) {
  return authFetch(`/me/locations/likes?page=${page}&limit=${limit}`, {
    method: "GET",
  });
}

// ========================
// 📂 좋아요 폴더 관련 (axios 사용)
// ========================
export async function getLikeFolders() {
  const res = await axiosApi.get("/folders/me/like-folders");
  return res.data.items || [];
}

export async function createLikeFolder(nameOrObj) {
  // 문자열만 받도록 강제 (객체 들어오면 name만 추출)
  const name =
    typeof nameOrObj === "string" ? nameOrObj : String(nameOrObj?.name || "");
  if (!name.trim()) throw new Error("Folder name is required");

  try {
    const res = await axiosApi.post("/folders/me/like-folders", { name });
    return res.data;
  } catch (e) {
    // 디버깅 도움 로그
    const url = e?.config?.url || "/like-folders";
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.warn("[likeFolders:create] error:", status, url, data);
    throw e;
  }
}

export async function addLocationToFolder(folderId, locationId) {
  const res = await axiosApi.post(
    `/folders/like-folders/${folderId}/locations/${locationId}`
  );
  return res.data;
}

export async function removeLocationFromFolder(folderId, locationId) {
  const res = await axiosApi.delete(
    `/folders/like-folders/${folderId}/locations/${locationId}`
  );
  return res.data;
}

export async function toggleLocationInFolder(folderId, locationId) {
  const res = await axiosApi.post(
    `/folders/like-folders/${folderId}/locations/${locationId}/toggle`
  );
  return res.data;
}

// 이미 있는 import/axiosApi는 그대로 사용
export async function createLikeFolderUnique(baseName = "새 폴더", opts = {}) {
  // 현재 목록을 먼저 받아와서 겹치지 않는 이름을 만든다
  const { data: listRes } = await axiosApi.get("/folders/me/like-folders");
  const existing = new Set(
    (listRes?.items || []).map((it) => String(it?.name || "").trim())
  );

  // "새 폴더", "새 폴더 2", "새 폴더 3" ... 식으로 비는 이름 찾기
  const mkName = (n) => (n <= 1 ? baseName : `${baseName} ${n}`);
  let n = 1;
  let candidate = mkName(n);
  while (existing.has(candidate) && n < 100) {
    n += 1;
    candidate = mkName(n);
  }

  // 서버에 생성 시도. 혹시 동시에 누가 만들었으면 409 나올 수 있으니 몇 번 재시도.
  const maxRetry = 3;
  for (let i = 0; i < maxRetry; i++) {
    try {
      console.log("[api →] POST /folders/me/like-folders", { name: candidate });
      const { data } = await axiosApi.post("/folders/me/like-folders", { name: candidate });
      console.log("[api ←] /folders/me/like-folders", data);
      return data; // { folder_id, name, ... }
    } catch (e) {
      const status = e?.response?.status || e?.status;
      if (status === 409) {
        // 다시 한 번 이름 늘려서 재시도
        n += 1;
        candidate = mkName(n);
        console.warn("[likeFolders:create] 409, retry with:", candidate);
        continue;
      }
      console.warn("[likeFolders:create] error:", status, e?.response?.data || e);
      throw e;
    }
  }
  // 여기 도달하면 409가 계속 남
  const err = new Error("폴더 이름 충돌이 지속되어 생성할 수 없어요.");
  err.code = "FOLDER_NAME_CONFLICT";
  throw err;
}

// 폴더명 변경도 별도 제공 중이라면 그대로 사용
export async function renameFolder(folderId, name) {
  const { data } = await axiosApi.patch(`/folders/me/like-folders/${folderId}`, { name });
  return data;
}

export async function getFolderLocations(folderId, page = 1, limit = 200) {
  const { data } = await axiosApi.get(
    `/folders/me/like-folders/${folderId}/locations?page=${page}&limit=${limit}`
  );
  return data;
}


// ── Characters / Assets: owned list ─────────────────────────────
export async function getMyCharacters() {
  return authFetch(`/characters/me`, { method: "GET" });
}

export async function getMyAssets() {
  return authFetch(`/assets/me`, { method: "GET" });
}

// ── Appearance: get / put ───────────────────────────────────────
export async function getAppearance() {
  // 서버가 기본형으로 병합해 반환
  return authFetch(`/users/me/appearance`, { method: "GET" });
}

export async function putAppearance(payload) {
  // payload 예) { character_id: "base_f", assets: { "bg1-only": "tent", "bg23": ["tree"] } }
  return authFetch(`/users/me/appearance`, {
    method: "PUT",
    body: payload,
  });
}