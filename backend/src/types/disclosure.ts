interface SupplyContract {
  category: "KOSPI" | "KOSDAQ";
  contractType?: string; // 계약 구분 (공사수주, 기타 등)
  contractName?: string; // 체결 계약명
  contractAmount?: number; // 계약금액
  conditionalAmount?: number; // 조건부 계약금액 (코스닥)
  totalAmount?: number; // 총액 (코스닥)
  recentSales?: number; // 최근 매출액
  salesRatio?: number; // 매출액 대비 %
  largeCorp?: string; // 대규모법인 여부
  counterparty?: {
    name: string;
    relation?: string;
    recentSales?: number;
    business?: string;
    last3Years?: string;
  };
  region?: string;
  period?: { start?: string; end?: string };
  conditions?: { advancePayment?: string; paymentTerms?: string };
  supplyMethod?: { inhouse?: string; outsourcing?: string; etc?: string }; // 코스닥 only
  contractDate?: string;
  disclosureHold?: { reason?: string; until?: string };
  notes?: string[];
  related?: string[];
}
