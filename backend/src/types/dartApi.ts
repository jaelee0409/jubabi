export type DartBase = {
  status: string; // "013", "000" 등
  message: string;
};

export type DartDisclosureParams = {
  corp_code?: string;
  bgn_de?: string;
  end_de?: string;
  last_reprt_at?: "Y" | "N";
  pblntf_ty?: string;
  pblntf_detail_ty?: string;
  corp_cls?: string;
  sort?: "date" | "crp" | "rpt";
  sort_mth?: "asc" | "desc";
  page_no?: number;
  page_count?: number;
};

export type DartDisclosure = DartBase & {
  corp_code?: string;
};

export type DartCompany = DartBase & {
  corp_code?: string;
  corp_name?: string;
  stock_code?: string | null;
  ceo_nm?: string;
  corp_cls?: "Y" | "K" | "N"; // 유가/코스닥/기타
};
