import { apiFetch } from "./apiFetch";

export async function findCorpByCorpCode(corpCode: string) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/companies/lookup?corpCode=${encodeURIComponent(corpCode)}`
  );
  if (!response.ok) throw new Error("Failed to fetch company");
  return response.json();
}

export const fetchCompanyDisclosures = async (companyCorpCode: string) => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/disclosures/company/${companyCorpCode}`
  );
  if (!response.ok) throw new Error(`Error fetching company disclosures: ${response.statusText}`);
  return response.json();
};

export async function fetchUnreadNotificationsCount() {
  const response = await apiFetch("/api/notifications/unread");
  return response.json();
}
