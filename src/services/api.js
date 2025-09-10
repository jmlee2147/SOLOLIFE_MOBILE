const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function jsonFetch(path, { method = "GET", body, headers } = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 디버그: 요청 바디 로깅
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
      const msg = (json && (json.message || json.error?.message)) || `HTTP ${res.status} ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = json;
      // 디버그: 응답 에러 로깅
      if (__DEV__) console.warn("[api] ← error", path, res.status, json);
      throw err;
    }
    if (__DEV__) console.log("[api] ←", path, json);
    return json;
  } finally {
    clearTimeout(t);
  }
}

/** ① 장소 추천 (3개) */
export async function postLocationRecommendations(input) {
  // input: { category(label), keywords:[], moods:[], center:{lat,lng}, radius_km:number }
  const body = {
    category: input.category,                  // 반드시 한글 라벨
    keywords: Array.isArray(input.keywords) ? input.keywords : [],
    moods: Array.isArray(input.moods) ? input.moods : [],
    center: input.center && typeof input.center.lat === "number" && typeof input.center.lng === "number"
      ? { lat: input.center.lat, lng: input.center.lng }
      : undefined,
    radius_km: typeof input.radius_km === "number" ? input.radius_km : 3,
  };
  return jsonFetch("/recommendations/locations", { method: "POST", body });
}

/** ② 무드 기반 다음 추천 (2개) */
export async function postRouteNext(input) {
  // input: { moods:[], exclude_location_ids:[], exclude_categories:[], region?, center:{lat,lng}, radius_km }
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

export async function postReplaceOne(input) {
  const body = {
    category: input.category,
    exclude_location_ids: Array.isArray(input.exclude_location_ids) ? input.exclude_location_ids : [],
    // region: input.region || undefined,
    center: input.center && typeof input.center.lat === "number" && typeof input.center.lng === "number"
      ? { lat: input.center.lat, lng: input.center.lng }
      : undefined,
    // radius_km: typeof input.radius_km === "number" ? input.radius_km : 3,
  };
  return jsonFetch("/recommendations/locations/replace-one", { method: "POST", body });
}