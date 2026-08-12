// File Path: /shared/format.ts
let activeCurrency = "$";
let activeDateFormat = "YYYY-MM-DD";

export function setSharedFormatConfig(currency: string, dateFormat: string) {
  if (currency) activeCurrency = currency;
  if (dateFormat) activeDateFormat = dateFormat;
}

export function getSharedCurrencySymbol(): string {
  return activeCurrency;
}

export function formatPriceShared(amount: number | null | undefined): string {
  const symbol = getSharedCurrencySymbol();
  const val = typeof amount === "number" ? amount : (amount ? Number(amount) : 0) || 0;
  return `${symbol}${val.toFixed(2)}`;
}

export function getSharedDateFormat(): string {
  return activeDateFormat;
}

export function formatDateShared(dateString: string): string {
  if (!dateString) return "";
  
  // Check if string contains time information (indicated by T or :)
  const hasTime = dateString.includes("T") || dateString.includes(":");
  if (hasTime) {
    try {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const r = String(d.getDate()).padStart(2, "0");
        const datePart = formatWithParts(y, m, r);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${datePart} ${hh}:${mm}`;
      }
    } catch {
      // Fallback below
    }
  }

  const parts = dateString.split("-");
  if (parts.length !== 3) {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const r = String(d.getDate()).padStart(2, "0");
      return formatWithParts(y, m, r);
    } catch {
      return dateString;
    }
  }

  const [year, month, day] = parts;
  return formatWithParts(Number(year), month, day);
}

function formatWithParts(year: number, month: string, day: string): string {
  const fmt = getSharedDateFormat();
  if (fmt === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  }
  if (fmt === "MM/DD/YYYY") {
    return `${month}/${day}/${year}`;
  }
  return `${year}-${month}-${day}`;
}
