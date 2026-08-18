// File Path: /src/utils/format.tsx
// Dynamic currency and date formatting helpers based on user preferences in profile
import { useState, useEffect } from "react";
import { type Order } from "../types";
import { 
  setSharedFormatConfig, 
  getSharedCurrencySymbol, 
  formatPriceShared, 
  getSharedDateFormat, 
  formatDateShared 
} from "../../shared/format";

export function setFormatConfig(currency: string, dateFormat: string) {
  setSharedFormatConfig(currency, dateFormat);
}

export function getCurrencySymbol(): string {
  return getSharedCurrencySymbol();
}

export function formatPrice(amount: number | null | undefined): string {
  return formatPriceShared(amount);
}

export function getDateFormat(): string {
  return getSharedDateFormat();
}

export function formatDate(dateString: string): string {
  return formatDateShared(dateString);
}

// Centered Display Hook for standardized date and currency rendering
export function useFormat() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleSettingsChange = () => {
      setTick((t) => t + 1);
    };

    window.addEventListener("floura_settings_changed", handleSettingsChange);
    return () => {
      window.removeEventListener("floura_settings_changed", handleSettingsChange);
    };
  }, []);

  return {
    currency: getCurrencySymbol(),
    dateFormat: getDateFormat(),
    formatPrice,
    formatDate,
  };
}

// Centralized components for standardized and consistent rendering
export function FormattedPrice({ amount, className = "" }: { amount: number | null | undefined; className?: string }) {
  const { formatPrice } = useFormat();
  return <span className={className} id={`fmt-price-${Math.random().toString(36).substr(2, 5)}`}>{formatPrice(amount)}</span>;
}

export function FormattedDate({ dateString, className = "" }: { dateString: string; className?: string }) {
  const { formatDate } = useFormat();
  return <span className={className} id={`fmt-date-${Math.random().toString(36).substr(2, 5)}`}>{formatDate(dateString)}</span>;
}

export function getOrderSeqId(orderId: string, allOrders: Order[]): string {
  if (!orderId) return "GT000";
  const sorted = [...allOrders]
    .filter(o => o.isDeleted !== 1)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return a.id.localeCompare(b.id);
    });
  const index = sorted.findIndex(o => o.id === orderId);
  if (index === -1) {
    const match = orderId.match(/\d+/);
    return "GT" + (match ? match[0].padStart(3, "0") : "001");
  }
  return "GT" + String(index + 1).padStart(3, "0");
}
