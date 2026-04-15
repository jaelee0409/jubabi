import { companiesCache } from "../cache/companiesCache";

export function searchCompanies(query: string) {
  if (!query) return [];

  const q = query.toLowerCase();
  const companies = companiesCache.getAll();

  // 1. exact match
  const exact = companies.filter(
    (c) =>
      c.corpCode?.toLowerCase() === q ||
      c.stockCode?.toLowerCase() === q ||
      c.name?.toLowerCase() === q
  );

  // 2. prefix match
  const prefix = companies.filter(
    (c) =>
      c.corpCode?.toLowerCase().startsWith(q) ||
      c.stockCode?.toLowerCase().startsWith(q) ||
      c.name?.toLowerCase().startsWith(q)
  );

  // 3. partial match
  const partial = companies.filter(
    (c) =>
      c.corpCode?.toLowerCase().includes(q) ||
      c.stockCode?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q)
  );

  // 중복 제거 후 합치기
  const seen = new Set<string>();
  const merged = [...exact, ...prefix, ...partial].filter((c) => {
    if (seen.has(c.corpCode)) return false;
    seen.add(c.corpCode);
    return true;
  });

  return merged.slice(0, 20); // 상위 20개만
}
