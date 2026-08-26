// File Path: /src/components/CustomerCreateView.tsx
import React, { useState, useEffect, memo } from "react";
import { memoWithData } from "../utils/memo";
import Select from "react-select";
import { customSelectStyles } from "./customSelectStyles";
import { type Customer } from "../types";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface CustomerCreateViewProps {
  onAddCustomer: (customer: Omit<Customer, "id" | "updatedAt">) => Promise<any>;
  onUpdateCustomer?: (customer: Customer) => Promise<any>;
  onNavigate?: (path: string | number) => void;
  customerToEdit?: Customer | null;
}

function CustomerCreateView({
  onAddCustomer,
  onUpdateCustomer,
  onNavigate,
  customerToEdit,
}: CustomerCreateViewProps) {

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    type: "New" as "Frequent" | "New" | "Corporate",
    totalOrders: 0,
    memberSince: new Date().toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync form data if editing an existing customer
  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name,
        mobile: customerToEdit.mobile,
        type: customerToEdit.type,
        totalOrders: customerToEdit.totalOrders || 0,
        memberSince: customerToEdit.memberSince || new Date().toISOString().slice(0, 10),
      });
    } else {
      setFormData({
        name: "",
        mobile: "",
        type: "New",
        totalOrders: 0,
        memberSince: new Date().toISOString().slice(0, 10),
      });
    }
  }, [customerToEdit]);

  const handleSaveCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      window.showToast?.("Name and mobile are required", "warning");
      return;
    }

    setSaving(true);
    try {
      if (customerToEdit && onUpdateCustomer) {
        await onUpdateCustomer({
          id: customerToEdit.id,
          name: formData.name,
          mobile: formData.mobile,
          type: formData.type,
          totalOrders: Number(formData.totalOrders) || 0,
          memberSince: formData.memberSince || new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        });
        window.showToast?.("Customer profile updated successfully!", "success");
      } else {
        await onAddCustomer({
          name: formData.name,
          mobile: formData.mobile,
          type: formData.type,
          totalOrders: Number(formData.totalOrders) || 0,
          memberSince: formData.memberSince || new Date().toISOString().slice(0, 10),
        });
        window.showToast?.("Customer profile added successfully!", "success");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onNavigate?.("/customers");
      }, 1000);
    } catch (err) {
      console.error(err);
      window.showToast?.("Failed to save customer profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      {/* Header with back button */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm">
        <button
          type="button"
          onClick={() => onNavigate?.(-1)}
          className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-550 dark:text-zinc-400 cursor-pointer transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-serif text-zinc-805 dark:text-zinc-105">
            {customerToEdit ? "Edit Customer Profile" : "Register New Customer"}
          </h2>
          <p className="text-xs text-zinc-405 mt-0.5">
            {customerToEdit ? "Modify client details and contact segments." : "Add a client profile to track orders and segment communication."}
          </p>
        </div>
      </div>

      {/* Main card form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800"
      >
        <form onSubmit={handleSaveCustomerSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Full Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Amara Bennett"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Mobile Contact Number</label>
            <input
              required
              type="text"
              placeholder="e.g. +1 (555) 012-3456"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Type Segment</label>
              <Select
                styles={customSelectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isSearchable={false}
                value={{ value: formData.type, label: formData.type }}
                options={[
                  { value: "New", label: "New" },
                  { value: "Frequent", label: "Frequent" },
                  { value: "Corporate", label: "Corporate" }
                ]}
                onChange={(opt) => 
                  setFormData({
                    ...formData,
                    type: (opt?.value || "New") as "Frequent" | "New" | "Corporate"
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Initial Order Count</label>
              <input
                type="number"
                value={formData.totalOrders}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === "") {
                    setFormData({ ...formData, totalOrders: "" as any });
                  } else {
                    if (/^0\d+/.test(val)) {
                      val = val.replace(/^0+/, "");
                    }
                    setFormData({ ...formData, totalOrders: (parseInt(val, 10) || 0) as any });
                  }
                }}
                className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Member Since</label>
            <input
              type="date"
              value={formData.memberSince}
              onChange={(e) => setFormData({ ...formData, memberSince: e.target.value })}
              className="bg-zinc-50 dark:bg-zinc-800 text-sm p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-brand focus:outline-none dark:text-zinc-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onNavigate?.("/customers")}
              className="px-6 py-2.5 border border-zinc-250 dark:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="px-8 py-2.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-400 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              {saving ? (
                <span>Saving Record...</span>
              ) : success ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Saved!
                </span>
              ) : (
                <span>Save Client Profile</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default memoWithData(CustomerCreateView);
