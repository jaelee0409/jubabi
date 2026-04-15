import { ENV } from "../config/env";
import { disclosures } from "../db/schema";
import { DartDisclosureParams } from "../types/dartApi";

export const DART_CONFIG = {
  BASE_URL: "https://opendart.fss.or.kr/api",
  API_KEY: ENV.DART_API_KEY,
};

export const fetchCompanyCode = async () => {
  const endpoint = `${DART_CONFIG.BASE_URL}/corpCode.xml?crtfc_key=${DART_CONFIG.API_KEY}`;

  const response = await fetch(endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DART API fetchCompanyInfo error:", errorText);
    throw new Error(`Error fetching company info: ${response.statusText}`);
  }

  return response;
};

export const fetchCompanyInfo = async ({
  corp_code,
}: {
  corp_code: string;
}) => {
  const endpoint = `${DART_CONFIG.BASE_URL}/company.json?crtfc_key=${DART_CONFIG.API_KEY}&corp_code=${corp_code}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DART API fetchCompanyInfo error:", errorText);
    throw new Error(`Error fetching company info: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
};

export const fetchCompanyDisclosures = async (params: DartDisclosureParams) => {
  const query = new URLSearchParams(
    Object.entries({
      crtfc_key: DART_CONFIG.API_KEY,
      ...params,
    })
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );

  const endpoint = `${DART_CONFIG.BASE_URL}/list.json?${query.toString()}`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DART API fetchCompanyDisclosures error:", errorText);
    throw new Error(
      `Error fetching company disclosures: ${response.statusText}`
    );
  }

  console.log("Fetched disclosures API");

  const data = await response.json();

  return data;
};

// export const fetchRecentDisclosuresAndInsertDB = async () => {
//   try {
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);

//     // YYYYMMDD 형식으로 변환
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, "0");
//     const day = String(today.getDate()).padStart(2, "0");
//     const yyyymmdd = `${year}${month}${day}`;

//     const newDisclosures = await fetchCompanyDisclosures({
//       // bgn_de: yyyymmdd,
//       // end_de: yyyymmdd,
//       page_no: 1,
//       page_count: 20,
//     });

//     for (const item of newDisclosures.list || []) {
//       const exists = await db.query.disclosures.findFirst({
//         where: (disclosures, { eq }) =>
//           eq(disclosures.receiptNumber, item.rcept_no),
//       });

//       if (!exists) {
//         console.log(
//           "New disclosure found",
//           item.corp_name,
//           item.stock_code,
//           item.report_nm,
//           item.rcept_no,
//           item.rpt_dt
//         );

//         await db.insert(disclosures).values({
//           receiptNumber: item.rcept_no,
//           // companyCorpCode: item.corp_code,
//           // companyStockCode: item.stock_code || null,
//           title: item.report_nm,
//           disclosedAt: item.rpt_dt,
//         });

//         const corpName = item.corp_name || "";

//         // await sendPushNotification({
//         //   title: `[${corpName}] 새 공시`,
//         //   body: item.report_nm,
//         //   data: { receiptNumber: item.rcept_no },
//         // });
//       }
//     }
//   } catch (err) {
//     console.error("Cron job error:", err);
//   }
// };
