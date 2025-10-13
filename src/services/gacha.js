
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const TEST_TOKEN = process.env.EXPO_PUBLIC_TEST_TOKEN?.trim(); // 👈 이거!!

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