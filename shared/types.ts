// File Path: /shared/types.ts
export interface Customer {
  id: string; // uuid or client-generated unique id
  name: string;
  mobile: string;
  type: 'Frequent' | 'New' | 'Corporate';
  totalOrders: number;
  memberSince: string; // YYYY-MM-DD
  updatedAt: string; // ISO string
  isDeleted?: number;
}

export interface PaymentInstallment {
  id: string;
  amount: number;
  date: string; // ISO string
  method: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  eventType: string; // e.g., 'Birthday', 'Anniversary', 'Wedding', etc.
  eventDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime: string; // HH:MM
  venueAddress: string;
  cakeShape: string; // 'Round' | 'Square' | 'Heart' | 'Custom'
  cakeWeight: string; // '0.5 kg' | '1.0 kg' | '2.0 kg' | '3.0 kg' | 'Custom'
  cakeFlavor: string; // 'Belgian Chocolate', 'French Vanilla', 'Red Velvet', 'Butterscotch', 'Biscoff'
  preference: 'Egg' | 'Eggless';
  layers: 'Single' | 'Double Tier' | 'Triple Tier';
  cakeInscription: string;
  referenceImage: string; // base64 or placeholder URL
  specialInstructions: string;
  basePrice: number;
  decorationCharge: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'Pending' | 'Ordered Ingredients' | 'In Progress' | 'Decorating' | 'Ready for Pickup' | 'Completed' | 'Cancelled';
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  paidAmount?: number;
  paymentHistory?: PaymentInstallment[];
  profitAmount?: number;
  profitDifficulties?: string;
  profitCostGoing?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isDeleted?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  supplier: string;
  costPrice: number;
  updatedAt: string; // ISO string
  isDeleted?: number;
}

export interface RecipeIngredient {
  name: string;
  qty: number; // base qty for standard yield
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  stdYield: number; // standard yield in grams/kg
  yieldUnit: string;
  ingredients: RecipeIngredient[];
  imageUrl?: string;
  updatedAt: string; // ISO string
  isDeleted?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  date: string; // YYYY-MM-DD
  completedDates?: string[];
  updatedAt: string;
  isDeleted?: number;
}

export interface CustomEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: "event" | "reminder" | "preparation" | "alert";
  notes: string;
  createdAt: string;
  localChange?: number;
  isDeleted?: number;
}

export interface DispatchedNotification {
  id: string;
  customerName: string;
  customerMobile: string;
  cakeSpec: string;
  messageText: string;
  dispatchedAt: string;
  status: "Sent" | "Queued" | "Delivered";
  localChange?: number;
  isDeleted?: number;
}

export interface CustomScheduledAlert {
  id: string;
  customerName: string;
  customerMobile: string;
  alertDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string;
  type?: "repeated event" | "once alert";
  localChange?: number;
  isDeleted?: number;
}

export interface BakeryProfile {
  id: string;
  bakeryName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  currency: string;
  dateFormat: string;
  updatedAt: string;
  localChange?: number;
  isDeleted?: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'recipe' | 'inventory';
  updatedAt: string; // ISO string
  isDeleted?: number;
}

export interface SyncPayload {
  customers: Customer[];
  orders: Order[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  checklist: ChecklistItem[];
  customEvents: CustomEvent[];
  dispatchedNotifications: DispatchedNotification[];
  scheduledAlerts: CustomScheduledAlert[];
  bakeryProfile?: BakeryProfile[];
  categories?: Category[];
  lastSyncTime: string; // ISO string
}

export interface SyncResponse {
  status: 'success';
  customers: Customer[];
  orders: Order[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  checklist: ChecklistItem[];
  customEvents: CustomEvent[];
  dispatchedNotifications: DispatchedNotification[];
  scheduledAlerts: CustomScheduledAlert[];
  bakeryProfile?: BakeryProfile[];
  categories?: Category[];
  syncTime: string;
}
