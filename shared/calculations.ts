// File Path: /shared/calculations.ts
import { Order, InventoryItem, Recipe, RecipeIngredient, PaymentInstallment } from "./types";

/**
 * Calculates the total paid amount of an order from its payment history installments.
 */
export function calculatePaidAmount(paymentHistory: PaymentInstallment[] | undefined): number {
  if (!paymentHistory || !Array.isArray(paymentHistory)) return 0;
  return paymentHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

/**
 * Determines the payment status of an order based on total amount and paid amount.
 */
export function getPaymentStatus(totalAmount: number, paidAmount: number): "Unpaid" | "Partially Paid" | "Fully Paid" {
  if (paidAmount >= totalAmount && totalAmount > 0) return "Fully Paid";
  if (paidAmount > 0) return "Partially Paid";
  return "Unpaid";
}

/**
 * Calculates the total amount of an order.
 */
export function calculateOrderTotal(basePrice: number, decorationCharge: number, deliveryFee: number): number {
  return (Number(basePrice) || 0) + (Number(decorationCharge) || 0) + (Number(deliveryFee) || 0);
}

/**
 * Scales recipe ingredients based on a target yield and standard yield.
 */
export interface ScaledIngredient {
  name: string;
  originalQty: number;
  scaledQty: number;
}

export function scaleRecipeIngredients(recipe: Recipe, targetYield: number): ScaledIngredient[] {
  if (!recipe || recipe.stdYield <= 0 || isNaN(targetYield) || targetYield <= 0) {
    return recipe.ingredients.map(ing => ({
      name: ing.name,
      originalQty: ing.qty,
      scaledQty: ing.qty
    }));
  }

  // Normalize standard yield with its unit using parseWeightToGrams
  const stdYieldStr = `${recipe.stdYield} ${recipe.yieldUnit || "kg"}`;
  const stdVal = parseWeightToGrams(stdYieldStr);

  const ratio = stdVal > 0 ? (targetYield / stdVal) : 1;
  return recipe.ingredients.map(ing => ({
    name: ing.name,
    originalQty: ing.qty,
    scaledQty: Number((ing.qty * ratio).toFixed(1))
  }));
}

/**
 * Computes dashboard statistics from active tables.
 */
export interface DashboardStats {
  completedOrdersCount: number;
  activeOrdersCount: number;
  lowStockCount: number;
  totalRevenue: number;
  pendingPaymentCount: number;
}

export function computeDashboardStats(
  orders: Order[],
  inventory: InventoryItem[]
): DashboardStats {
  const activeStatuses = ["Pending", "Ordered Ingredients", "Processing", "Decorating", "Ready for Pickup"];
  
  const completedOrders = orders.filter(o => o.status === "Completed" && o.isDeleted !== 1);
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status) && o.isDeleted !== 1);
  const lowStock = inventory.filter(item => item.quantity < item.minStockLevel && item.isDeleted !== 1);

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const pendingPaymentCount = orders.filter(o => {
    if (o.isDeleted === 1 || o.status === "Cancelled") return false;
    const paid = calculatePaidAmount(o.paymentHistory);
    return paid < o.totalAmount;
  }).length;

  return {
    completedOrdersCount: completedOrders.length,
    activeOrdersCount: activeOrders.length,
    lowStockCount: lowStock.length,
    totalRevenue,
    pendingPaymentCount
  };
}

/**
 * Helper to parse weight/quantity string (e.g. "2.0 kg", "12 Pieces") to numeric value (grams or unit count).
 */
export function parseWeightToGrams(weightStr: string): number {
  if (!weightStr) return 1000;
  const clean = weightStr.toLowerCase().replace(/,/g, '');
  const numMatch = clean.match(/([\d.]+)/);
  if (!numMatch) return 1000;
  const num = parseFloat(numMatch[1]);
  if (isNaN(num)) return 1000;
  if (clean.includes("kg") || clean.includes("kilo")) {
    return num * 1000;
  }
  return num;
}
