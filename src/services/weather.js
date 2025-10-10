import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const CACHE_KEY = "weather.backend.cache.v1";
const CACHE_MS = 2 * 60 * 1000; // 2분

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

/** 앱에서 쓰는 4종 코드 그대로 유지 */
function normalizeBrief(code) {
  const c = String(code || "").toUpperCase();
  if (["SUNNY", "CLOUDY", "RAIN", "SNOW"].includes(c)) return c;
  return "CLOUDY";
}

// ===== 디버그 토글 =====
const DEBUG = __DEV__; // 필요시 true/false로 강제
const log = (...args) => DEBUG && console.log("[weather]", ...args);
const warn = (...args) => DEBUG && console.warn("[weather]", ...args);
const err = (...args) => DEBUG && console.warn("[weather][warn]", ...args); // dev RedBox 방지

async function getAccessToken() {
  const stored = await AsyncStorage.getItem("accessToken");
  if (stored) return stored;
  if (__DEV__) {
    const envToken = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim();
    if (envToken) return envToken;
  }
  return "";
}

async function getCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("loc-permission");
  }
  const t0 = Date.now();
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  log("loc ok", {
    ms: Date.now() - t0,
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
  });
  const { latitude: lat, longitude: lng } = loc.coords;
  return { lat, lng };
}

async function fetchBrief({ lat, lng, token }) {
  if (!BASE_URL) {
    throw new Error("no-base-url");
  }
  const url = new URL("/weather/brief", BASE_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));

  const reqInfo = {
    url: url.toString(),
    lat,
    lng,
    authPreview: token ? token.slice(0, 8) + "…" : "(none)",
  };
  log("→ GET /weather/brief", reqInfo);

  const t0 = Date.now();
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  }).catch((e) => {
    err("fetch network error", e?.message || e);
    throw e;
  });

  const ms = Date.now() - t0;
  log("← response", { status: res.status, ms });

  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) {
    let detail = "";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        detail = j?.error ? `:${j.error}` : `:${JSON.stringify(j)}`;
      } else {
        detail = ":"(await res.text());
      }
    } catch {}
    throw new Error(`server-${res.status}${detail}`);
  }

  const json = await res.json();
  DEBUG && log("json", json);
  return json;
}

/**
 * 메인 진입점:
 * - 좌표를 내부에서 얻거나, 외부에서 주입 가능
 * - 성공 시 { condition, provider:"backend", raw }
 */
export async function getWeatherFromBackend({
  lat = 37.5665,
  lng = 126.978,
  force = true,
} = {}) {
  // 1) 캐시
  if (!force) {
    try {
      const cached = JSON.parse(
        (await AsyncStorage.getItem(CACHE_KEY)) || "null"
      );
      if (cached && Date.now() - cached.ts < CACHE_MS) {
        log("cache hit", { ageMs: Date.now() - cached.ts, data: cached.data });
        return cached.data;
      }
      DEBUG && cached && log("cache stale", { ageMs: Date.now() - cached.ts });
    } catch (e) {
      warn("cache parse error", e?.message || e);
    }
  } else {
    log("force=true → skip cache");
  }

  // 2) 좌표
  let coords = { lat, lng };
  if (!(Number.isFinite(coords.lat) && Number.isFinite(coords.lng))) {
    try {
      coords = await getCoords(); // 권한 안 주면 throw
    } catch (e) {
      err("getCoords failed:", e?.message || e);
      // 좌표 못 구하면 폴백 반환
      return { condition: "SUNNY", provider: "fallback-no-loc", raw: null };
    }
  }

  // 3) 토큰
  const token = await getAccessToken();
  if (!token) {
    err("no token");
    throw new Error("no-token");
  }

  // 4) 호출
  try {
    const json = await fetchBrief({ ...coords, token });
    const condition = normalizeBrief(json?.brief?.code);
    const data = {
      condition, // "SUNNY" | "CLOUDY" | "RAIN" | "SNOW"
      provider: "backend",
      raw: json, // 필요하면 UI에서 current/hint 참고 가능
    };
    log("normalized condition:", condition);

    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data })
      );
      DEBUG && log("cache saved");
    } catch (e) {
      warn("cache write error", e?.message || e);
    }
    return data;
  } catch (e) {
    err("API call failed:", e?.message || e);
    // 안전 폴백 (원하는 기본 상태로 조정 가능)
    return { condition: "SUNNY", provider: "fallback-api-error", raw: null };
  }
}
