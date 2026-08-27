// File Path: /src/components/OrderDetail.tsx
import React, { useState, useEffect, memo } from "react";
import { memoWithData } from "../utils/memo";
import { type Order } from "../types";
import { localDb } from "../db";
import { scaleRecipeIngredients, parseWeightToGrams } from "../../shared/calculations";


import { formatPrice, formatDate, getCurrencySymbol, getOrderSeqId } from "../utils/format";
import { getStatusColors } from "../utils/orderStatus";
import {
  ArrowLeft,
  ChevronDown,
  Printer,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  Trash2,
  Plus,
  Check,
  Layers,
  Sparkles,
  User,
  Calendar,
  MapPin,
  Phone,
  RefreshCw,
  XCircle,
  Calculator
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOrders } from "../hooks/useOrders";
import { CompleteOrderModal } from "./CompleteOrderModal";

interface OrderDetailProps {
  onAddOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<any>;
  onUpdateOrder?: (order: Order) => Promise<any>;
  onUpdateOrderStatus: (id: string, status: Order["status"]) => void;
  onNavigate?: (path: string | number, state?: any) => void;
}

function OrderDetail({
  onAddOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
  onNavigate,
}: OrderDetailProps) {
  const {
    orders,
    selectedOrder,
    completingOrder,
    setCompletingOrder,
    profitAmount,
    setProfitAmount,
    costGoingText,
    setCostGoingText,
    difficultiesText,
    setDifficultiesText,
    showAddPayment,
    setShowAddPayment,
    paymentAmount,
    setPaymentAmount,
    paymentMethodSelect,
    setPaymentMethodSelect,
    paymentNotesInput,
    setPaymentNotesInput,
    bakeryProfile,
    handleStartEdit,
    handleAddPaymentInstallment,
    handleDeletePaymentInstallment,
    handleCompleteOrderSave,
  } = useOrders({
    onAddOrder,
    onUpdateOrder,
    onUpdateOrderStatus,
    initialViewMode: "detail",
    onViewModeChange: (mode) => onNavigate?.(mode === "form" ? "/orders/new" : "/orders"),
  });

  const [recipesList, setRecipesList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [recs, invs] = await Promise.all([
          localDb.recipes.filter((r: any) => r.isDeleted !== 1).toArray(),
          localDb.inventory.filter((i: any) => i.isDeleted !== 1).toArray()
        ]);
        if (active) {
          setRecipesList(recs);
          setInventoryList(invs);
        }
      } catch (err) {
        console.error("Failed to load recipes/inventory in OrderDetail:", err);
      }
    };
    loadData();
    
    // Also listen to db updates so we reload when inventory updates
    const handleDbUpdate = () => {
      loadData();
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => {
      active = false;
      window.removeEventListener("db-update", handleDbUpdate);
    };
  }, [selectedOrder, completingOrder]);

  const calculateOrderIngredients = (order: Order) => {
    if (!order || !order.cakeFlavor) return { list: [], totalCost: 0, recipeFound: false };
    
    const matchingRecipe = recipesList.find(
      (r: any) => r.isDeleted !== 1 && r.name.trim().toLowerCase() === order.cakeFlavor.trim().toLowerCase()
    );
    
    if (!matchingRecipe) {
      return { list: [], totalCost: 0, recipeFound: false };
    }
    
    const targetWeight = parseWeightToGrams(order.cakeWeight);
    const scaledIngredients = scaleRecipeIngredients(matchingRecipe, targetWeight);
    
    let totalCost = 0;
    const list = scaledIngredients.map(ing => {
      const invItem = inventoryList.find(
        (item: any) => item.isDeleted !== 1 && item.name.trim().toLowerCase() === ing.name.trim().toLowerCase()
      );
      
      let costPrice = 0;
      let unit = "g";
      let quantityInInvUnits = ing.scaledQty;
      let invItemFound = false;
      
      if (invItem) {
        invItemFound = true;
        costPrice = invItem.costPrice;
        unit = invItem.unit;
        quantityInInvUnits = ing.scaledQty;
      }
      
      const cost = quantityInInvUnits * costPrice;
      totalCost += cost;
      
      return {
        name: ing.name,
        invQty: quantityInInvUnits,
        unit,
        costPrice,
        cost,
        invItemFound
      };
    });
    
    return {
      list,
      totalCost: parseFloat(totalCost.toFixed(2)),
      recipeFound: true,
      recipeName: matchingRecipe.name
    };
  };

  const handleShareWhatsApp = (order: Order) => {
    if (!order.customerMobile) {
      window.showToast?.("No mobile number available for this customer.", "error");
      return;
    }
    const cleanNum = order.customerMobile.replace(/\D/g, "");
    if (!cleanNum) {
      window.showToast?.("Invalid customer phone number format.", "error");
      return;
    }
    
    const bakeryName = bakeryProfile?.bakeryName || "Floura Bakery";
    const currency = getCurrencySymbol();
    
    const totalVal = Number(order.totalAmount) || 0;
    const paidVal = Number(order.paidAmount) || 0;
    const balanceVal = totalVal - paidVal;

    const venueVal = order.venueAddress && order.venueAddress.trim() !== ""
      ? order.venueAddress
      : "In-store pickup";

    const message = `*${bakeryName} - Invoice* 🧾\n----------------------------------------\n*Invoice ID:* #${order.id}\n*Customer:* ${order.customerName}\n*Event Type:* ${order.eventType}\n*Delivery/Pickup:* ${formatDate(order.deliveryDate)} at ${order.deliveryTime || "09:00"}\n*Venue:* ${venueVal}\n\n*Cake Details:*\n• Flavor: ${order.cakeFlavor}\n• Shape: ${order.cakeShape}\n• Weight: ${order.cakeWeight}\n• Layers: ${order.layers}${order.cakeInscription ? `\n• Inscription: "${order.cakeInscription}"` : ""}\n\n*Financial Summary:*\n• Grand Total: ${currency}${totalVal.toFixed(2)}\n• Total Paid: ${currency}${paidVal.toFixed(2)}\n• *Balance Due: ${currency}${balanceVal.toFixed(2)}*\n\nThank you for choosing ${bakeryName}! 🍰`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`, "_blank");
    window.showToast?.("Invoice Generated", "success");
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {selectedOrder ? (
          /* ================= SINGLE EVENT ORDER DETAIL VIEW ================= */
          <motion.div
            key="detail-subpage"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="order-detail-container bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700/60 shadow-sm w-full mx-auto space-y-6"
          >
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-700/60 print:hidden">
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigate?.("/orders")}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors mt-0.5"
                  title="Back to orders list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold font-serif text-zinc-850 dark:text-zinc-100">
                      Order Details
                    </h2>
                    <span className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-tight">
                      #{getOrderSeqId(selectedOrder.id, orders)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-zinc-650 dark:text-zinc-300 font-medium font-sans flex-wrap">
                    <div className="relative shrink-0 flex items-center">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          const val = e.target.value as Order["status"];
                          if (val === "Completed") {
                            setCompletingOrder(selectedOrder);
                          } else {
                            onUpdateOrderStatus(selectedOrder.id, val);
                          }
                        }}
                        className={`text-[9px] pl-2.5 pr-6 py-0.5 rounded-full font-bold uppercase tracking-wider outline-none cursor-pointer border border-transparent transition-all hover:opacity-90 appearance-none bg-no-repeat shrink-0 ${getStatusColors(selectedOrder.status).bg}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Ordered Ingredients">Ingredients Ordered</option>
                        <option value="Processing">Processing</option>
                        <option value="Decorating">Decorating</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none opacity-70" />
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <span>Placed on {formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Right aligned action buttons */}
              <div className="flex items-center gap-2.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    window.showToast?.("Invoice Generated", "success");
                  }}
                  className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-205 py-2 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedOrder)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Stage Progress tracker bar */}
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 font-sans text-left">
                Active Baking & Order Milestones
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-left">
                {(["Pending", "Ordered Ingredients", "Processing", "Decorating", "Ready for Pickup", "Completed"] as Order["status"][]).map((stage, idx) => {
                  const stages = ["Pending", "Ordered Ingredients", "Processing", "Decorating", "Ready for Pickup", "Completed"];
                  const currentIdx = stages.indexOf(selectedOrder.status);
                  const isCompleted = idx < currentIdx || selectedOrder.status === "Completed";
                  const isActive = stage === selectedOrder.status;
                  
                  return (
                    <button
                      key={stage}
                      type="button"
                      title={`Click to set stage to ${stage}`}
                      onClick={() => {
                        if (stage === "Completed") {
                          setCompletingOrder(selectedOrder);
                        } else {
                          onUpdateOrderStatus(selectedOrder.id, stage);
                        }
                      }}
                      className={`p-3 rounded-xl border text-center flex flex-col justify-between h-24 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 ${
                        isActive
                          ? "bg-primary-brand/10 border-primary-brand/30 dark:bg-orange-400/10 dark:border-orange-400/30 ring-2 ring-primary-brand/5 shadow-sm"
                          : isCompleted
                          ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:border-emerald-400/50"
                          : "bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-455 hover:border-primary-brand/40"
                      }`}
                    >
                      <div className="flex justify-center">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : isActive ? (
                          <div className="w-4 h-4 rounded-full bg-primary-brand dark:bg-orange-400 animate-pulse flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold font-sans tracking-tight leading-tight uppercase mt-2">
                        {stage}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two Column details space */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Cake composition */}
              <div className="lg:col-span-7 space-y-5 text-left">
                {/* Visual design representation */}
                <div className="bg-zinc-50 dark:bg-zinc-900/20 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-805 flex flex-col sm:flex-row gap-5 items-center text-left">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-150 relative flex items-center justify-center shadow-inner">
                    {selectedOrder.referenceImage ? (
                      <img
                        src={selectedOrder.referenceImage}
                        alt="Cake reference design"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-zinc-400">
                        <Layers className="w-8 h-8 mx-auto text-zinc-350 dark:text-zinc-650" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-1.5 font-sans">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <span className="text-[9px] bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-sans">
                        {selectedOrder.layers} Cake
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-zinc-850 dark:text-zinc-105 leading-tight text-left">
                      {selectedOrder.cakeFlavor}
                    </h3>
                    <p className="text-xs text-zinc-500 font-sans text-left">
                      Shape: <strong>{selectedOrder.cakeShape}</strong> • {selectedOrder.cakeWeight.toLowerCase().includes("pieces") || selectedOrder.cakeWeight.toLowerCase().includes("pcs") ? "Quantity" : "Weight"}: <strong>{selectedOrder.cakeWeight}</strong> • Preference:{" "}
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                        selectedOrder.preference === "Eggless"
                          ? "bg-emerald-150/25 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-amber-150/20 text-amber-700 dark:bg-amber-955/25 dark:text-amber-505"
                      }`}>
                        {selectedOrder.preference}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Cake inscription if present */}
                {selectedOrder.cakeInscription && (
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/10 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-750 text-left">
                    <span className="text-[10px] text-zinc-400 uppercase font-sans tracking-widest font-bold block">Theme Inscription Text</span>
                    <p className="text-sm font-serif font-medium italic text-zinc-650 dark:text-zinc-300 mt-1 text-left">
                      "{selectedOrder.cakeInscription}"
                    </p>
                  </div>
                )}

                {/* Baking Special instructions if present */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-750 shadow-sm space-y-2 text-left">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide font-sans">
                      Baking & Design Directives
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed font-sans italic text-left">
                    {selectedOrder.specialInstructions || "No special design instructions recorded. Standard recipe procedures apply."}
                  </p>
                </div>

                {/* Stage actions controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800 text-left gap-3">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block font-sans">Update Order Status</span>
                    <span className="text-[11px] text-zinc-500 font-sans mt-0.5 block">Select any stage or advance baking pipeline</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <div className="relative shrink-0 flex items-center">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          const val = e.target.value as Order["status"];
                          if (val === "Completed") {
                            setCompletingOrder(selectedOrder);
                          } else {
                            onUpdateOrderStatus(selectedOrder.id, val);
                          }
                        }}
                        className={`text-xs pl-3 pr-8 py-1.5 rounded-lg font-bold uppercase tracking-wide outline-none cursor-pointer border border-transparent transition-all appearance-none bg-no-repeat shadow-xs ${getStatusColors(selectedOrder.status).bg}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Ordered Ingredients">Ingredients Ordered</option>
                        <option value="Processing">Processing</option>
                        <option value="Decorating">Decorating</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none opacity-70" />
                    </div>

                    {selectedOrder.status !== "Completed" && selectedOrder.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => {
                          const stages: Order["status"][] = ["Pending", "Ordered Ingredients", "Processing", "Decorating", "Ready for Pickup", "Completed"];
                          const nextIdx = stages.indexOf(selectedOrder.status) + 1;
                          if (nextIdx < stages.length) {
                            let nextStatus = stages[nextIdx];
                            if (nextStatus === "Completed") {
                              setCompletingOrder(selectedOrder);
                            } else {
                              onUpdateOrderStatus(selectedOrder.id, nextStatus);
                            }
                          }
                        }}
                        className="bg-primary-brand text-white hover:bg-opacity-95 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm font-sans"
                      >
                        <span>Advance Stage</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {selectedOrder.status !== "Cancelled" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to CANCEL this order?`)) {
                            onUpdateOrderStatus(selectedOrder.id, "Cancelled");
                          }
                        }}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        Order Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Logistics, Event Schedule & Pricing */}
              <div className="lg:col-span-5 space-y-5 text-left">
                {/* Customer Info Card */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-750 shadow-sm space-y-3 text-left">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-700/60">
                    <User className="w-4 h-4 text-sweet-pink dark:text-pink-400" />
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-205 uppercase tracking-wide font-sans">
                      Customer Profile Details
                    </h4>
                  </div>

                  <div className="text-left font-sans">
                    <h4 className="text-sm font-bold text-zinc-855 dark:text-zinc-200">
                      {selectedOrder.customerName}
                    </h4>
                    <p className="text-xs text-zinc-455 mt-0.5 font-mono">
                      {selectedOrder.customerMobile || "No Contact Number"}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <a
                        href={`tel:${selectedOrder.customerMobile}`}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-750 dark:text-zinc-350 py-2 rounded-xl text-center text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-zinc-150 dark:border-zinc-700"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Client
                      </a>
                      {selectedOrder.customerId && selectedOrder.customerId !== "new" && selectedOrder.customerId !== "guest" && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate?.("/customers", { state: { searchCustomerName: selectedOrder.customerName, fromOrderId: selectedOrder.id } });
                          }}
                          className="flex-1 bg-primary-brand/10 text-primary-brand dark:bg-orange-400/10 dark:text-orange-500 hover:bg-primary-brand/20 py-2 rounded-xl text-center text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-sans"
                        >
                          View Client File
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Schedule Card */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-750 shadow-sm space-y-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-700/60">
                    <Calendar className="w-4 h-4 text-sweet-pink dark:text-pink-400" />
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide font-sans text-left">
                      Event Schedule & Pickup
                    </h4>
                  </div>

                  <div className="space-y-3 font-sans">
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Event Type</span>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold block mt-0.5">
                        {selectedOrder.eventType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Event Date</span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold block mt-0.5">
                          {formatDate(selectedOrder.eventDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Pickup/Delivery</span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold block mt-0.5">
                          {formatDate(selectedOrder.deliveryDate)} {selectedOrder.deliveryTime || "09:00"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Venue Address</span>
                      <div className="flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal block font-medium text-left">
                          {selectedOrder.venueAddress || "In-store pickup scheduled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing breakdown card */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-750 space-y-3 text-left font-sans">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">
                    Billing Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-650 dark:text-zinc-400">
                      <span>Base Cake price</span>
                      <span className="font-mono">{formatPrice(selectedOrder.basePrice || selectedOrder.totalAmount * 0.7)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-650 dark:text-zinc-400">
                      <span>Decoration & Fondant Markup</span>
                      <span className="font-mono">{formatPrice(selectedOrder.decorationCharge || selectedOrder.totalAmount * 0.2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-650 dark:text-zinc-400">
                      <span>Delivery Logistic charge</span>
                      <span className="font-mono">{formatPrice(selectedOrder.deliveryFee || 0)}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between text-pink-650 dark:text-pink-400 font-medium">
                        <span>Express Priority Markup</span>
                        <span className="font-mono">Included</span>
                      </div>
                    )}
                    <hr className="border-zinc-200 dark:border-zinc-700/60 my-1" />
                    <div className="flex justify-between text-sm font-bold text-zinc-855 dark:text-zinc-100 pt-1">
                      <span>Grand Total Amount</span>
                      <span className="font-serif text-primary-brand dark:text-amber-400">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Ingredient cost breakdown for Completed orders */}
                {selectedOrder.status === "Completed" && (() => {
                  const ingDetails = calculateOrderIngredients(selectedOrder);
                  if (!ingDetails.recipeFound) {
                    return (
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-250 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-400 text-left">
                        No matching recipe found for flavor "{selectedOrder.cakeFlavor}" to display ingredient costs.
                      </div>
                    );
                  }
                  return (
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-750 space-y-3 text-left font-sans">
                      <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                        <h4 className="text-xs font-bold text-zinc-505 uppercase tracking-wider">
                          Ingredient Cost Breakdown
                        </h4>
                        <span className="text-[10px] text-zinc-400">
                          Recipe: {ingDetails.recipeName}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {ingDetails.list.map((ing, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-650 dark:text-zinc-400">
                            <span>{ing.name} ({ing.invQty} {ing.unit})</span>
                            <div className="space-x-4 font-mono">
                              <span className="text-zinc-400">{ing.invQty.toFixed(2)} {ing.unit} @ {formatPrice(ing.costPrice)}/{ing.unit}</span>
                              <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatPrice(ing.cost)}</span>
                            </div>
                          </div>
                        ))}
                        <hr className="border-zinc-200 dark:border-zinc-700/60 my-1" />
                        <div className="flex justify-between text-sm font-bold text-zinc-855 dark:text-zinc-100 pt-1">
                          <span>Total Ingredient Cost Spent</span>
                          <span className="font-serif text-emerald-600 dark:text-emerald-450 font-bold">
                            {formatPrice(ingDetails.totalCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Installments Tracking Widget */}
                <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-750 shadow-sm space-y-4 text-left font-sans">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-700/60">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
                        Payment & Installments
                      </h4>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                      selectedOrder.paymentStatus === "Fully Paid"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/30"
                        : selectedOrder.paymentStatus === "Partially Paid"
                        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-150 dark:border-amber-900/30"
                        : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-150 dark:border-rose-900/30"
                    }`}>
                      {selectedOrder.paymentStatus || "Unpaid"}
                    </span>
                  </div>

                  {/* Payment Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                      <span>Paid: {formatPrice(selectedOrder.paidAmount || 0)}</span>
                      <span>Balance: {formatPrice(selectedOrder.totalAmount - (selectedOrder.paidAmount || 0))}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-505 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((selectedOrder.paidAmount || 0) / selectedOrder.totalAmount) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Installments List */}
                  <div className="space-y-2.5 pt-2 text-left">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Installments Breakdown</h4>
                    {selectedOrder.paymentHistory && selectedOrder.paymentHistory.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.paymentHistory.map((pmt: any) => (
                          <div
                            key={pmt.id}
                            className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60 text-xs text-left"
                          >
                            <div className="space-y-0.5 text-left">
                              <p className="font-bold text-zinc-855 dark:text-zinc-200">
                                {formatPrice(pmt.amount)}{" "}
                                <span className="text-[10px] bg-zinc-205 dark:bg-zinc-700 text-zinc-655 dark:text-zinc-350 px-1.5 py-0.5 rounded font-medium ml-1">
                                  {pmt.method}
                                </span>
                              </p>
                              <p className="text-[10px] text-zinc-455">
                                {formatDate(pmt.date)} {pmt.notes ? `• ${pmt.notes}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentInstallment(pmt.id)}
                              className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Void installment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-455 italic">No installment payments recorded yet for this event spec.</p>
                    )}
                  </div>

                  {/* Add Installment Toggle Form */}
                  {selectedOrder.paymentStatus !== "Fully Paid" && (
                    <div className="pt-2">
                      {!showAddPayment ? (
                        <button
                          type="button"
                          onClick={() => {
                            const rem = selectedOrder.totalAmount - (selectedOrder.paidAmount || 0);
                            setPaymentAmount(String(Math.max(0, rem)));
                            setShowAddPayment(true);
                          }}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                        >
                          <Plus className="w-3.5 h-3.5" /> Record Installment Payment
                        </button>
                      ) : (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                          <div className="flex justify-between items-center pb-1">
                            <span className="text-[10px] text-zinc-655 dark:text-zinc-350 font-bold uppercase">Record Payment Detail</span>
                            <button
                              type="button"
                              onClick={() => setShowAddPayment(false)}
                              className="text-xs text-zinc-400 hover:text-zinc-600"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1 font-sans">
                              <label className="text-[10px] font-bold text-zinc-500">Amount ({getCurrencySymbol()})</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Amount"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="bg-white dark:bg-zinc-800 p-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-zinc-805 dark:text-zinc-100 font-bold"
                              />
                            </div>
                            <div className="flex flex-col gap-1 font-sans">
                              <label className="text-[10px] font-bold text-zinc-500">Method</label>
                              <select
                                value={paymentMethodSelect}
                                onChange={(e) => setPaymentMethodSelect(e.target.value as any)}
                                className="bg-white dark:bg-zinc-800 p-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
                              >
                                <option value="UPI">UPI</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 font-sans text-left">
                            <label className="text-[10px] font-bold text-zinc-500 text-left">Notes</label>
                            <input
                              type="text"
                              placeholder="e.g. 1st installment, deposit, remaining"
                              value={paymentNotesInput}
                              onChange={(e) => setPaymentNotesInput(e.target.value)}
                              className="bg-white dark:bg-zinc-800 p-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-zinc-805 dark:text-zinc-200 text-left"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddPaymentInstallment}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer font-sans"
                          >
                            <Check className="w-4 h-4" /> Save Payment
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons at the bottom of the page */}
            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-700/60 print:hidden">
              <button
                type="button"
                onClick={() => handleStartEdit(selectedOrder)}
                className="w-full sm:w-auto bg-primary-brand text-white hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 py-2.5 px-6 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md font-sans"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modify Spec</span>
              </button>
            </div>

            {/* ================= PRINTER-FRIENDLY INVOICE ================= */}
            <div
              id="printable-invoice"
              className="hidden print:block p-8 bg-white text-zinc-900 font-sans leading-relaxed text-left max-w-4xl mx-auto border border-zinc-200"
            >
              <div className="flex justify-between items-start border-b border-zinc-300 pb-6 mb-6">
                <div>
                  <h1 className="text-3xl font-bold font-serif text-zinc-900 leading-tight">
                    {bakeryProfile?.bakeryName || "Floura Bakery"}
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                    Exquisite Custom Bakes & Confections
                  </p>
                  <div className="text-xs text-zinc-650 mt-3 space-y-1">
                    {bakeryProfile?.address && <p>{bakeryProfile.address}</p>}
                    {bakeryProfile?.phone && <p>Phone: {bakeryProfile.phone}</p>}
                    {bakeryProfile?.email && <p>Email: {bakeryProfile.email}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold font-mono tracking-tight uppercase text-zinc-800">
                    INVOICE
                  </h2>
                  <div className="text-xs text-zinc-650 mt-3 space-y-1 font-mono">
                    <p><span className="font-sans font-semibold text-zinc-500 text-[10px] uppercase block">Invoice ID:</span> #{getOrderSeqId(selectedOrder.id, orders)}</p>
                    <p><span className="font-sans font-semibold text-zinc-500 text-[10px] uppercase block mt-1">Date Created:</span> {formatDate(selectedOrder.createdAt)}</p>
                    <p><span className="font-sans font-semibold text-zinc-500 text-[10px] uppercase block mt-1">Status:</span> <span className="font-bold">{selectedOrder.status.toUpperCase()}</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 font-sans border-b border-zinc-200 pb-1">
                    Bill To / Client
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-bold text-zinc-800">{selectedOrder.customerName}</p>
                    <p className="font-mono text-xs text-zinc-600">{selectedOrder.customerMobile}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 font-sans border-b border-zinc-200 pb-1">
                    Delivery & Logistics
                  </h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-semibold text-zinc-600">Event Type:</span> {selectedOrder.eventType}</p>
                    <p><span className="font-semibold text-zinc-600">Event Date:</span> {formatDate(selectedOrder.eventDate)}</p>
                    <p><span className="font-semibold text-zinc-600">Schedule:</span> {formatDate(selectedOrder.deliveryDate)} at {selectedOrder.deliveryTime || "09:00"}</p>
                    <p className="mt-1"><span className="font-semibold text-zinc-600 block">Venue Address:</span> {selectedOrder.venueAddress || "In-store pickup"}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 font-sans border-b border-zinc-200 pb-1">
                  Cake Specifications & Design Details
                </h3>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-300 text-zinc-550 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">Specification</th>
                      <th className="py-2.5 px-4">Value / Selection</th>
                      <th className="py-2.5 text-right">Reference Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="py-3 font-semibold text-zinc-705">Flavor Profile</td>
                      <td className="py-3 px-4 font-bold text-zinc-900">{selectedOrder.cakeFlavor}</td>
                      <td className="py-3 text-right text-zinc-500">{selectedOrder.preference} recipe</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-3 font-semibold text-zinc-705">Layers & Structure</td>
                      <td className="py-3 px-4">{selectedOrder.layers}</td>
                      <td className="py-3 text-right text-zinc-500">{selectedOrder.cakeShape} format</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="py-3 font-semibold text-zinc-705">Size & Portions</td>
                      <td className="py-3 px-4 font-semibold">{selectedOrder.cakeWeight}</td>
                      <td className="py-3 text-right text-zinc-500">-</td>
                    </tr>
                    {selectedOrder.cakeInscription && (
                      <tr className="border-b border-zinc-200">
                        <td className="py-3 font-semibold text-zinc-705">Theme Inscription</td>
                        <td className="py-3 px-4 italic font-medium" colSpan={2}>
                          "{selectedOrder.cakeInscription}"
                        </td>
                      </tr>
                    )}
                    {selectedOrder.specialInstructions && (
                      <tr className="border-b border-zinc-200">
                        <td className="py-3 font-semibold text-zinc-705">Special Instructions</td>
                        <td className="py-3 px-4 text-zinc-600 leading-normal" colSpan={2}>
                          {selectedOrder.specialInstructions}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-12 gap-8 mb-8 items-start">
                <div className="col-span-7">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 font-sans border-b border-zinc-200 pb-1">
                    Payment & Installment History
                  </h3>
                  {selectedOrder.paymentHistory && selectedOrder.paymentHistory.length > 0 ? (
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-450 font-semibold uppercase tracking-wider">
                          <th className="py-1.5">Date</th>
                          <th className="py-1.5">Method</th>
                          <th className="py-1.5">Notes</th>
                          <th className="py-1.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.paymentHistory.map((pmt: any, idx: number) => (
                          <tr key={pmt.id || idx} className="border-b border-zinc-100 text-zinc-600">
                            <td className="py-2">{formatDate(pmt.date)}</td>
                            <td className="py-2 font-mono">{pmt.method}</td>
                            <td className="py-2 italic">{pmt.notes || "-"}</td>
                            <td className="py-2 text-right font-mono font-bold text-zinc-800">{formatPrice(pmt.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-zinc-500 italic mt-1">No payments have been recorded for this invoice yet.</p>
                  )}
                </div>

                <div className="col-span-5 bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 font-sans">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 font-sans border-b border-zinc-200/60 pb-1">
                    Financial Statement
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Base Cake Price:</span>
                      <span className="font-mono">{formatPrice(selectedOrder.basePrice || selectedOrder.totalAmount * 0.7)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Decoration Markup:</span>
                      <span className="font-mono">{formatPrice(selectedOrder.decorationCharge || selectedOrder.totalAmount * 0.2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-650">
                      <span>Logistics / Delivery:</span>
                      <span className="font-mono">{formatPrice(selectedOrder.deliveryFee || 0)}</span>
                    </div>
                    <div className="border-t border-zinc-300 my-1.5" />
                    <div className="flex justify-between text-sm font-bold text-zinc-900">
                      <span>Grand Total:</span>
                      <span className="font-serif text-zinc-900">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-emerald-700">
                      <span>Total Paid:</span>
                      <span className="font-mono">{formatPrice(selectedOrder.paidAmount || 0)}</span>
                    </div>
                    <div className="border-t border-zinc-200 my-1" />
                    <div className="flex justify-between text-sm font-bold text-zinc-900">
                      <span>Balance Due:</span>
                      <span className="font-serif text-zinc-900">{formatPrice(selectedOrder.totalAmount - (selectedOrder.paidAmount || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-300 pt-6 mt-12 text-center text-[10px] text-zinc-500 font-sans space-y-1.5">
                <p className="font-semibold text-zinc-700">Thank you for letting us sweeten your special celebration!</p>
                <p>Please note: custom orders require payment prior to final bake completion.</p>
                <p className="text-[9px] text-zinc-400">Generated on {new Date().toLocaleString()} • Floura Kitchen Business Suite</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm w-full mx-auto min-h-[300px] text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-brand dark:text-orange-400 mx-auto" />
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans">Loading order details...</p>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- ORDER COMPLETION & PROFIT ANALYTICS MODAL ----------------- */}
      <CompleteOrderModal
        completingOrder={completingOrder}
        profitAmount={profitAmount}
        setProfitAmount={setProfitAmount}
        costGoingText={costGoingText}
        setCostGoingText={setCostGoingText}
        difficultiesText={difficultiesText}
        setDifficultiesText={setDifficultiesText}
        onSave={handleCompleteOrderSave}
        onClose={() => setCompletingOrder(null)}
      />
    </div>
  );
}

export default memoWithData(OrderDetail);
