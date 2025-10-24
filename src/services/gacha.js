const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim(); 

async function getToken() {
  // 실제 로그인 붙으면 SecureStore로 교체
  return TEST_TOKEN || "";
}

async function request(path, { method = "GET", body } = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 공통 에러 처리
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (_) {}
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }

  // 응답 JSON or null
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function rollCharacter() {
  return request("/gacha/roll/character", { method: "POST" });
}

export async function rollAsset() {
  return request("/gacha/roll/asset", { method: "POST" });
}

/* ────────────────────────────────
   POINTS API (via /auth/me)
───────────────────────────────── */
export async function getMyPoints() {
  try {
    const data = await request("/auth/me");
    // 백엔드 응답에 experience_points 필드 포함
    return data?.experience_points ?? 0;
  } catch (e) {
    console.warn("[getMyPoints] failed:", e.message);
    return 0;
  }
}