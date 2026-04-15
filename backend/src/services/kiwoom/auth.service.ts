// import { getAccessToken, invalidateToken } from "./tokenManager";

// // 접근토큰 발급
// export async function getKiwoomAccessToken() {
//   try {
//     const token = await getAccessToken();
//     // 보안상 토큰을 직접 프론트에 주지 않는 게 일반적임. 필요 시 서버 내부 전용으로 사용.
//     return { token };
//   } catch (e) {
//     invalidateToken();
//     throw e;
//   }
// }
