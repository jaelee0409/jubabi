export function formatCorpName(name: string): string {
  const maxLength = 16; // 16번째 자리에 '…' 들어가게
  return name.length > maxLength ? name.slice(0, maxLength) + "…" : name;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours < 12 ? "오전" : "오후";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  if (isToday) {
    return `${ampm} ${displayHour}:${minutes}`;
  } else if (isYesterday) {
    return `어제 ${ampm} ${displayHour}:${minutes}`;
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day} ${ampm} ${displayHour}:${minutes}`;
  }
}
