import AdmZip from "adm-zip";
import { ENV } from "../config/env";
import * as cheerio from "cheerio";

// DART 뷰어 페이지에서 실제 문서 URL을 찾아 텍스트 추출
async function fetchFromViewer(rcpNo: string): Promise<string> {
  // 1. 뷰어 페이지 로드
  const viewerUrl = `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rcpNo}`;
  const viewerRes = await fetch(viewerUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!viewerRes.ok) throw new Error("DART 뷰어 페이지를 불러올 수 없습니다.");

  const viewerHtml = await viewerRes.text();
  const $viewer = cheerio.load(viewerHtml);

  // 2. 문서 iframe src 추출
  let docUrl: string | null = null;

  // iframe에서 찾기
  $viewer("iframe").each((_, el) => {
    const src = $viewer(el).attr("src");
    if (src && src.includes("dart.fss.or.kr")) {
      docUrl = src.startsWith("http") ? src : `https://dart.fss.or.kr${src}`;
    }
  });

  // JavaScript에서 URL 패턴 찾기
  if (!docUrl) {
    const match = viewerHtml.match(/https?:\/\/dart\.fss\.or\.kr\/report\/viewer[^"'\s]*/);
    if (match) docUrl = match[0];
  }

  if (!docUrl) throw new Error("공시 문서 URL을 찾을 수 없습니다.");

  // 3. 실제 문서 HTML 로드
  const docRes = await fetch(docUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!docRes.ok) throw new Error("공시 문서를 불러올 수 없습니다.");

  const docHtml = await docRes.text();
  return extractText(docHtml);
}

// HTML에서 텍스트 추출
function extractText(html: string): string {
  const $ = cheerio.load(html);

  // 스크립트/스타일 제거
  $("script, style, head").remove();

  // 테이블 데이터 추출
  const tableText: string[] = [];
  $("table tr").each((_, el) => {
    const cells = $(el)
      .find("td, th")
      .map((_, td) => $(td).text().trim())
      .get()
      .filter((c) => c.length > 0);
    if (cells.length > 0) tableText.push(cells.join(" | "));
  });

  $("table").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  return [bodyText, ...tableText].join("\n").slice(0, 8000);
}

export async function fetchDocument(rcpNo: string): Promise<string> {
  // 1. 먼저 OpenAPI zip 방식 시도
  try {
    const url = `https://opendart.fss.or.kr/api/document.xml?crtfc_key=${ENV.DART_API_KEY}&rcept_no=${rcpNo}`;
    const res = await fetch(url);

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const bufferNode = Buffer.from(buffer);
      const preview = bufferNode.slice(0, 200).toString("utf-8");

      // XML 에러 응답이 아닌 경우만 zip 파싱
      if (!preview.trimStart().startsWith("<")) {
        const zip = new AdmZip(bufferNode);
        const entry = zip.getEntries().find((e) => e.entryName === `${rcpNo}.xml`);
        if (entry) {
          return extractText(entry.getData().toString("utf-8"));
        }
      }
    }
  } catch {
    // zip 방식 실패 시 뷰어 방식으로 fallback
  }

  // 2. 뷰어 스크래핑으로 fallback
  return fetchFromViewer(rcpNo);
}
