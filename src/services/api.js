// 배포/개발 주소 한 곳에서 관리
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// 공통 JSON fetch 유틸 (+ 타임아웃)
async function jsonFetch(path, { method = "GET", body, headers } = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text(); // 에러일 때도 메시지를 보고 싶어서 먼저 text
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }

    if (!res.ok) {
      const msg =
        (json && (json.message || json.error?.message)) ||
        `HTTP ${res.status} ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

/**
 * ① 장소 추천 (3개 후보)
 * POST /recommendations/locations
 * body 예:
 * {
 *   "category": "카페",
 *   "keywords": ["조용한", "디저트"],
 *   "moods": ["아늑함"]
 * }
 * 응답: { items: [...], strategy: "..." }
 */
export async function postLocationRecommendations(body) {
  // body: { category, keywords:[], moods:[] }
  return jsonFetch("/recommendations/locations", { method: "POST", body });
}

/**
 * ② 무드 기반 다음 추천 (2개)
 * POST /recommendations/routes/next
 * body 예:
 * {
 *   "moods": ["조용한", "아늑한"],
 *   "excludeLocationIds": [1, 2],
 *   "excludeCategories": ["카페"],
 *   "region": "경기도 수원시 영통구"
 * }
 * 응답: { items: [...], meta: {...} }
 */
export async function postRouteNext(body) {
  // body: { moods:[], excludeLocationIds?:[], excludeCategories?:[], region?:string }
  return jsonFetch("/recommendations/routes/next", { method: "POST", body });
}

/**
 * ⑤ 카테고리 교체 후보 추천 (1개)
 * POST /recommendations/replace-one
 * body 예:
 * {
 *   "category": "카페",
 *   "excludeLocationIds": [5, 6],
 *   "region": "경기도 수원시 영통구"
 * }
 * 응답: { items: [...], meta: {...} }
 */
export async function postReplaceOne(body) {
  // body: { category, excludeLocationIds?:[], region?:string }
  return jsonFetch("/recommendations/replace-one", { method: "POST", body });
}

/* ----------------------------------------------------------------
   (선택) 간단한 래퍼: 응답의 items만 바로 받고 싶을 때
----------------------------------------------------------------- */
export async function getLocationRecommendationsItems(body) {
  const data = await postLocationRecommendations(body);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function getRouteNextItems(body) {
  const data = await postRouteNext(body);
  return Array.isArray(data?.items) ? data.items : [];
}

export async function getReplaceOneItem(body) {
  const data = await postReplaceOne(body);
  const arr = Array.isArray(data?.items) ? data.items : [];
  return arr[0] || null;
}