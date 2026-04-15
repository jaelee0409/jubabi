type MarketCode = "Y" | "K" | "N" | "E" | undefined;

interface ParsedDisclosureTitle {
  market: MarketCode; // KOSPI, 코스닥, KONEX, etc.
  companyName: string; // 회사명
  correctionType?: CorrectionType; // e.g. "기재정정"
  disclosureTitle: string;
  category?: string;
  type: string;
}

const CORRECTION_KEYWORDS = [
  "기재정정",
  "첨부정정",
  "첨부추가",
  "변경등록",
  "연장결정",
  "발행조건확정",
  "정정명령부과",
  "정정제출요구",
] as const;

type CorrectionType = (typeof CORRECTION_KEYWORDS)[number];

function normalizeMarket(market?: string): MarketCode {
  if (!market) return undefined;
  if (market.includes("유가") || market.includes("코스피")) return "Y";
  if (market.includes("코스닥")) return "K";
  if (market.toUpperCase().includes("KONEX") || market.includes("코넥스"))
    return "N";
  return "E"; // 기타
}

export function parseDisclosureTitle(rawTitle: string): ParsedDisclosureTitle {
  let title = rawTitle.trim();

  // 1. Market
  let marketString: string | undefined;
  const marketMatch = title.match(/^\((.*?)\)/);
  if (marketMatch) {
    marketString = marketMatch[1];
    title = title.replace(marketMatch[0], "").trim();
  }
  const market = normalizeMarket(marketString);

  // 2. Company name
  let companyName = "";
  let rest = title;
  const dashIndex = title.indexOf(" - ");
  if (dashIndex !== -1) {
    companyName = title.slice(0, dashIndex).trim();
    rest = title.slice(dashIndex + 3).trim();
  }

  // [기재정정] : 본 보고서명으로 이미 제출된 보고서의 기재내용이 변경되어 제출된 것임
  // [첨부정정] : 본 보고서명으로 이미 제출된 보고서의 첨부내용이 변경되어 제출된 것임
  // [첨부추가] : 본 보고서명으로 이미 제출된 보고서의 첨부서류가 추가되어 제출된 것임
  // [변경등록] : 본 보고서명으로 이미 제출된 보고서의 유동화계획이 변경되어 제출된 것임
  // [연장결정] : 본 보고서명으로 이미 제출된 보고서의 신탁계약이 연장되어 제출된 것임
  // [발행조건확정] : 본 보고서명으로 이미 제출된 보고서의 유가증권 발행조건이 확정되어 제출된 것임
  // [정정명령부과] : 본 보고서에 대하여 금융감독원이 정정명령을 부과한 것임
  // [정정제출요구] : 본 보고서에 대하여 금융감독원이 정정제출요구을 부과한 것임
  // 3. Correction type
  let correctionType: CorrectionType | undefined;
  for (const keyword of CORRECTION_KEYWORDS) {
    if (rest.includes(keyword)) {
      correctionType = keyword;
      rest = rest.replace(`[${keyword}]`, "").trim();
      break;
    }
  }

  const disclosureTitle = rest;

  // 4. Type
  // 단일판매ㆍ공급계약체결
  // 투자설명서
  // 기타시장안내
  // 주주총회소집결의
  // 주요사항보고서
  // 효력발생안내
  // 주주명부폐쇄기간또는기준일설정
  // 경영권변경등에관한계약체결
  // 불성실공시법인지정예고
  // 증권신고서
  // 타법인주식및출자증권취득결정
  // 일괄신고추가서류
  // 소송등의제기ㆍ신청
  // 주권매매거래정지기간변경
  // 타인에대한채무보증결정
  // 특수관계인과의수익증권거래
  // 주식매수선택권부여에관한신고
  // 전환사채발행후만기전사채취득
  // 합병등종료보고서
  // 증권발행결과
  // 임원ㆍ주요주주특정증권등거래계획보고서
  // 회사합병
  // 주식조각결정
  const type = rest.replace(/\(.*?\)/g, "").trim();

  // 5. Map to broad category
  let category: string = "기타";
  if (/배당|자기주식|주주환원/.test(type)) {
    category = "주주 환원 정책";
  } else if (/유상증자|무상증자|감자|증자|소각/.test(type)) {
    category = "자본 구조";
  } else if (/최대주주|주요주주|임원|지분|5%/.test(type)) {
    category = "지분 구조";
  } else if (/단일판매|공급계약체결/.test(type)) {
    category = "영업/사업 관련";
  }

  return {
    market: market ?? "E",
    companyName,
    correctionType,
    disclosureTitle,
    type,
    category,
  };
}
