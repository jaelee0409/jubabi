const HOST = process.env.KIWOOM_API_HOST || "https://api.kiwoom.com";
const ENDPOINT = "/api/dostk/stkinfo";

interface StockInfoResponse {
  cur_prc?: string; // 현재가
  return_code: number;
  return_msg: string;
  [key: string]: any; // 나머지 필드
}

// export async function getStockInfo(
//   stockCode: string
// ): Promise<StockInfoResponse> {
//   const token = await getAccessToken();

//   const headers = {
//     "Content-Type": "application/json;charset=UTF-8",
//     authorization: `Bearer ${token}`,
//     "cont-yn": "N",
//     "next-key": "",
//     "api-id": "ka10001",
//   };

//   const body = {
//     stk_cd: stockCode,
//   };

//   const res = await fetch(`${HOST}${ENDPOINT}`, {
//     method: "POST",
//     headers,
//     body: JSON.stringify(body),
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(`Stock info request failed: ${res.status} ${text}`);
//   }

//   const json: StockInfoResponse = await res.json();

//   if (json.return_code !== 0) {
//     throw new Error(`Kiwoom error: ${json.return_msg}`);
//   }

//   return json;
// }
