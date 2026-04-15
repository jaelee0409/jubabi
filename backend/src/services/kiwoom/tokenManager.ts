// import { ENV } from "../../config/env";

// type TokenBundle = {
//   token: string; // 응답의 `token` 필드와 매핑
//   token_type: string;
//   expires_dt: string; // "YYYYMMDDHHMMSS" 형식
//   return_code: number;
//   return_msg: string;
// };

// const HOST = ENV.KIWOOM_API_HOST || "https://api.kiwoom.com";
// const TOKEN_ENDPOINT = "/oauth2/token";

// // 만료 여유(스큐): 만료 5분 전이면 새로 발급
// const REFRESH_SKEW_MS = 5 * 60 * 1000;

// let cachedToken: string | null = null;
// let expireAt = 0; // ms epoch
// let inflight: Promise<string> | null = null;

// /** "YYYYMMDDHHmmss" (KST) -> epoch(ms) */
// function parseExpiresDtKST(s: string): number {
//   // 20241107083713 => 2024-11-07T08:37:13+09:00
//   if (!/^\d{14}$/.test(s)) return Date.now() + 24 * 60 * 60 * 1000;
//   const Y = s.slice(0, 4);
//   const M = s.slice(4, 6);
//   const D = s.slice(6, 8);
//   const h = s.slice(8, 10);
//   const m = s.slice(10, 12);
//   const sec = s.slice(12, 14);
//   const iso = `${Y}-${M}-${D}T${h}:${m}:${sec}+09:00`;
//   const t = Date.parse(iso);
//   return Number.isNaN(t) ? Date.now() + 24 * 60 * 60 * 1000 : t;
// }

// async function requestNewToken(): Promise<TokenBundle> {
//   const body = {
//     grant_type: "client_credentials",
//     appkey: ENV.KIWOOM_APP_KEY,
//     secretkey: ENV.KIWOOM_APP_SECRET,
//   };

//   const res = await fetch(`${HOST}${TOKEN_ENDPOINT}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json;charset=UTF-8" },
//     body: JSON.stringify(body),
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(`Token request failed: HTTP ${res.status} ${text}`);
//   }

//   const data = (await res.json()) as TokenBundle;
//   if (data.return_code !== 0) {
//     throw new Error(`Token request failed: ${data.return_msg}`);
//   }
//   return data;
// }

// /** 유효 토큰 반환(캐시/갱신 자동) */
// export async function getAccessToken(): Promise<string> {
//   const now = Date.now();
//   if (cachedToken && now + REFRESH_SKEW_MS < expireAt) {
//     return cachedToken;
//   }
//   if (inflight) return inflight;

//   inflight = (async () => {
//     const { token, expires_dt } = await requestNewToken();
//     cachedToken = token;
//     expireAt = parseExpiresDtKST(expires_dt);
//     return token;
//   })();

//   try {
//     return await inflight;
//   } finally {
//     inflight = null;
//   }
// }

// /** 강제 무효화(에러 시 재시도 위해) */
// export function invalidateToken() {
//   cachedToken = null;
//   expireAt = 0;
// }
