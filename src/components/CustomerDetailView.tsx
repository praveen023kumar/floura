// File Path: /src/components/CustomerDetailView.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { type Customer, type Order } from "../types";
import { formatPrice, formatDate } from "../utils/format";
import { localDb } from "../db";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  MessageCircle,
  Calendar,
  Edit
} from "lucide-react";
import { motion } from "motion/react";

export default function CustomerDetailView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[]>([]);

  // Sync refresh trigger on local DB updates
  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  // Fetch customer details and order logs
  useEffect(() => {
    async function fetchSelectedDetails() {
      if (!id) return;
      try {
        const [customer, custOrders] = await Promise.all([
          localDb.customers.get(id),
          localDb.orders.filter(o => o.customerId === id && o.isDeleted !== 1).toArray()
        ]);
        setSelectedCustomer(customer || null);

        custOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSelectedCustomerOrders(custOrders);
      } catch (err) {
        console.error("Failed to fetch customer details:", err);
      }
    }
    fetchSelectedDetails();
  }, [id, refreshTrigger]);

  const handleCall = (name: string, num: string) => {
    if (!num) {
      window.showToast?.("No phone number available for this customer.", "error");
      return;
    }
    window.showToast?.(`Dialing ${name} (${num})...`, "success");
    window.location.href = `tel:${num}`;
  };

  const handleSMS = (name: string, num: string) => {
    if (!num) {
      window.showToast?.("No phone number available for this customer.", "error");
      return;
    }
    window.showToast?.(`Opening SMS window for ${name}...`, "success");
    window.location.href = `sms:${num}`;
  };

  const handleWhatsApp = (name: string, num: string) => {
    if (!num) {
      window.showToast?.("No phone number available for this customer.", "error");
      return;
    }
    const cleanNum = num.replace(/\D/g, "");
    if (!cleanNum) {
      window.showToast?.("Invalid phone number format for WhatsApp.", "error");
      return;
    }
    window.showToast?.(`Opening WhatsApp chat with ${name}...`, "success");
    window.open(`https://wa.me/${cleanNum}`, "_blank");
  };

  if (!selectedCustomer) {
    return (
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-zinc-500 font-medium">Customer Profile not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header/Back Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/60 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(location.search);
              const fromOrderId = params.get("fromOrderId");
              if (fromOrderId) {
                navigate(`/orders/${fromOrderId}`);
              } else {
                navigate("/customers");
              }
            }}
            className="p-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
            title="Back to clients list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-zinc-800 dark:text-zinc-100">
                {selectedCustomer.name}
              </h2>
              <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase rounded bg-zinc-100 text-zinc-650 dark:bg-zinc-700 dark:text-zinc-300 tracking-wider font-sans">
                ID: {selectedCustomer.id}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-sans">
              Customer loyalty specs, communication logs, and full bespoke orders archive.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client profile overview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700/60 shadow-sm space-y-4">
            <div className="flex flex-col items-center text-center pb-4 border-b border-zinc-100 dark:border-zinc-700/60">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700 border-2 border-primary-brand/20 shadow-md mb-3">
                <img
                  src={
                    selectedCustomer.name === "Amara Bennett"
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDvK-VSYM6ttAvU1bQXLmi73g7r7BjZdgoXpdKSkHYZ1g0ZY5xMX01iazAnRo1Kt0S_bdJGFeyASi3Ip1BaewMWXmh87UaPieW0r94Hl270EPIl-_n_72yuZDAlMRFUOWQ2O6oRfwxv-JkYkPmzCSqvX47Q3LqjKPsO4pcg8z6NTfVdFjz2FBTewxhPGyWQNvo-cF0OJMRFo7AFkkxSNWjuQq6yiKBlHkczPxB2E-n18AJjwZS6P9y981d0x2BBPFXalmJTEfm526ZJ"
                      : selectedCustomer.name === "Julian Thorne"
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCj9ksb_nWgm3VZm5cs68O1bNLb-icNtltnNe0PIaaYOp0JAmkjXPgGE8g552PW8ontBTlK2do5G9RoaToHYlZXVW3_y_uZLie933eIu58Ol3jUhMmNUNhd66vGbBw759LTR1aDaCekC21tGqvHuoFQ2fC0x9MrJWvAjrPpYbv8IplhvUeXK3G48KLeQQ25ZG1AOm9zzo2Rq83KSHxHEUXXxCJ0zF5OIYDjdM4V4VK5LJHwE-Dtem1Dq0d3wYka22WQ5IlR9ZBkC91e"
                      : selectedCustomer.name === "Sophie Laurent"
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuD3fRKXMsxoORcPTki9B8GeFlRQabcWEMOZSTuU8GSE4KEZ92fB5c8s2pUYN_sbmxszTYaXy4T3M182Q1MQAFc6oUkQIKd4xYR412OscimC8Rkvs2XE_-D03BBSzV1x_U4kjJz47U5LeGSlFe9yWJu4759Mq5GUcjX-F3E1YRgbbu2KG1iQQ4QnpsmDVTPXziJNFjl4mT-IY5tQsFC0g1b5xcEZqQAn7wI67RXuWkd4Bb6FXeIfUWl2lX5zDQmVYttd2K4s93UhHamb"
                      : selectedCustomer.name === "David Chen"
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAO_WNwNsr-58WQE8m0OkygFVqzFl7hSipi2DaAgdnGRIOwo_ZFMsw4E2NgMTTvwP2QMuXyShhgR3ve9WsRsmh6hoAct1lGLFK3aEnso3rEzGif5wu9CUQbTba9x7Ey6fs6j6zKEOM_ITNIXJO7FgOycG1ilDbGDLaMpWBRneDpo9xxUveTlssiTjvcaREvxvpc3ca_4Xg8GyBiNFS5vhV8_rXNyGpxRs6mZEFnLGeUFHdGr3v1TDU6_WwQtWcnC1ZUUozss_NrwGpw"
                      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(selectedCustomer.name)}`
                  }
                  alt={selectedCustomer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-serif font-bold text-lg text-zinc-800 dark:text-zinc-100 font-sans">
                {selectedCustomer.name}
              </h3>
              <p className="font-mono text-xs text-zinc-400 mt-1">{selectedCustomer.mobile}</p>
              <div className="mt-2">
                <span
                  className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    selectedCustomer.type === "Frequent"
                      ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                      : selectedCustomer.type === "Corporate"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {selectedCustomer.type} Tier
                </span>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-sans">Loyal Orders Count</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-serif">
                  {selectedCustomer.totalOrders} Orders
                </strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-sans">Registered Since</span>
                <strong className="text-zinc-700 dark:text-zinc-200 font-sans font-medium">
                  {formatDate(selectedCustomer.memberSince)}
                </strong>
              </div>
            </div>

            <div className="flex gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => navigate("/customers/new", { state: { customer: selectedCustomer } })}
                className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-zinc-700 dark:text-zinc-200 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>

            {/* Direct Contact actions */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700/60 flex flex-wrap gap-2">
              <button
                onClick={() => handleCall(selectedCustomer.name, selectedCustomer.mobile)}
                className="flex-1 bg-primary-brand text-white dark:bg-orange-400 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer transition-all min-w-[80px]"
              >
                <Phone className="w-3.5 h-3.5" /> Call Client
              </button>
              <button
                onClick={() => handleSMS(selectedCustomer.name, selectedCustomer.mobile)}
                className="flex-1 bg-pink-50 text-pink-700 dark:bg-pink-950/25 dark:text-pink-300 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-pink-100 dark:hover:bg-pink-950/40 active:scale-95 cursor-pointer transition-all min-w-[80px]"
              >
                <MessageSquare className="w-3.5 h-3.5" /> SMS Chat
              </button>
              <button
                onClick={() => handleWhatsApp(selectedCustomer.name, selectedCustomer.mobile)}
                className="flex-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-300 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 active:scale-95 cursor-pointer transition-all min-w-[80px]"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Complete bakes order history logs */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-700/60">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-brand dark:text-orange-400" />
                Client Baking Orders History
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-400">
                Total: {selectedCustomerOrders.length} custom bakes
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {selectedCustomerOrders.length > 0 ? (
                selectedCustomerOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary-brand/35 transition-all text-left"
                  >
                    <div className="text-left font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">
                          {o.eventType} Custom Cake
                        </span>
                        <span
                          className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            o.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-400"
                              : o.status === "Cancelled"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/25 dark:text-rose-400"
                              : "bg-amber-100 text-amber-805 dark:bg-amber-950/25 dark:text-amber-400"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {o.cakeFlavor} Flavor &bull; {o.cakeWeight} &bull; {o.layers}
                      </p>
                      <div className="text-[10px] text-zinc-400 mt-2 font-mono">
                        Delivery: {formatDate(o.eventDate)} &bull; ID: {o.id}
                      </div>
                    </div>
                    <div className="text-right sm:self-center shrink-0">
                      <p className="text-base font-serif font-bold text-primary-brand dark:text-orange-400">
                        {formatPrice(o.totalAmount)}
                      </p>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Base Price: {formatPrice(o.basePrice)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  No previous baking orders recorded on file for this client.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
