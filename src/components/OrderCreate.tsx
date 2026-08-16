// File Path: /src/components/OrderCreate.tsx
import React, { useState, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { customSelectStyles } from "./customSelectStyles";
import { type Order } from "../types";
import { useNavigate } from "react-router-dom";
import { formatDate, getCurrencySymbol } from "../utils/format";
import {
  ArrowLeft,
  User,
  Sparkles,
  Calculator,
  Calendar,
  Check,
  Upload,
  Camera,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOrders } from "../hooks/useOrders";

// Fast input elements to avoid lagging when typing in complex form components
const FastInput = React.memo(({
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
});
FastInput.displayName = "FastInput";

const FastTextArea = React.memo(({
  value,
  onChange,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
});
FastTextArea.displayName = "FastTextArea";

interface OrderCreateProps {
  onAddOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<any>;
  onUpdateOrder?: (order: Order) => Promise<any>;
  onUpdateOrderStatus: (id: string, status: Order["status"]) => void;
}

export default function OrderCreate({
  onAddOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
}: OrderCreateProps) {
  const navigate = useNavigate();
  const {
    viewMode,
    formData,
    setFormData,
    customerSearch,
    setCustomerSearch,
    customerOptions,
    saving,
    saveSuccess,
    videoRef,
    cameraActive,
    cameraError,
    overrideBasePrice,
    setOverrideBasePrice,
    overrideDecorationCharge,
    setOverrideDecorationCharge,
    overrideDeliveryFee,
    setOverrideDeliveryFee,
    overrideTotalAmount,
    setOverrideTotalAmount,
    editingOrderId,
    dynamicEventTypes,
    dynamicFlavors,
    priceCalculation,
    handleSetViewMode,
    startCamera,
    stopCamera,
    capturePhoto,
    handleCustomerChange,
    handleSaveOrder,
  } = useOrders({
    onAddOrder,
    onUpdateOrder,
    onUpdateOrderStatus,
    initialViewMode: "form",
    onViewModeChange: (mode) => navigate(mode === "form" ? "/orders/new" : "/orders"),
  });

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (viewMode === "form") {
      setCurrentStep(1);
    }
  }, [viewMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, viewMode]);

  const validateStep1 = () => {
    if (!formData.customerName?.trim()) {
      window.showToast?.("Customer name is required.", "warning");
      return false;
    }
    if (!formData.customerMobile?.trim()) {
      window.showToast?.("Customer mobile number is required.", "warning");
      return false;
    }
    if (!formData.eventDate) {
      window.showToast?.("Event date is required.", "warning");
      return false;
    }
    if (!formData.deliveryDate) {
      window.showToast?.("Delivery/pickup date is required.", "warning");
      return false;
    }
    if (!formData.deliveryTime) {
      window.showToast?.("Delivery/pickup time is required.", "warning");
      return false;
    }
    if (!formData.venueAddress?.trim()) {
      window.showToast?.("Venue / Delivery address is required.", "warning");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.cakeFlavor?.trim()) {
      window.showToast?.("Please specify cake flavor.", "warning");
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2);
      } else if (currentStep === 2 && validateStep2()) {
        setCurrentStep(3);
      }
      return;
    }
    handleSaveOrder(e);
  };

  return (
    <div className="space-y-6">
      <motion.div
        key="form-subpage"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700/60 shadow-sm w-full mx-auto"
      >
        <div className="flex items-start gap-3 mb-6 text-left">
          <button
            onClick={() => handleSetViewMode("list")}
            className="mt-0.5 p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-200">
              {editingOrderId ? "Modify Event Order" : "New Event Order"}
            </h2>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-400">
              {editingOrderId ? "Revise sweet details for this event schedule." : "Capture every sweet detail for their special day."}
            </p>
          </div>
        </div>

        {/* Multi-step progress stepper */}
        <div className="mb-10 select-none max-w-2xl mx-auto">
          <div className="relative flex items-center justify-between px-2">
            <div className="absolute left-6 right-6 top-5 h-[3px] bg-zinc-100 dark:bg-zinc-750 z-0 rounded-full" />
            
            <div 
              className="absolute left-6 top-5 h-[3px] bg-gradient-to-r from-primary-brand to-sweet-pink dark:from-orange-400 dark:to-orange-300 z-0 transition-all duration-500 ease-out rounded-full"
              style={{ width: `calc(${((currentStep - 1) / 2) * 100}% - 4px)` }}
            />

            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-305 border shadow-sm ${
                currentStep === 1
                  ? "bg-primary-brand text-white border-primary-brand dark:bg-orange-400 dark:border-orange-300 ring-4 ring-primary-brand/20 dark:ring-orange-400/20 scale-105"
                  : currentStep > 1
                  ? "bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-500"
                  : "bg-white text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
              }`}>
                {currentStep > 1 ? <Check className="w-5 h-5" strokeWidth={3} /> : <User className="w-4.5 h-4.5" strokeWidth={2.5} />}
              </div>
              <span className={`text-[10px] font-extrabold tracking-widest uppercase transition-colors duration-300 ${
                currentStep === 1
                  ? "text-primary-brand dark:text-orange-400"
                  : currentStep > 1
                  ? "text-emerald-500 dark:text-emerald-400 font-bold"
                  : "text-zinc-400 dark:text-zinc-550"
              }`}>
                Client
              </span>
            </button>

            {/* Step 2 Button */}
            <button
              type="button"
              onClick={() => {
                if (currentStep > 2) setCurrentStep(2);
                else if (currentStep === 1 && validateStep1()) setCurrentStep(2);
              }}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-305 border shadow-sm ${
                currentStep === 2
                  ? "bg-primary-brand text-white border-primary-brand dark:bg-orange-400 dark:border-orange-300 ring-4 ring-primary-brand/20 dark:ring-orange-400/20 scale-105"
                  : currentStep > 2
                  ? "bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600 dark:border-emerald-500"
                  : "bg-white text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
              }`}>
                {currentStep > 2 ? <Check className="w-5 h-5" strokeWidth={3} /> : <Sparkles className="w-4.5 h-4.5" strokeWidth={2.5} />}
              </div>
              <span className={`text-[10px] font-extrabold tracking-widest uppercase transition-colors duration-300 ${
                currentStep === 2
                  ? "text-primary-brand dark:text-orange-400"
                  : currentStep > 2
                  ? "text-emerald-500 dark:text-emerald-400 font-bold"
                  : "text-zinc-400 dark:text-zinc-550"
              }`}>
                Cake Specs
              </span>
            </button>

            {/* Step 3 Button */}
            <button
              type="button"
              onClick={() => {
                if (currentStep === 2 && validateStep2()) setCurrentStep(3);
                else if (currentStep === 1 && validateStep1() && validateStep2()) setCurrentStep(3);
              }}
              className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-305 border shadow-sm ${
                currentStep === 3
                  ? "bg-primary-brand text-white border-primary-brand dark:bg-orange-400 dark:border-orange-300 ring-4 ring-primary-brand/20 dark:ring-orange-400/20 scale-105"
                  : "bg-white text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
              }`}>
                <Calculator className="w-4.5 h-4.5" strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-extrabold tracking-widest uppercase transition-colors duration-300 ${
                currentStep === 3
                  ? "text-primary-brand dark:text-orange-400"
                  : "text-zinc-400 dark:text-zinc-550"
              }`}>
                Review & Pay
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6 text-left">
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar text-left">
            <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {/* Customer Details Area */}
                <section className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sweet-pink dark:text-pink-400" />
                    <h3 className="text-xs font-bold text-sweet-pink dark:text-pink-400 font-sans uppercase tracking-wider">
                      Customer Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Select customer profile</label>
                      <Select
                        styles={customSelectStyles}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Search / Select profile..."
                        value={(() => {
                          const allOpts = [
                            { value: "", label: "-- Choose Existing --" },
                            ...customerOptions,
                            { value: "new", label: "Add Custom/New Client" }
                          ];
                          return allOpts.find(o => o.value === formData.customerId) || { value: "", label: "-- Choose Existing --" };
                        })()}
                        options={[
                          { value: "", label: "-- Choose Existing --" },
                          ...customerOptions,
                          { value: "new", label: "Add Custom/New Client" }
                        ]}
                        onInputChange={(inputValue) => setCustomerSearch(inputValue)}
                        onChange={(option) => handleCustomerChange(option?.value || "")}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Customer Name</label>
                      <FastInput
                        required
                        type="text"
                        placeholder="e.g. Eleanor Rigby"
                        value={formData.customerName}
                        disabled={formData.customerId !== "new" && formData.customerId !== ""}
                        onChange={(val) => setFormData({ ...formData, customerName: val })}
                        className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand placeholder:text-zinc-300 disabled:opacity-60 text-zinc-850 dark:text-zinc-150 text-left"
                      />
                    </div>

                    <div className="flex flex-col col-span-1 md:col-span-2 gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Mobile Number</label>
                      <FastInput
                        required
                        type="tel"
                        placeholder="+1 234 567 890"
                        value={formData.customerMobile}
                        disabled={formData.customerId !== "new" && formData.customerId !== ""}
                        onChange={(val) => setFormData({ ...formData, customerMobile: val })}
                        className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand placeholder:text-zinc-300 disabled:opacity-60 text-zinc-850 dark:text-zinc-150 text-left"
                      />
                    </div>
                  </div>
                </section>

                {/* Event Details Section */}
                <section className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sweet-pink dark:text-pink-400" />
                    <h3 className="text-xs font-bold text-sweet-pink dark:text-pink-400 uppercase tracking-wider">
                      Event Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-zinc-500">Event Type</label>
                      <CreatableSelect
                        styles={customSelectStyles}
                        placeholder="Select or type custom..."
                        value={formData.eventType ? { value: formData.eventType, label: formData.eventType } : null}
                        options={dynamicEventTypes}
                        onChange={(opt) => setFormData({ ...formData, eventType: opt?.value || "" })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-zinc-500">Event Date</label>
                      <input
                        required
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            eventDate: val,
                            deliveryDate: prev.deliveryDate ? prev.deliveryDate : val,
                          }));
                        }}
                        className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand text-zinc-805 dark:text-zinc-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-zinc-500">Delivery / Pickup Date</label>
                      <input
                        required
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand text-zinc-805 dark:text-zinc-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-zinc-500">Delivery/Pickup Time</label>
                      <Select
                        styles={customSelectStyles}
                        isSearchable={true}
                        placeholder="Select 30-min slot"
                        value={
                          ((): { value: string; label: string } => {
                            let t = formData.deliveryTime || "09:00";
                            const parts = t.split(":");
                            let h = parseInt(parts[0]) || 0;
                            let mVal = parts[1] || "00";
                            let ap = h >= 12 ? "PM" : "AM";
                            let hClean = h % 12 === 0 ? 12 : h % 12;
                            return { value: t, label: `${hClean}:${mVal} ${ap}` };
                          })()
                        }
                        options={(() => {
                          const slots = [];
                          for (let hour = 0; hour < 24; hour++) {
                            for (let min of ["00", "30"]) {
                              const val = `${hour.toString().padStart(2, "0")}:${min}`;
                              const ap = hour >= 12 ? "PM" : "AM";
                              const hClean = hour % 12 === 0 ? 12 : hour % 12;
                              slots.push({ value: val, label: `${hClean}:${min} ${ap}` });
                            }
                          }
                          return slots;
                        })()}
                        onChange={(opt) => setFormData({ ...formData, deliveryTime: opt?.value || "09:00" })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <label className="text-xs font-bold text-zinc-500">Venue / Delivery Address</label>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-650 dark:text-zinc-405 font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.venueAddress === "In-store pickup"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, venueAddress: "In-store pickup" });
                              } else {
                                setFormData({ ...formData, venueAddress: "" });
                              }
                            }}
                            className="rounded border-zinc-300 text-primary-brand focus:ring-primary-brand accent-primary-brand"
                          />
                          <span>In-store pickup</span>
                        </label>
                      </div>
                      <FastTextArea
                        required
                        rows={2}
                        placeholder="e.g. Full street home address, packaging hub, or desk name for pickup"
                        value={formData.venueAddress}
                        onChange={(val) => setFormData({ ...formData, venueAddress: val })}
                        className="bg-white dark:bg-zinc-800 text-xs p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand placeholder:text-zinc-400 min-h-[50px] resize-none text-zinc-800 dark:text-zinc-250 font-medium text-left"
                      />
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {/* Cake details and weights */}
                <section className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sweet-pink" />
                    <h3 className="text-xs font-bold text-sweet-pink uppercase tracking-wider">
                      Cake Composition
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-550">Shape</label>
                      <Select
                        styles={customSelectStyles}
                        isSearchable={false}
                        value={{ value: formData.cakeShape, label: formData.cakeShape }}
                        options={[
                          { value: "Round", label: "Round" },
                          { value: "Square", label: "Square" },
                          { value: "Heart", label: "Heart" },
                          { value: "Custom", label: "Custom" }
                        ]}
                        onChange={(opt) => setFormData({ ...formData, cakeShape: opt?.value || "Round" })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-555">Weight</label>
                      <Select
                        styles={customSelectStyles}
                        isSearchable={false}
                        value={{ value: formData.cakeWeight, label: formData.cakeWeight }}
                        options={[
                          { value: "0.5 kg", label: "0.5 kg" },
                          { value: "1.0 kg", label: "1.0 kg" },
                          { value: "2.0 kg", label: "2.0 kg" },
                          { value: "3.0 kg", label: "3.0 kg" },
                          { value: "Custom", label: "Custom" }
                        ]}
                        onChange={(opt) => setFormData({ ...formData, cakeWeight: opt?.value || "1.0 kg" })}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-zinc-555">Flavor</label>
                      <CreatableSelect
                        styles={customSelectStyles}
                        placeholder="Select or type custom..."
                        value={formData.cakeFlavor ? { value: formData.cakeFlavor, label: formData.cakeFlavor } : null}
                        options={dynamicFlavors}
                        onChange={(opt) => setFormData({ ...formData, cakeFlavor: opt?.value || "" })}
                      />
                    </div>

                    {/* Egg / Eggless toggles */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-555">Preference</label>
                      <div className="flex gap-2 items-center h-full pt-1">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="preference"
                            value="Egg"
                            checked={formData.preference === "Egg"}
                            onChange={() => setFormData({ ...formData, preference: "Egg" })}
                            className="text-primary-brand focus:ring-primary-brand border-zinc-305 accent-primary-brand"
                          />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Egg</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer select-none ml-2">
                          <input
                            type="radio"
                            name="preference"
                            value="Eggless"
                            checked={formData.preference === "Eggless"}
                            onChange={() => setFormData({ ...formData, preference: "Eggless" })}
                            className="text-primary-brand focus:ring-primary-brand border-zinc-305 accent-primary-brand"
                          />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Eggless</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cake Layers */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <label className="text-xs font-bold text-zinc-500">Layers (Select Tier)</label>
                    <div className="grid grid-cols-3 gap-2 pb-1">
                      {(["Single", "Double Tier", "Triple Tier"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormData({ ...formData, layers: lvl })}
                          className={`px-2 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer text-center truncate ${
                            formData.layers === lvl
                              ? "bg-primary-brand text-white border-primary-brand dark:bg-orange-400 dark:border-orange-300"
                              : "bg-white dark:bg-zinc-800 text-zinc-655 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Inscriptions customizations block */}
                <section className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sweet-pink" />
                    <h3 className="text-xs font-bold text-sweet-pink uppercase tracking-wider">
                      Customizations
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Cake Inscription / Theme Text</label>
                      <FastInput
                        type="text"
                        placeholder="e.g. Happy 5th Birthday Samantha!"
                        value={formData.cakeInscription}
                        onChange={(val) => setFormData({ ...formData, cakeInscription: val })}
                        className="bg-white dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand text-zinc-850 dark:text-zinc-150 text-left"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Special Instructions / Allergens</label>
                      <FastTextArea
                        rows={2}
                        placeholder="Specify packaging requirements, nut allergies, pastel color schemes, or general baking notes..."
                        value={formData.specialInstructions}
                        onChange={(val) => setFormData({ ...formData, specialInstructions: val })}
                        className="bg-white dark:bg-zinc-800 text-xs p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 text-zinc-850 dark:text-zinc-150 text-left"
                      />
                    </div>

                    {/* Reference Image Capture & Upload */}
                    <div className="flex flex-col gap-1.5 text-left border-t border-zinc-200/50 dark:border-zinc-750/50 pt-3">
                      <label className="text-xs font-bold text-zinc-500">Cake Design Reference Image</label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <div 
                          className="border-2 border-dashed border-zinc-250 dark:border-zinc-700 hover:border-primary-brand dark:hover:border-orange-400 rounded-2xl p-4 text-center cursor-pointer transition-colors relative flex flex-col justify-center items-center select-none min-h-[150px]"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  setFormData({ ...formData, referenceImage: reader.result });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        >
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === "string") {
                                    setFormData({ ...formData, referenceImage: reader.result });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            id="order-reference-image-input"
                          />
                          <Upload className="w-5 h-5 mx-auto mb-2 text-zinc-500 dark:text-zinc-500" />
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Upload Reference Pic
                          </p>
                          <p className="text-[10px] text-zinc-450 mt-1">
                            Drag file here or click to browse
                          </p>
                        </div>

                        {/* Webcam Capture */}
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 min-h-[150px] relative overflow-hidden">
                          {formData.referenceImage ? (
                            <div className="absolute inset-0 bg-white dark:bg-zinc-800 z-10 flex flex-col p-2">
                              <img src={formData.referenceImage} alt="Captured Reference preview" className="w-full h-full object-contain rounded-xl" />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, referenceImage: "" })}
                                className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-transform active:scale-95 shadow"
                                title="Delete Design Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : null}

                          {cameraActive ? (
                            <div className="w-full h-full flex flex-col items-center justify-between gap-2">
                              <video 
                                ref={videoRef} 
                                className="w-full h-24 object-cover rounded-lg bg-black"
                                playsInline 
                                muted
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={capturePhoto}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Snap
                                </button>
                                <button
                                  type="button"
                                  onClick={stopCamera}
                                  className="px-3 py-1 bg-zinc-400 hover:bg-zinc-500 text-white text-[11px] font-bold rounded-lg transition-transform active:scale-95 cursor-pointer"
                                >
                                  Off
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Camera className="w-5 h-5 text-zinc-500" />
                              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-350">
                                Direct Camera Capture
                              </p>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-3 py-1.5 bg-primary-brand text-white text-[11px] font-bold rounded-lg transition-transform active:scale-95 cursor-pointer shadow-sm hover:opacity-95"
                              >
                                Activate Web Camera
                              </button>
                              {cameraError && (
                                <p className="text-[10px] text-rose-500 mt-1">{cameraError}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className={`grid grid-cols-1 ${editingOrderId ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-6`}
              >
                {/* Review Specs Summary Card */}
                <section className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-700/60 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800/80">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Review Specifications
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-zinc-655 dark:text-zinc-300 font-sans">
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40">
                      <span className="font-bold text-zinc-400">Client:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">{formData.customerName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40">
                      <span className="font-bold text-zinc-400">Mobile:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formData.customerMobile}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40">
                      <span className="font-bold text-zinc-400">Event Date:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatDate(formData.eventDate)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40">
                      <span className="font-bold text-zinc-400">Delivery:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatDate(formData.deliveryDate)} at {(() => {
                          const t = formData.deliveryTime || "09:00";
                          const parts = t.split(":");
                          const h = parseInt(parts[0]) || 0;
                          const mVal = parts[1] || "00";
                          const ap = h >= 12 ? "PM" : "AM";
                          const hClean = h % 12 === 0 ? 12 : h % 12;
                          return `${hClean}:${mVal} ${ap}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40 sm:col-span-2">
                      <span className="font-bold text-zinc-400">Venue:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[320px]" title={formData.venueAddress}>{formData.venueAddress}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40">
                      <span className="font-bold text-zinc-400">Composition:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formData.cakeShape} • {formData.cakeWeight} • {formData.layers}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40">
                      <span className="font-bold text-zinc-400">Flavor / Pref:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">{formData.cakeFlavor} ({formData.preference})</span>
                    </div>
                    {formData.cakeInscription && (
                      <div className="flex justify-between py-1 border-b border-zinc-100/50 dark:border-zinc-800/40 sm:col-span-2">
                        <span className="font-bold text-zinc-400">Inscription:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 italic">"{formData.cakeInscription}"</span>
                      </div>
                    )}
                    {formData.referenceImage && (
                      <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                        <span className="font-bold text-zinc-400">Design Ref Pic Attached:</span>
                        <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden bg-zinc-100">
                          <img src={formData.referenceImage} alt="Ref Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Pricing summary widget showing dynamic computation */}
                <section className="bg-primary-brand/5 dark:bg-orange-950/20 p-5 rounded-2xl border border-primary-brand/10 dark:border-orange-900/30 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-primary-brand dark:text-orange-400" />
                    <h3 className="text-xs font-bold text-primary-brand dark:text-orange-400 uppercase tracking-widest font-sans">
                      Pricing Summary
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Pre-calculated based on selected weights and flavors. Customize values as needed:</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-655 dark:text-zinc-400">Base Cake Price</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2 py-1 max-w-[124px]">
                        <span className="text-zinc-400 text-xs">{getCurrencySymbol()}</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={priceCalculation.basePrice.toFixed(2)}
                          value={overrideBasePrice}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") {
                              setOverrideBasePrice("");
                            } else {
                              if (/^0\d+/.test(val)) {
                                val = val.replace(/^0+/, "");
                              }
                              setOverrideBasePrice(val);
                            }
                          }}
                          className="bg-transparent border-none outline-none text-xs w-full font-bold text-zinc-805 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-655 dark:text-zinc-400">Decoration Charge</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2 py-1 max-w-[124px]">
                        <span className="text-zinc-400 text-xs">{getCurrencySymbol()}</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={priceCalculation.decorationCharge.toFixed(2)}
                          value={overrideDecorationCharge}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") {
                              setOverrideDecorationCharge("");
                            } else {
                              if (/^0\d+/.test(val)) {
                                val = val.replace(/^0+/, "");
                              }
                              setOverrideDecorationCharge(val);
                            }
                          }}
                          className="bg-transparent border-none outline-none text-xs w-full font-bold text-zinc-805 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-655 dark:text-zinc-400">Express Delivery Fee</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2 py-1 max-w-[124px]">
                        <span className="text-zinc-400 text-xs">{getCurrencySymbol()}</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={priceCalculation.deliveryFee.toFixed(2)}
                          value={overrideDeliveryFee}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") {
                              setOverrideDeliveryFee("");
                            } else {
                              if (/^0\d+/.test(val)) {
                                val = val.replace(/^0+/, "");
                              }
                              setOverrideDeliveryFee(val);
                            }
                          }}
                          className="bg-transparent border-none outline-none text-xs w-full font-bold text-zinc-805 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-700/80 my-2" />

                    <div className="flex justify-between items-center pt-1">
                      <span className="font-serif font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">Total Amount Due</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-xl px-2.5 py-1.5 max-w-[140px] shadow-sm">
                        <span className="text-primary-brand dark:text-orange-400 font-bold">{getCurrencySymbol()}</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={(
                            (overrideBasePrice ? parseFloat(overrideBasePrice) || 0 : priceCalculation.basePrice) +
                            (overrideDecorationCharge ? parseFloat(overrideDecorationCharge) || 0 : priceCalculation.decorationCharge) +
                            (overrideDeliveryFee ? parseFloat(overrideDeliveryFee) || 0 : priceCalculation.deliveryFee)
                          ).toFixed(2)}
                          value={overrideTotalAmount}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") {
                              setOverrideTotalAmount("");
                            } else {
                              if (/^0\d+/.test(val)) {
                                val = val.replace(/^0+/, "");
                              }
                              setOverrideTotalAmount(val);
                            }
                          }}
                          className="bg-transparent border-none outline-none text-xs font-bold text-primary-brand dark:text-orange-400 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Optional Deposit / Payment Details section */}
                {!editingOrderId && (
                  <section className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 space-y-3 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-sans">
                        Initial Deposit / Payment Status
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 font-sans">
                        <label className="text-xs font-bold text-zinc-505">Deposit Amount Received ({getCurrencySymbol()})</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Leave empty or 0 if unpaid"
                          value={formData.initialPaidAmount}
                          onChange={(e) => setFormData({ ...formData, initialPaidAmount: e.target.value })}
                          className="bg-white dark:bg-zinc-800 text-xs p-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-zinc-805 dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div className="flex flex-col gap-1 font-sans">
                        <label className="text-xs font-bold text-zinc-505">Payment Method</label>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                          className="bg-white dark:bg-zinc-800 text-xs p-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
                        >
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 font-sans">
                      <label className="text-xs font-bold text-zinc-505">Payment Notes / Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. Deposit paid via UPI, full advance payment"
                        value={formData.paymentNotes}
                        onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                        className="bg-white dark:bg-zinc-800 text-xs p-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none text-zinc-805 dark:text-zinc-200"
                      />
                    </div>
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700/60">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex-1 py-3 px-6 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {currentStep < 3 && (
              <button
                key="wizard-next-btn"
                type="button"
                onClick={() => {
                  if (currentStep === 1 && validateStep1()) {
                    setCurrentStep(2);
                  } else if (currentStep === 2 && validateStep2()) {
                    setCurrentStep(3);
                  }
                }}
                className="flex-1 py-3 px-6 rounded-full bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
            
            {currentStep === 3 && (
              <button
                key="wizard-submit-btn"
                type="submit"
                disabled={saving || saveSuccess}
                className={`flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 ${
                  saveSuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white"
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Order Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {editingOrderId ? "Save Changes" : "Create Event Order"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
