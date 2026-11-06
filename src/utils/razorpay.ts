// File Path: /src/utils/razorpay.ts
import { getApiUrl } from "./api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface SubscriptionPlan {
  id: string;
  months: number;
  name: string;
  price: number;
  currency: string;
  discount: number;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "1_month", months: 1, name: "1 Month Pro", price: 99, currency: "INR", discount: 0, description: "Monthly Bakery Pro Access" },
  { id: "3_months", months: 3, name: "3 Months Pro", price: 269, currency: "INR", discount: 10, description: "Quarterly Access (Save 10%)" },
  { id: "6_months", months: 6, name: "6 Months Pro", price: 499, currency: "INR", discount: 15, description: "Half-Year Access (Save 15%)" },
  { id: "12_months", months: 12, name: "12 Months Pro", price: 899, currency: "INR", discount: 25, description: "Annual Access (Save 25%)" }
];

export interface PaymentConfigResponse {
  status: string;
  keyId: string;
  isLive: boolean;
  isConfigured: boolean;
  currency: string;
  plans: SubscriptionPlan[];
}

/**
 * Dynamically load Razorpay standard checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("[Razorpay] Failed to load checkout.js");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Fetch public payment configuration and active subscription plans
 */
export async function fetchPaymentConfig(): Promise<PaymentConfigResponse | null> {
  try {
    const res = await fetch(`${getApiUrl()}/api/payment/config`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error("[Payment Config] Error fetching config:", err);
    return null;
  }
}

export interface InitiatePaymentParams {
  userEmail: string;
  userName?: string;
  userPhone?: string;
  planId?: string;
  customMonths?: number;
  customAmount?: number;
  onSuccess: (data: {
    status: string;
    message: string;
    newExpiry: string;
    paymentId: string;
    user?: any;
  }) => void;
  onError: (errorMessage: string) => void;
  onDismiss?: () => void;
}

/**
 * Initiate Razorpay checkout flow with automated order creation and backend signature verification
 */
export async function initiateRazorpayPayment(params: InitiatePaymentParams) {
  const {
    userEmail,
    userName,
    userPhone,
    planId,
    customMonths,
    customAmount,
    onSuccess,
    onError,
    onDismiss
  } = params;

  try {
    // 1. Create order on Express backend
    const orderRes = await fetch(`${getApiUrl()}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail,
        planId,
        customMonths,
        customAmount
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || orderData.status !== "success") {
      onError(orderData.error || "Failed to create payment order. Please try again.");
      return;
    }

    // 2. Load Razorpay Checkout SDK
    const scriptLoaded = await loadRazorpayScript();

    // Simulation Fallback (e.g. if script is blocked or keys are simulated)
    if (!scriptLoaded || orderData.isSimulation) {
      if (orderData.isSimulation) {
        const confirmSim = window.confirm(
          `[Razorpay Test Mode]\n\nReady to activate ${orderData.planName} (₹${orderData.amount / 100}) for ${userEmail}?\n\nClick OK to simulate successful payment and instantly extend your subscription.`
        );

        if (!confirmSim) {
          onDismiss?.();
          return;
        }

        // Verify simulated payment
        const verifyRes = await fetch(`${getApiUrl()}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: "simulated_signature",
            userEmail,
            months: orderData.months,
            amount: orderData.amount / 100,
            planName: orderData.planName
          })
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.status === "success") {
          onSuccess(verifyData);
        } else {
          onError(verifyData.error || "Simulated payment verification failed.");
        }
        return;
      }

      onError("Unable to load secure Razorpay checkout. Please check your internet connection.");
      return;
    }

    // 3. Configure and open Razorpay modal
    const options: any = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "Floura",
      description: `Bakery Pro Subscription - ${orderData.planName}`,
      image: "/favicon.png",
      order_id: orderData.orderId,
      prefill: {
        name: userName || "",
        email: userEmail,
        contact: userPhone || ""
      },
      notes: {
        userEmail,
        months: String(orderData.months),
        planName: orderData.planName
      },
      theme: {
        color: "#be185d" // Floura brand rose
      },
      handler: async function (response: any) {
        try {
          const verifyRes = await fetch(`${getApiUrl()}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userEmail,
              months: orderData.months,
              amount: orderData.amount / 100,
              planName: orderData.planName
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.status === "success") {
            onSuccess(verifyData);
          } else {
            onError(verifyData.error || "Payment verification failed. Please contact support.");
          }
        } catch (e: any) {
          console.error("[Razorpay Verify Error]:", e);
          onError("Failed to communicate with verification server. Please contact support.");
        }
      },
      modal: {
        ondismiss: function () {
          fetch(`${getApiUrl()}/api/payment/failed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail,
              amount: orderData.amount / 100,
              months: orderData.months,
              orderId: orderData.orderId,
              errorCode: "MODAL_DISMISSED",
              errorDescription: "Customer closed the checkout window."
            })
          }).catch(() => {});
          onDismiss?.();
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (response: any) {
      console.warn("[Razorpay Payment Failed]:", response.error);
      const err = response.error || {};
      fetch(`${getApiUrl()}/api/payment/failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          amount: orderData.amount / 100,
          months: orderData.months,
          orderId: orderData.orderId,
          paymentId: err.metadata?.payment_id || "",
          errorCode: err.code || "PAYMENT_FAILED",
          errorDescription: err.description || err.reason || "Payment declined or failed"
        })
      }).catch(() => {});

      onError(err.description || "Payment failed. Please try a different card or UPI ID.");
    });

    rzp.open();
  } catch (err: any) {
    console.error("[Razorpay Checkout Exception]:", err);
    onError(err.message || "Failed to initialize checkout.");
  }
}
