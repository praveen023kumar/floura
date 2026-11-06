export interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  category: string;
  title?: string;
  message: string;
  rating: number;
  imageUrl?: string;
  status: "Pending" | "In Progress" | "Resolved" | "Spam";
  createdAt: string;
}

export interface AdminUserItem {
  email: string;
  name: string;
  role: "superadmin" | "admin";
  permissions: string[];
  createdAt: string;
}

export interface RegisteredUserItem {
  email: string;
  name: string;
  avatar: string;
  createdAt: string;
  is_active: number;
  subscription_status: string;
  subscription_expires_at: string;
  last_payment_date?: string;
  orders_count: number;
  bakery_name?: string;
  phone?: string;
}

export interface PaymentLogItem {
  id: string;
  user_email: string;
  user_name?: string;
  amount: number;
  currency: string;
  months: number;
  payment_method: string;
  reference_id?: string;
  razorpay_order_id?: string;
  status: "success" | "failed" | "pending";
  failure_reason?: string;
  notes?: string;
  recorded_by: string;
  createdAt: string;
}

export interface AdminUser {
  name: string;
  email: string;
  avatar: string;
  token?: string;
  role?: string;
  permissions?: string[];
}
