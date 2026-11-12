// File Path: /src/components/PublicOrderTrackingView.tsx
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Cake,
  CheckCircle2,
  Check,
  Clock3,
  ChefHat,
  PackageCheck,
  Truck,
  AlertCircle,
  MessageCircle,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Maximize2,
  X,
  ExternalLink,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";
import { normalizeCurrency } from "../../shared/format";
import flouraLogo from "../assets/images/floura_logo.webp";

interface OrderMeta {
  orderId: string;
  seqId: string;
  bakeryName: string;
  bakeryPhone: string;
  bakeryAddress: string;
  currency: string;
  dateFormat: string;
  status: string;
  deliveryDate?: string;
  deliveryTime?: string;
  eventType?: string;
  maskedPhone: string;
}

interface VerifiedOrder {
  id: string;
  seqId: string;
  customerName: string;
  customerMobile: string;
  eventType: string;
  eventDate: string;
  deliveryDate: string;
  deliveryTime: string;
  venueAddress?: string;
  cakeFlavor: string;
  cakeShape?: string;
  cakeWeight?: string;
  layers?: string;
  preference?: string;
  cakeInscription?: string;
  referenceImage?: string;
  specialInstructions?: string;
  status: string;
  basePrice?: number;
  decorationCharge?: number;
  deliveryFee?: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface BakeryDetails {
  bakeryName: string;
  phone: string;
  email?: string;
  address: string;
  currency: string;
  dateFormat: string;
}

export default function PublicOrderTrackingView() {
  const { orderId: routeOrderId } = useParams<{ orderId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const effectiveOrderId = routeOrderId || searchParams.get("id") || "";

  const [inputOrderId, setInputOrderId] = useState("");
  const [meta, setMeta] = useState<OrderMeta | null>(null);
  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [bakery, setBakery] = useState<BakeryDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Phone verification form state
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Image modal preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch metadata on mount or orderId change
  useEffect(() => {
    if (!effectiveOrderId) {
      setLoading(false);
      return;
    }

    // Check if verified order is already stored in sessionStorage
    try {
      const cached = sessionStorage.getItem(`floura_track_${effectiveOrderId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const hasEncryptedData = 
          (typeof parsed.order?.customerName === "string" && parsed.order.customerName.startsWith("__ENC__")) ||
          (typeof parsed.bakery?.bakeryName === "string" && parsed.bakery.bakeryName.startsWith("__ENC__"));

        if (hasEncryptedData) {
          sessionStorage.removeItem(`floura_track_${effectiveOrderId}`);
        } else if (parsed.order && parsed.bakery) {
          setOrder(parsed.order);
          setBakery(parsed.bakery);
          setLoading(false);
          return;
        }
      }
    } catch {}

    const fetchMeta = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(getApiUrl(`/api/public/orders/meta/${encodeURIComponent(effectiveOrderId)}`));
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Order not found. Please verify your tracking link.");
          setMeta(null);
        } else {
          setMeta(data);
          setError(null);
        }
      } catch (err) {
        console.error("Meta fetch error:", err);
        setError("Unable to connect to the bakery server. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [effectiveOrderId]);

  // Handle phone verification submit
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOrderId) return;

    const cleanInput = phoneInput.replace(/\D/g, "");
    if (cleanInput.length < 10) {
      setVerifyError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);

    try {
      const res = await fetch(getApiUrl("/api/public/orders/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: effectiveOrderId,
          phone: cleanInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Mobile number does not match this order.");
      } else {
        setOrder(data.order);
        setBakery(data.bakery);
        setVerifyError(null);

        // Cache in sessionStorage for refresh persistence
        try {
          sessionStorage.setItem(
            `floura_track_${effectiveOrderId}`,
            JSON.stringify({ order: data.order, bakery: data.bakery })
          );
        } catch {}
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyError("Verification request failed. Please check your connection and try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputOrderId.trim();
    if (!trimmed) return;
    // Extract ID if user pasted full URL
    const match = trimmed.match(/track\/([a-zA-Z0-9_-]+)/);
    const resolvedId = match ? match[1] : trimmed;
    navigate(`/track/${resolvedId}`);
  };

  // Helper date formatter respecting seller's date format
  const formatOrderDate = (dateStr?: string, fmt = "DD/MM/YYYY"): string => {
    if (!dateStr) return "";
    const clean = dateStr.split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (fmt === "DD/MM/YYYY") return `${d}/${m}/${y}`;
      if (fmt === "MM/DD/YYYY") return `${m}/${d}/${y}`;
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  };

  const currencySymbol = normalizeCurrency(bakery?.currency || meta?.currency || "₹");

  // Status Stepper definition
  const steps = [
    { 
      key: "Pending", 
      label: "Order Placed", 
      shortLabel: "Placed", 
      desc: "Your order details have been received by the bakery and are awaiting confirmation.",
      icon: Clock3 
    },
    { 
      key: "Confirmed", 
      label: "Confirmed", 
      shortLabel: "Confirmed", 
      desc: "The baker has confirmed your booking and reserved your baking and delivery slot.",
      icon: ShieldCheck 
    },
    { 
      key: "In Progress", 
      label: "Baking & Decorating", 
      shortLabel: "Baking", 
      desc: "Your artisan cake is being freshly baked and hand-crafted in the kitchen.",
      icon: ChefHat 
    },
    { 
      key: "Ready for Pickup", 
      label: "Ready for Pickup", 
      shortLabel: "Ready", 
      desc: "Your cake is finished, safely boxed, and ready for pickup or dispatch.",
      icon: PackageCheck 
    },
    { 
      key: "Completed", 
      label: "Delivered", 
      shortLabel: "Delivered", 
      desc: "Order has been fulfilled and handed over. Enjoy your celebration!",
      icon: CheckCircle2 
    },
  ];

  const currentStatus = order?.status || meta?.status || "Pending";
  const isCancelled = currentStatus.toLowerCase() === "cancelled";

  const getStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pending") return 0;
    if (s === "confirmed" || s === "ordered ingredients") return 1;
    if (s === "in progress" || s === "processing" || s === "decorating") return 2;
    if (s === "ready for pickup" || s === "ready") return 3;
    if (s === "completed") return 4;
    return 0;
  };

  const activeStepIndex = getStepIndex(currentStatus);

  const cleanText = (str?: string, fallback = ""): string => {
    if (!str) return fallback;
    if (typeof str === "string" && (str.startsWith("__ENC__") || str.startsWith("__GCM__"))) {
      return fallback;
    }
    return str;
  };

  // WhatsApp Contact link
  const bakeryPhoneClean = (cleanText(bakery?.phone || meta?.bakeryPhone, "")).replace(/\D/g, "");
  const seqNumber = order?.seqId || meta?.seqId || "GT001";
  const bakeryNameDisplay = cleanText(bakery?.bakeryName || meta?.bakeryName, "Floura Bakery");

  const whatsappInquiryUrl = bakeryPhoneClean
    ? `https://wa.me/${bakeryPhoneClean.length === 10 ? `91${bakeryPhoneClean}` : bakeryPhoneClean}?text=${encodeURIComponent(
        `Hi ${bakeryNameDisplay}, I am tracking order #${seqNumber}${order ? ` for ${cleanText(order.customerName, "Customer")}` : ""}. I'd like to check in on my order.`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-brand/10 dark:bg-orange-500/10 flex items-center justify-center p-1 border border-primary-brand/20 dark:border-orange-500/20">
              <img src={flouraLogo} alt="Floura" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {bakeryNameDisplay}
              </h1>
              <p className="text-[11px] text-zinc-750 dark:text-zinc-400 font-medium">
                Live Order Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order && (
              <button
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Print Receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Order
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
        {/* Loading state */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border-3 border-primary-brand border-t-transparent dark:border-orange-400 dark:border-t-transparent animate-spin mb-4" />
            <h2 className="text-base font-serif font-bold text-zinc-800 dark:text-zinc-200">
              Retrieving Order Status...
            </h2>
            <p className="text-xs text-zinc-750 dark:text-zinc-400 mt-1">
              Connecting to {bakeryNameDisplay}
            </p>
          </div>
        )}

        {/* Missing Order ID State */}
        {!loading && !effectiveOrderId && (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-850 rounded-3xl p-7 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Search className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Track Your Cake Order
            </h2>
            <p className="text-xs text-zinc-750 dark:text-zinc-400 mb-6 leading-relaxed">
              Enter your tracking order link or Order ID sent by your baker via WhatsApp or SMS.
            </p>

            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Paste tracking link or enter Order ID..."
                  value={inputOrderId}
                  onChange={(e) => setInputOrderId(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-brand/30 dark:focus:ring-orange-500/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-brand hover:opacity-95 shadow-md shadow-primary-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && effectiveOrderId && error && (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-850 rounded-3xl p-7 border border-red-200 dark:border-red-900/50 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Order Not Found
            </h2>
            <p className="text-xs text-zinc-750 dark:text-zinc-400 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                navigate("/track");
              }}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Try Another Tracking Link
            </button>
          </div>
        )}

        {/* LOCKED STATE: Order Found, Awaiting Phone Verification */}
        {!loading && meta && !order && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-6"
          >
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-brand/10 dark:bg-orange-500/10 text-primary-brand dark:text-orange-400 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                Order #{meta.seqId}
              </h2>
              <p className="text-xs text-zinc-750 dark:text-zinc-400">
                {cleanText(meta.bakeryName, "Floura Bakery")}
                {cleanText(meta.bakeryAddress) ? ` • ${cleanText(meta.bakeryAddress)}` : ""}
              </p>
            </div>

            {/* Teaser Preview Card */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-750 dark:text-zinc-400 font-medium">Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {cleanText(meta.status, "Pending")}
                </span>
              </div>
              {meta.deliveryDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-750 dark:text-zinc-400 font-medium">Scheduled Date</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatOrderDate(meta.deliveryDate, meta.dateFormat)} {meta.deliveryTime ? `@ ${meta.deliveryTime}` : ""}
                  </span>
                </div>
              )}
              {cleanText(meta.eventType) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-750 dark:text-zinc-400 font-medium">Event Type</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {cleanText(meta.eventType)}
                  </span>
                </div>
              )}
            </div>

            {/* Privacy unlock prompt */}
            <form onSubmit={handleVerify} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Verify Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={14}
                    placeholder="Enter 10-digit mobile number"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (verifyError) setVerifyError(null);
                    }}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-primary-brand/30 dark:focus:ring-orange-500/30 transition-all"
                  />
                </div>
                <p className="text-[11px] text-zinc-750 dark:text-zinc-400 mt-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-brand dark:text-orange-400 shrink-0" />
                  <span>
                    Hint: Number ending in <strong className="font-mono text-zinc-700 dark:text-zinc-300">{meta.maskedPhone}</strong>
                  </span>
                </p>
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyLoading || !phoneInput.trim()}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-brand hover:opacity-95 disabled:opacity-50 shadow-md shadow-primary-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifyLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Order Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Direct inquiry fallback */}
            {whatsappInquiryUrl && (
              <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Need help? Contact {meta.bakeryName} directly</span>
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* UNLOCKED STATE: Full Verified Order Details & Live Timeline */}
        {!loading && order && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Overview Hero Card */}
            <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-zinc-200/90 dark:border-zinc-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-brand/5 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-brand/10 dark:bg-orange-500/10 text-primary-brand dark:text-orange-400 font-mono">
                      #{order.seqId}
                    </span>
                    <span className="text-xs text-zinc-750 dark:text-zinc-400">
                      Booked {formatOrderDate(order.createdAt, bakery?.dateFormat)}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
                    {order.customerName}'s Order
                  </h2>
                  <p className="text-xs text-zinc-750 dark:text-zinc-400 mt-1">
                    {order.eventType} Celebration • {bakeryNameDisplay}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {whatsappInquiryUrl && (
                    <a
                      href={whatsappInquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Baker</span>
                    </a>
                  )}

                  {bakery?.phone && (
                    <a
                      href={`tel:${bakery.phone}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Bakery</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status Timeline Stepper */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-brand dark:bg-orange-400 animate-pulse" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-700 dark:text-zinc-300">
                      Live Order Timeline
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isCancelled
                        ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900"
                        : currentStatus.toLowerCase() === "completed"
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCancelled
                          ? "bg-red-500"
                          : currentStatus.toLowerCase() === "completed"
                          ? "bg-emerald-500"
                          : "bg-amber-500 animate-pulse"
                      }`}
                    />
                    {currentStatus}
                  </span>
                </div>

                {isCancelled ? (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <strong className="block font-semibold">This order has been cancelled</strong>
                      <span>Please contact the bakery directly for refunds or rescheduling.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Connected Milestone Track */}
                    <div className="relative">
                      {/* Continuous Connecting Line - perfectly vertically centered through icon centers (top-5 = 20px) */}
                      <div className="absolute top-5 left-[10%] right-[10%] -translate-y-1/2 h-1 bg-zinc-200 dark:bg-zinc-700 z-0 rounded-full">
                        <div
                          className="h-full bg-primary-brand dark:bg-orange-500 transition-all duration-700 ease-out rounded-full"
                          style={{
                            width: `${(activeStepIndex / (steps.length - 1)) * 100}%`,
                          }}
                        />
                      </div>

                      {/* 5-Column Grid of Nodes */}
                      <div className="grid grid-cols-5 relative z-10">
                        {steps.map((st, idx) => {
                          const Icon = st.icon;
                          const isDone = idx < activeStepIndex;
                          const isCurrent = idx === activeStepIndex;

                          return (
                            <div key={st.key} className="flex flex-col items-center text-center px-1">
                              {/* Node Icon Circle */}
                              <div className="relative flex items-center justify-center">
                                {isCurrent && (
                                  <span className="absolute -inset-1 rounded-full bg-primary-brand/20 dark:bg-orange-500/25 animate-ping pointer-events-none" />
                                )}
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 select-none ${
                                    isDone
                                      ? "bg-emerald-500 text-white shadow-sm ring-4 ring-white dark:ring-zinc-850"
                                      : isCurrent
                                      ? "bg-primary-brand dark:bg-orange-500 text-white shadow-md shadow-primary-brand/30 dark:shadow-orange-500/30 ring-4 ring-primary-brand/20 dark:ring-orange-500/25 ring-offset-2 ring-offset-white dark:ring-offset-zinc-850 scale-110"
                                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 ring-4 ring-white dark:ring-zinc-850 border border-zinc-200 dark:border-zinc-700"
                                  }`}
                                >
                                  {isDone ? (
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                  ) : (
                                    <Icon className="w-4.5 h-4.5" />
                                  )}
                                </div>
                              </div>

                              {/* Node Label */}
                              <div className="mt-3 flex flex-col items-center">
                                <span
                                  className={`text-xs font-semibold leading-tight transition-colors ${
                                    isCurrent
                                      ? "text-primary-brand dark:text-orange-400 font-bold"
                                      : isDone
                                      ? "text-zinc-800 dark:text-zinc-200"
                                      : "text-zinc-400 dark:text-zinc-500"
                                  }`}
                                >
                                  <span className="sm:hidden">{st.shortLabel}</span>
                                  <span className="hidden sm:inline">{st.label}</span>
                                </span>

                                {isCurrent && (
                                  <span className="hidden sm:inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-primary-brand/10 dark:bg-orange-500/10 text-primary-brand dark:text-orange-400">
                                    Current
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Stage Callout Card */}
                    {steps[activeStepIndex] && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          {React.createElement(steps[activeStepIndex].icon, { className: "w-4 h-4" })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Current Milestone: {steps[activeStepIndex].label}
                            </span>
                          </div>
                          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                            {steps[activeStepIndex].desc}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Two-Column Grid: Delivery & Cake Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery & Schedule Info */}
              <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-primary-brand/10 dark:bg-orange-500/10 text-primary-brand dark:text-orange-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Delivery & Handover Schedule
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-750 dark:text-zinc-400 block">
                        Scheduled Date
                      </span>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatOrderDate(order.deliveryDate || order.eventDate, bakery?.dateFormat)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-750 dark:text-zinc-400 block">
                        Target Time
                      </span>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {order.deliveryTime || "09:00 AM"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-750 dark:text-zinc-400 block">
                        Venue / Handover Address
                      </span>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {order.venueAddress && order.venueAddress.trim() !== ""
                          ? order.venueAddress
                          : "In-store pickup directly from bakery"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cake Specifications */}
              <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-primary-brand/10 dark:bg-orange-500/10 text-primary-brand dark:text-orange-400 flex items-center justify-center">
                    <Cake className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Artisan Cake Specifications
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-750 dark:text-zinc-400 block mb-0.5">Flavor</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{order.cakeFlavor}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-750 dark:text-zinc-400 block mb-0.5">Weight</span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{order.cakeWeight || "1.0 kg"}</strong>
                  </div>

                  {order.cakeShape && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] text-zinc-750 dark:text-zinc-400 block mb-0.5">Shape</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{order.cakeShape}</strong>
                    </div>
                  )}

                  {order.layers && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] text-zinc-750 dark:text-zinc-400 block mb-0.5">Layers</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{order.layers}</strong>
                    </div>
                  )}

                  {order.preference && (
                    <div className="col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] text-zinc-750 dark:text-zinc-400 block mb-0.5">Dietary Preference</span>
                      <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{order.preference}</strong>
                    </div>
                  )}
                </div>

                {order.cakeInscription && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                    <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-400 block mb-1">
                      Message Inscribed on Cake
                    </span>
                    <p className="font-serif italic text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                      "{order.cakeInscription}"
                    </p>
                  </div>
                )}

                {order.specialInstructions && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[11px] font-semibold text-zinc-750 dark:text-zinc-400 block mb-0.5">
                      Special Notes
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {order.specialInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Design Photo (if present) */}
            {order.referenceImage && (
              <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-brand dark:text-orange-400" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Cake Design Reference
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(order.referenceImage || null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-brand dark:text-orange-400 hover:underline cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Full Size</span>
                  </button>
                </div>

                <div
                  onClick={() => setSelectedImage(order.referenceImage || null)}
                  className="max-h-72 rounded-2xl overflow-hidden cursor-pointer relative group border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center"
                >
                  <img
                    src={order.referenceImage}
                    alt="Cake Design Reference"
                    className="max-h-72 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-black/75 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" /> Click to enlarge
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary & Balance Due */}
            <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Payment & Invoice Summary
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.paymentStatus === "Paid"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : order.paymentStatus === "Partially Paid"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-750 dark:text-zinc-400">
                  <span>Grand Total</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {currencySymbol}{Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-750 dark:text-zinc-400">
                  <span>Amount Paid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{Number(order.paidAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Balance Due</span>
                  <span className="text-lg font-bold text-primary-brand dark:text-orange-400 font-mono">
                    {currencySymbol}{(Math.max(0, Number(order.totalAmount || 0) - Number(order.paidAmount || 0))).toFixed(2)}
                  </span>
                </div>
              </div>

              {Number(order.totalAmount || 0) - Number(order.paidAmount || 0) <= 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Invoice is fully paid! Thank you for your business.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 shrink-0" />
                  <span>Remaining balance is due upon pickup or delivery.</span>
                </div>
              )}
            </div>

            {/* Bakery Footer / Contact Info */}
            <div className="text-center py-4 space-y-2 text-xs text-zinc-750 dark:text-zinc-400">
              <p>
                Crafted with care by <strong className="text-zinc-700 dark:text-zinc-300">{bakeryNameDisplay}</strong>
                {bakery?.address ? ` • ${bakery.address}` : ""}
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                Powered by Floura • Artisan Bakery Operating Platform
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Enlarged Reference Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] bg-zinc-900 rounded-3xl overflow-hidden p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged Reference Design"
                className="max-h-[85vh] w-auto mx-auto object-contain rounded-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
