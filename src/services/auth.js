import AsyncStorage from "@react-native-async-storage/async-storage";
// 파일 상단 어딘가

const BASE_URL = "http://16.176.24.53:4000"; // 지금 쓰는 값 그대로

async function debugLogin() {
  const url = `${BASE_URL}/auth/login`;
  const tries = [
    { body: { email: "test@test.com", password: "test" }, note: "email/password" },
    { body: { username: "test", password: "test" }, note: "username/password" },
    { body: { user: "test@test.com", pass: "test" }, note: "user/pass (혹시모름)" },
  ];

  for (const t of tries) {
    try {
      console.log("----");
      console.log("[debugLogin] URL:", url, "| try:", t.note);
      console.log("[debugLogin] request body:", JSON.stringify(t.body));

      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(t.body),
      });

      const text = await r.text();
      console.log("[debugLogin] status:", r.status);
      console.log("[debugLogin] content-type:", r.headers.get("content-type"));
      console.log("[debugLogin] raw:", text.slice(0, 500)); // 원문 앞부분

      let data = {};
      try { data = JSON.parse(text); } catch(_) {}
      if (r.ok && data?.token) {
        console.log("[debugLogin] ✅ token:", data.token.slice(0, 20) + "..."); // 일부만
        return data.token;
      } else {
        console.log("[debugLogin] ❌ not ok. data.error:", data?.error);
      }
    } catch (e) {
      console.warn("[debugLogin] exception:", e?.message);
    }
  }
  return null;
}



const TOKEN_KEY = "jwt";

export async function getToken() { return AsyncStorage.getItem(TOKEN_KEY); }
export async function setToken(t) { if (t) await AsyncStorage.setItem(TOKEN_KEY, t); }

export async function loginWithPassword(email, password) {
  const url = `${BASE_URL}/auth/login`;
  console.log("[auth] login URL =", url);

  const tryReq = async (body) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await r.text(); // 원문 확보
    console.log("[auth] status =", r.status, "ct =", r.headers.get("content-type"));
    console.log("[auth] raw =", text?.slice(0, 300));
    let data = {};
    try { data = JSON.parse(text); } catch {}
    return { ok: r.ok, status: r.status, data, raw: text };
  };

  // 1차: email/password
  let res = await tryReq({ email, password });
  if (!res.ok) {
    // 2차: username/password (서버가 username을 받을 수도 있으니 재시도)
    res = await tryReq({ username: email.split("@")[0], password });
  }

  if (!res.ok) {
    throw new Error(res?.data?.error || `Login failed (HTTP ${res.status})`);
  }

  const token = res?.data?.token;
  if (!token) throw new Error("No token in login response");
  await setToken(token);
  return token;
}

export async function ensureAuthDev() {
  let t = await getToken();
  if (t) return t;
  return loginWithPassword("test@test.com", "test");
}