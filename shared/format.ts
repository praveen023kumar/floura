export function normalizeCurrency(c: string | null | undefined): string {
  if (!c) return "$";
  const clean = c.trim().toUpperCase();
  if (clean === "INR" || clean === "RS" || clean === "RS." || clean === "₹") return "₹";
  if (clean === "USD" || clean === "$") return "$";
  if (clean === "EUR" || clean === "€") return "€";
  if (clean === "GBP" || clean === "£") return "£";
  if (clean === "JPY" || clean === "CNY" || clean === "¥") return "¥";
  if (clean === "KRW" || clean === "₩") return "₩";
  return c;
}

const getInitialCurrency = (): string => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem("floura_currency") || window.localStorage.getItem("patisserie_currency");
      if (stored) return normalizeCurrency(stored);
    } catch {}
  }
  return "$";
};

const getInitialDateFormat = (): string => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem("floura_date_format") || window.localStorage.getItem("patisserie_date_format");
      if (stored && (stored === "DD/MM/YYYY" || stored === "MM/DD/YYYY" || stored === "YYYY-MM-DD")) {
        return stored;
      }
    } catch {}
  }
  return "YYYY-MM-DD";
};

let activeCurrency = getInitialCurrency();
let activeDateFormat = getInitialDateFormat();

export function setSharedFormatConfig(currency: string, dateFormat: string) {
  if (currency) {
    activeCurrency = normalizeCurrency(currency);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("floura_currency", activeCurrency);
      } catch {}
    }
  }
  if (dateFormat && !dateFormat.startsWith("__GCM__") && !dateFormat.startsWith("__ENC__")) {
    activeDateFormat = dateFormat;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("floura_date_format", dateFormat);
      } catch {}
    }
  }
}

export function getSharedCurrencySymbol(): string {
  if (!activeCurrency || activeCurrency.startsWith("__GCM__") || activeCurrency.startsWith("__ENC__")) {
    return "$";
  }
  return normalizeCurrency(activeCurrency);
}

export function formatPriceShared(amount: number | null | undefined): string {
  const symbol = getSharedCurrencySymbol();
  const val = typeof amount === "number" ? amount : (amount ? Number(amount) : 0) || 0;
  return `${symbol}${val.toFixed(2)}`;
}

export function getSharedDateFormat(): string {
  if (!activeDateFormat || activeDateFormat.startsWith("__GCM__") || activeDateFormat.startsWith("__ENC__")) {
    return "YYYY-MM-DD";
  }
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
