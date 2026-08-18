import React, { useState, useMemo, useEffect, useRef } from "react";
import { type Order, type Customer, type BakeryProfile } from "../types";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { localDb } from "../db";
import { formatPrice } from "../utils/format";

export interface UseOrdersProps {
  onAddOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<any>;
  onUpdateOrder?: (order: Order) => Promise<any>;
  onUpdateOrderStatus: (id: string, status: Order["status"]) => void;
  initialViewMode?: "list" | "form" | "detail";
  onViewModeChange?: (mode: "list" | "form" | "detail") => void;
  calMonth?: number;
  calYear?: number;
  viewTab?: "list" | "calendar";
}

export function useOrders({
  onAddOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
  initialViewMode = "list",
  onViewModeChange,
  calMonth,
  calYear,
  viewTab,
}: UseOrdersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">(initialViewMode);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [bakeryProfile, setBakeryProfile] = useState<BakeryProfile | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("delivery-soonest");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Order completion captures
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);
  const [profitAmount, setProfitAmount] = useState<string>("");
  const [costGoingText, setCostGoingText] = useState<string>("");
  const [difficultiesText, setDifficultiesText] = useState<string>("");

  // Installment tracker states
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<"Cash" | "Card" | "UPI" | "Bank Transfer">("UPI");
  const [paymentNotesInput, setPaymentNotesInput] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerMobile: "",
    eventType: "Birthday",
    eventDate: "",
    deliveryDate: "",
    deliveryTime: "09:00",
    venueAddress: "",
    cakeShape: "Round",
    cakeWeight: "2.0 kg",
    cakeFlavor: "Belgian Chocolate",
    preference: "Egg" as "Egg" | "Eggless",
    layers: "Double Tier" as "Single" | "Double Tier" | "Triple Tier",
    cakeInscription: "",
    referenceImage: "",
    specialInstructions: "",
    expressDelivery: false,
    paymentStatus: "Unpaid" as "Unpaid" | "Partially Paid" | "Fully Paid",
    initialPaidAmount: "",
    paymentMethod: "UPI" as "Cash" | "Card" | "UPI" | "Bank Transfer",
    paymentNotes: "Initial Deposit",
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Camera state handlers
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [overrideBasePrice, setOverrideBasePrice] = useState("");
  const [overrideDecorationCharge, setOverrideDecorationCharge] = useState("");
  const [overrideDeliveryFee, setOverrideDeliveryFee] = useState("");
  const [overrideTotalAmount, setOverrideTotalAmount] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Pagination states
  const [ordersCurrentPage, setOrdersCurrentPage] = useState<number>(1);
  const [ordersItemsPerPage, setOrdersItemsPerPage] = useState<number>(10);

  // Pagination count
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Set refresh trigger listener
  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  // Load orders
  useEffect(() => {
    async function loadAllOrders() {
      try {
        const loaded = await localDb.orders.filter((o: any) => o.isDeleted !== 1).toArray();
        setOrders(loaded);
      } catch (err) {
        console.error("Failed to load orders in OrdersView:", err);
      }
    }
    loadAllOrders();
  }, [refreshTrigger]);

  // Handle setting view mode
  const handleSetViewMode = (mode: "list" | "form" | "detail") => {
    setViewMode(mode);
    if (onViewModeChange && (mode === "list" || mode === "form")) {
      onViewModeChange(mode);
    }
  };

  // Prepopulate form on routing state change
  useEffect(() => {
    if (location.state && (location.state as any).editOrder) {
      const o = (location.state as any).editOrder as Order;
      setEditingOrderId(o.id);
      const firstPayment = o.paymentHistory && o.paymentHistory.length > 0 ? o.paymentHistory[0] : null;
      setFormData({
        customerId: o.customerId,
        customerName: o.customerName,
        customerMobile: o.customerMobile || "",
        eventType: o.eventType,
        eventDate: o.eventDate,
        deliveryDate: o.deliveryDate || "",
        deliveryTime: o.deliveryTime,
        venueAddress: o.venueAddress || "",
        cakeShape: o.cakeShape || "Round",
        cakeWeight: o.cakeWeight || "2.0 kg",
        cakeFlavor: o.cakeFlavor || "Belgian Chocolate",
        preference: o.preference || "Egg",
        layers: o.layers || "Double Tier",
        cakeInscription: o.cakeInscription || "",
        referenceImage: o.referenceImage || "",
        specialInstructions: o.specialInstructions || "",
        expressDelivery: o.deliveryFee > 0,
        paymentStatus: o.paymentStatus || "Unpaid",
        initialPaidAmount: o.paidAmount && o.paymentHistory && o.paymentHistory.length > 0 ? String(o.paidAmount) : "",
        paymentMethod: firstPayment?.method || "UPI",
        paymentNotes: firstPayment?.notes || "Initial Deposit",
      });
      setOverrideBasePrice(String(o.basePrice));
      setOverrideDecorationCharge(String(o.decorationCharge));
      setOverrideDeliveryFee(String(o.deliveryFee));
      setOverrideTotalAmount(String(o.totalAmount));
      setViewMode("form");
    } else if (location.state && (location.state as any).selectedOrderId) {
      const targetId = (location.state as any).selectedOrderId;
      const targetOrder = orders.find((o) => o.id === targetId);
      if (targetOrder) {
        setSelectedOrderId(targetId);
        setViewMode("detail");
      }
    } else if (location.state && (location.state as any).highlightOrderId) {
      const targetId = (location.state as any).highlightOrderId;
      const targetOrder = orders.find((o) => o.id === targetId);
      if (targetOrder) {
        setSearchTerm(targetOrder.customerName);
        setFilter("all");
        setViewMode("list");
      }
    }
    
    if (location.state && (location.state as any).prepopulatedDate) {
      const pDate = (location.state as any).prepopulatedDate;
      const pName = (location.state as any).prepopulatedCustomerName || "";
      const pMobile = (location.state as any).prepopulatedCustomerMobile || "";
      setFormData((prev) => ({
        ...prev,
        eventDate: pDate,
        deliveryDate: pDate,
        customerName: pName,
        customerMobile: pMobile
      }));
      setViewMode("form");
    }
  }, [location.state, orders]);

  // Bakery profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const bp = await localDb.bakeryProfile.toArray();
        const activeBp = bp.filter((item: any) => item.isDeleted !== 1)[0] || null;
        setBakeryProfile(activeBp);
      } catch (err) {
        console.error("Failed to load bakery profile for invoice print:", err);
      }
    }
    loadProfile();
  }, [viewMode]);

  // Routing params sync
  useEffect(() => {
    if (id && id !== "new") {
      setSelectedOrderId(id);
      setViewMode("detail");
    } else {
      setSelectedOrderId(null);
      setViewMode(initialViewMode);
    }
  }, [id, initialViewMode]);

  // Form options
  const defaultEventTypes = useMemo(() => ["Birthday", "Anniversary", "Wedding", "Baby Shower", "Engagement", "Corporate Event"], []);
  const dynamicEventTypes = useMemo(() => {
    const allUsedEventTypes = orders.map((o) => o.eventType).filter(Boolean);
    const combined = Array.from(new Set([...defaultEventTypes, ...allUsedEventTypes]));
    return combined.map((e) => ({ value: e, label: e }));
  }, [orders, defaultEventTypes]);

  const defaultFlavors = useMemo(() => ["Belgian Chocolate", "French Vanilla", "Red Velvet", "Butterscotch", "Biscoff"], []);
  const dynamicFlavors = useMemo(() => {
    const allUsedFlavors = orders.map((o) => o.cakeFlavor).filter(Boolean);
    const combined = Array.from(new Set([...defaultFlavors, ...allUsedFlavors]));
    return combined.map((f) => ({ value: f, label: f }));
  }, [orders, defaultFlavors]);

  // Reset fields to empty when starting wizard
  useEffect(() => {
    setProfitAmount("");
    setCostGoingText("");
    setDifficultiesText("");
  }, [completingOrder]);

  // Load customer dropdown options
  useEffect(() => {
    async function loadSelectOptions() {
      try {
        // Retrieve all active decrypted customer records from localDb
        const allCust = await localDb.customers.filter((c: any) => c.isDeleted !== 1).toArray();

        // Perform filtering in memory using the decrypted objects
        const matched = allCust.filter(c => {
          if (customerSearch) {
            const lower = customerSearch.toLowerCase();
            return (
              c.name.toLowerCase().includes(lower) || 
              c.mobile.includes(lower) ||
              c.id.toLowerCase().includes(lower)
            );
          }
          return true;
        });

        // Limit the results in memory
        const limitedMatched = matched.slice(0, 50);
        const opts = limitedMatched.map(c => ({ value: c.id, label: `${c.name} (${c.mobile})` }));

        if (formData.customerId && formData.customerId !== "new" && formData.customerId !== "" && formData.customerId !== "guest") {
          const hasSelected = opts.some(o => o.value === formData.customerId);
          if (!hasSelected) {
            const selected = await localDb.customers.get(formData.customerId);
            if (selected) {
              opts.unshift({ value: selected.id, label: `${selected.name} (${selected.mobile})` });
            }
          }
        }
        setCustomerOptions(opts);
      } catch (err) {
        console.error("Failed to load customer select options from localDb:", err);
      }
    }
    loadSelectOptions();
  }, [customerSearch, formData.customerId, refreshTrigger]);

  // Reset pagination on search, filter, dateFilter, sort, viewTab, calMonth, calYear, paymentFilter
  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [searchTerm, filter, sortBy, dateFilter, customStartDate, customEndDate, viewTab, calMonth, calYear, paymentFilter]);

  // Paginated and sorted orders
  useEffect(() => {
    async function loadDbOrders() {
      try {
        const getLocalDateString = (offsetDays = 0) => {
          const d = new Date();
          if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        const startIndex = (ordersCurrentPage - 1) * ordersItemsPerPage;
        const isCalendar = viewTab === "calendar";

        // Query the database to retrieve all active (non-deleted) decrypted orders
        const allOrders = await localDb.orders.filter((o: any) => o.isDeleted !== 1).toArray();

        // Perform all filtering in memory using the decrypted objects
        const matched = allOrders.filter(o => {
          // Apply payment status filter
          if (paymentFilter !== "all" && (o.paymentStatus || "Unpaid") !== paymentFilter) return false;

          if (isCalendar) {
            // Apply status filter only
            const statusLower = (o.status || "").toLowerCase();
            const filterLower = (filter || "").toLowerCase();
            if (filterLower === "active") {
              if (statusLower === "completed" || statusLower === "cancelled") return false;
            } else if (filterLower === "archived") {
              if (statusLower !== "completed" && statusLower !== "cancelled") return false;
            } else if (filterLower !== "all") {
              if (statusLower !== filterLower) return false;
            }

            // Apply current month date filter only
            const targetYear = calYear !== undefined ? calYear : new Date().getFullYear();
            const targetMonth = calMonth !== undefined ? calMonth : new Date().getMonth();
            const yearMonthPrefix = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
            const dateStr = o.deliveryDate || o.eventDate;
            if (!dateStr || !dateStr.startsWith(yearMonthPrefix)) return false;
          } else {
            // Standard List View filtering
            if (searchTerm) {
              const term = searchTerm.toLowerCase();
              const matchesSearch = 
                (o.customerName || "").toLowerCase().includes(term) ||
                (o.id || "").toLowerCase().includes(term) ||
                (o.eventType || "").toLowerCase().includes(term) ||
                (o.cakeFlavor || "").toLowerCase().includes(term) ||
                (o.paymentStatus || "unpaid").toLowerCase().includes(term);
              if (!matchesSearch) return false;
            }

            const statusLower = (o.status || "").toLowerCase();
            const filterLower = (filter || "").toLowerCase();
            if (filterLower === "active") {
              if (statusLower === "completed" || statusLower === "cancelled") return false;
            } else if (filterLower === "archived") {
              if (statusLower !== "completed" && statusLower !== "cancelled") return false;
            } else if (filterLower !== "all") {
              if (statusLower !== filterLower) return false;
            }

            // Apply date filters based on deliveryDate (fallback to eventDate)
            const dateStr = o.deliveryDate || o.eventDate;
            if (dateFilter === "future") {
              const todayStr = getLocalDateString(0);
              if (!(dateStr && dateStr > todayStr)) return false;
            } else if (dateFilter === "today") {
              const todayStr = getLocalDateString(0);
              if (!(dateStr && dateStr === todayStr)) return false;
            } else if (dateFilter === "tomorrow") {
              const tomorrowStr = getLocalDateString(1);
              if (!(dateStr && dateStr === tomorrowStr)) return false;
            } else if (dateFilter === "custom") {
              if (customStartDate && !(dateStr && dateStr >= customStartDate)) return false;
              if (customEndDate && !(dateStr && dateStr <= customEndDate)) return false;
            }
          }
          return true;
        });

        // Perform sorting in memory
        matched.sort((a, b) => {
          if (sortBy === "created-newest") {
            const dateA = a.createdAt || "";
            const dateB = b.createdAt || "";
            return dateB.localeCompare(dateA);
          } else if (sortBy === "created-oldest") {
            const dateA = a.createdAt || "";
            const dateB = b.createdAt || "";
            return dateA.localeCompare(dateB);
          } else if (sortBy === "delivery-soonest") {
            const dateA = a.deliveryDate || a.eventDate || "";
            const dateB = b.deliveryDate || b.eventDate || "";
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            return (a.deliveryTime || "").localeCompare(b.deliveryTime || "");
          } else if (sortBy === "delivery-latest") {
            const dateA = a.deliveryDate || a.eventDate || "";
            const dateB = b.deliveryDate || b.eventDate || "";
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            return (b.deliveryTime || "").localeCompare(a.deliveryTime || "");
          } else if (sortBy === "amount-highest") {
            return (b.totalAmount || 0) - (a.totalAmount || 0);
          } else { // "amount-lowest"
            return (a.totalAmount || 0) - (b.totalAmount || 0);
          }
        });

        // Set counts and paginated results
        setFilteredCount(matched.length);
        setFilteredOrders(matched);
        if (isCalendar) {
          setPaginatedOrders([]);
        } else {
          setPaginatedOrders(matched.slice(startIndex, startIndex + ordersItemsPerPage));
        }
      } catch (err) {
        console.error("Failed to query orders from localDb:", err);
      }
    }
    loadDbOrders();
  }, [refreshTrigger, searchTerm, filter, ordersCurrentPage, ordersItemsPerPage, sortBy, dateFilter, customStartDate, customEndDate, calMonth, calYear, viewTab, paymentFilter]);

  const ordersTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / ordersItemsPerPage);
  }, [filteredCount, ordersItemsPerPage]);

  // Selected order details query
  useEffect(() => {
    async function loadSelectedOrder() {
      if (!selectedOrderId) {
        setSelectedOrder(null);
        return;
      }
      try {
        const o = await localDb.orders.get(selectedOrderId);
        setSelectedOrder(o || null);
      } catch (err) {
        console.error("Failed to load selected order from localDb:", err);
      }
    }
    loadSelectedOrder();
  }, [selectedOrderId, orders]);

  // Price calculations
  const priceCalculation = useMemo(() => {
    let base = 50; 
    if (formData.cakeWeight === "0.5 kg") base = 35;
    else if (formData.cakeWeight === "1.0 kg") base = 55;
    else if (formData.cakeWeight === "2.0 kg") base = 85;
    else if (formData.cakeWeight === "3.0 kg") base = 120;
    else base = 150;

    let shapeCost = 0;
    if (formData.cakeShape === "Heart") shapeCost = 5;
    else if (formData.cakeShape === "Custom") shapeCost = 15;

    let layerCost = 0;
    if (formData.layers === "Double Tier") layerCost = 15;
    else if (formData.layers === "Triple Tier") layerCost = 30;

    const prefCost = formData.preference === "Eggless" ? 5 : 0;

    const basePrice = base + shapeCost + layerCost + prefCost;
    const decorationCharge = 15.0;
    const deliveryFee = formData.expressDelivery ? 12.0 : 0.0;
    const totalAmount = basePrice + decorationCharge + deliveryFee;

    return {
      basePrice,
      decorationCharge,
      deliveryFee,
      totalAmount
    };
  }, [formData]);

  const handleStartEdit = (o: Order) => {
    if (onViewModeChange) {
      navigate("/orders/new", { state: { editOrder: o } });
    } else {
      setEditingOrderId(o.id);
      const firstPayment = o.paymentHistory && o.paymentHistory.length > 0 ? o.paymentHistory[0] : null;
      setFormData({
        customerId: o.customerId,
        customerName: o.customerName,
        customerMobile: o.customerMobile || "",
        eventType: o.eventType,
        eventDate: o.eventDate,
        deliveryDate: o.deliveryDate || "",
        deliveryTime: o.deliveryTime,
        venueAddress: o.venueAddress || "",
        cakeShape: o.cakeShape || "Round",
        cakeWeight: o.cakeWeight || "2.0 kg",
        cakeFlavor: o.cakeFlavor || "Belgian Chocolate",
        preference: o.preference || "Egg",
        layers: o.layers || "Double Tier",
        cakeInscription: o.cakeInscription || "",
        referenceImage: o.referenceImage || "",
        specialInstructions: o.specialInstructions || "",
        expressDelivery: o.deliveryFee > 0,
        paymentStatus: o.paymentStatus || "Unpaid",
        initialPaidAmount: o.paidAmount && o.paymentHistory && o.paymentHistory.length > 0 ? String(o.paidAmount) : "",
        paymentMethod: firstPayment?.method || "UPI",
        paymentNotes: firstPayment?.notes || "Initial Deposit",
      });
      setOverrideBasePrice(String(o.basePrice));
      setOverrideDecorationCharge(String(o.decorationCharge));
      setOverrideDeliveryFee(String(o.deliveryFee));
      setOverrideTotalAmount(String(o.totalAmount));
      handleSetViewMode("form");
    }
  };

  // Camera stream handler
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Could not access camera:", err);
      setCameraError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        setFormData((prev) => ({ ...prev, referenceImage: dataUri }));
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn(e);
        }
      }
    };
  }, []);

  const handleCustomerChange = async (customerId: string) => {
    if (customerId === "new" || customerId === "") {
      setFormData(prev => ({
        ...prev,
        customerId: customerId,
        customerName: "",
        customerMobile: ""
      }));
      return;
    }

    const c = await localDb.customers.get(customerId);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        customerId: c.id,
        customerName: c.name,
        customerMobile: c.mobile,
      }));
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.eventDate || !formData.deliveryDate || !formData.deliveryTime) {
      window.showToast("Please fill in Customer Name, Event Date, Delivery Date, and Delivery Time", "warning");
      return;
    }

    setSaving(true);
    try {
      const parsedBasePrice = overrideBasePrice ? parseFloat(overrideBasePrice) : priceCalculation.basePrice;
      const parsedDecorationCharge = overrideDecorationCharge ? parseFloat(overrideDecorationCharge) : priceCalculation.decorationCharge;
      const parsedDeliveryFee = overrideDeliveryFee ? parseFloat(overrideDeliveryFee) : priceCalculation.deliveryFee;
      const parsedTotalAmount = overrideTotalAmount 
        ? parseFloat(overrideTotalAmount) 
        : (parsedBasePrice + parsedDecorationCharge + parsedDeliveryFee);

      const finalBase = isNaN(parsedBasePrice) ? priceCalculation.basePrice : parsedBasePrice;
      const finalDecoration = isNaN(parsedDecorationCharge) ? priceCalculation.decorationCharge : parsedDecorationCharge;
      const finalDelivery = isNaN(parsedDeliveryFee) ? priceCalculation.deliveryFee : parsedDeliveryFee;
      const finalTotal = isNaN(parsedTotalAmount) ? priceCalculation.totalAmount : parsedTotalAmount;

      if (editingOrderId && onUpdateOrder) {
        const original = orders.find((o) => o.id === editingOrderId);
        let finalPaymentHistory = original?.paymentHistory || [];
        let finalPaidAmount = original?.paidAmount || 0;
        let finalPaymentStatus = original?.paymentStatus || "Unpaid";

        const parsedInitialPaid = formData.initialPaidAmount ? parseFloat(formData.initialPaidAmount) : 0;
        const initialPaid = isNaN(parsedInitialPaid) ? 0 : parsedInitialPaid;

        if (finalPaymentHistory.length === 0 && initialPaid > 0) {
          finalPaymentHistory = [{
            id: "pmt-" + Math.random().toString(36).substring(2, 9),
            amount: initialPaid,
            date: new Date().toISOString(),
            method: formData.paymentMethod,
            notes: formData.paymentNotes || "Initial Deposit",
          }];
          finalPaidAmount = initialPaid;
          finalPaymentStatus = initialPaid >= finalTotal - 0.05 ? "Fully Paid" : "Partially Paid";
        } else if (finalPaymentHistory.length > 0) {
          if (finalPaidAmount >= finalTotal - 0.05) {
            finalPaymentStatus = "Fully Paid";
          } else if (finalPaidAmount > 0) {
            finalPaymentStatus = "Partially Paid";
          } else {
            finalPaymentStatus = "Unpaid";
          }
        }

        await onUpdateOrder({
          id: editingOrderId,
          customerId: formData.customerId || "guest",
          customerName: formData.customerName,
          customerMobile: formData.customerMobile,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          deliveryDate: formData.deliveryDate || formData.eventDate,
          deliveryTime: formData.deliveryTime,
          venueAddress: formData.venueAddress,
          cakeShape: formData.cakeShape,
          cakeWeight: formData.cakeWeight,
          cakeFlavor: formData.cakeFlavor,
          preference: formData.preference,
          layers: formData.layers,
          cakeInscription: formData.cakeInscription,
          referenceImage: formData.referenceImage,
          specialInstructions: formData.specialInstructions,
          basePrice: finalBase,
          decorationCharge: finalDecoration,
          deliveryFee: finalDelivery,
          totalAmount: finalTotal,
          status: original ? original.status : "Pending",
          paymentStatus: finalPaymentStatus,
          paidAmount: finalPaidAmount,
          paymentHistory: finalPaymentHistory,
          createdAt: original ? original.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const parsedInitialPaid = formData.initialPaidAmount ? parseFloat(formData.initialPaidAmount) : 0;
        const initialPaid = isNaN(parsedInitialPaid) ? 0 : parsedInitialPaid;

        let finalPaymentHistory = [];
        let finalPaymentStatus: "Unpaid" | "Partially Paid" | "Fully Paid" = "Unpaid";

        if (initialPaid > 0) {
          finalPaymentHistory.push({
            id: "pmt-" + Math.random().toString(36).substring(2, 9),
            amount: initialPaid,
            date: new Date().toISOString(),
            method: formData.paymentMethod,
            notes: formData.paymentNotes || "Initial Deposit",
          });
          finalPaymentStatus = initialPaid >= finalTotal - 0.05 ? "Fully Paid" : "Partially Paid";
        }

        await onAddOrder({
          customerId: formData.customerId || "guest",
          customerName: formData.customerName,
          customerMobile: formData.customerMobile,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          deliveryDate: formData.deliveryDate || formData.eventDate,
          deliveryTime: formData.deliveryTime,
          venueAddress: formData.venueAddress,
          cakeShape: formData.cakeShape,
          cakeWeight: formData.cakeWeight,
          cakeFlavor: formData.cakeFlavor,
          preference: formData.preference,
          layers: formData.layers,
          cakeInscription: formData.cakeInscription,
          referenceImage: formData.referenceImage,
          specialInstructions: formData.specialInstructions,
          basePrice: finalBase,
          decorationCharge: finalDecoration,
          deliveryFee: finalDelivery,
          totalAmount: finalTotal,
          status: "Pending",
          paymentStatus: finalPaymentStatus,
          paidAmount: initialPaid,
          paymentHistory: finalPaymentHistory,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setFormData({
          customerId: "",
          customerName: "",
          customerMobile: "",
          eventType: "Birthday",
          eventDate: "",
          deliveryDate: "",
          deliveryTime: "09:00",
          venueAddress: "",
          cakeShape: "Round",
          cakeWeight: "2.0 kg",
          cakeFlavor: "Belgian Chocolate",
          preference: "Egg",
          layers: "Double Tier",
          cakeInscription: "",
          referenceImage: "",
          specialInstructions: "",
          expressDelivery: false,
          paymentStatus: "Unpaid",
          initialPaidAmount: "",
          paymentMethod: "UPI",
          paymentNotes: "Initial Deposit",
        });
        setOverrideBasePrice("");
        setOverrideDecorationCharge("");
        setOverrideDeliveryFee("");
        setOverrideTotalAmount("");
        setEditingOrderId(null);
        handleSetViewMode("list");
      }, 1500);
    } catch (e) {
      console.error(e);
      window.showToast("Failed to save order", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentInstallment = async () => {
    if (!selectedOrder || !onUpdateOrder) return;
    
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      window.showToast("Please enter a valid payment amount.", "warning");
      return;
    }
    
    const remaining = selectedOrder.totalAmount - (selectedOrder.paidAmount || 0);
    if (parsedAmount > remaining + 0.05) {
      window.showToast(`Entered amount exceeds the remaining balance of ${formatPrice(remaining)}.`, "warning");
      return;
    }
    
    const newInstallment = {
      id: "pmt-" + Math.random().toString(36).substring(2, 9),
      amount: parsedAmount,
      date: new Date().toISOString(),
      method: paymentMethodSelect,
      notes: paymentNotesInput || `Installment #${(selectedOrder.paymentHistory || []).length + 1}`,
    };
    
    const updatedHistory = [...(selectedOrder.paymentHistory || []), newInstallment];
    const updatedPaid = updatedHistory.reduce((sum, item) => sum + item.amount, 0);
    
    let updatedStatus: "Unpaid" | "Partially Paid" | "Fully Paid" = "Unpaid";
    if (updatedPaid >= selectedOrder.totalAmount - 0.05) {
      updatedStatus = "Fully Paid";
    } else if (updatedPaid > 0) {
      updatedStatus = "Partially Paid";
    }
    
    const updatedOrder = {
      ...selectedOrder,
      paidAmount: updatedPaid,
      paymentStatus: updatedStatus,
      paymentHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await onUpdateOrder(updatedOrder);
      window.showToast("Payment installment recorded successfully!", "success");
      setPaymentAmount("");
      setPaymentNotesInput("");
      setShowAddPayment(false);
    } catch (err) {
      console.error(err);
      window.showToast("Failed to record payment installment.", "error");
    }
  };

  const handleDeletePaymentInstallment = async (installmentId: string) => {
    if (!selectedOrder || !onUpdateOrder) return;
    if (!confirm("Are you sure you want to void this payment installment?")) return;
    
    const updatedHistory = (selectedOrder.paymentHistory || []).filter(item => item.id !== installmentId);
    const updatedPaid = updatedHistory.reduce((sum, item) => sum + item.amount, 0);
    
    let updatedStatus: "Unpaid" | "Partially Paid" | "Fully Paid" = "Unpaid";
    if (updatedPaid >= selectedOrder.totalAmount - 0.05) {
      updatedStatus = "Fully Paid";
    } else if (updatedPaid > 0) {
      updatedStatus = "Partially Paid";
    }
    
    const updatedOrder = {
      ...selectedOrder,
      paidAmount: updatedPaid,
      paymentStatus: updatedStatus,
      paymentHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await onUpdateOrder(updatedOrder);
      window.showToast("Payment installment voided successfully.", "success");
    } catch (err) {
      console.error(err);
      window.showToast("Failed to void payment installment.", "error");
    }
  };

  const handleCompleteOrderSave = async () => {
    if (!completingOrder) return;
    if (onUpdateOrder) {
      await onUpdateOrder({
        ...completingOrder,
        status: "Completed",
        profitAmount: parseFloat(profitAmount) || 0,
        profitDifficulties: difficultiesText,
        profitCostGoing: costGoingText
      });
    } else {
      onUpdateOrderStatus(completingOrder.id, "Completed");
    }
    setCompletingOrder(null);
    navigate("/");
  };

  return {
    orders,
    viewMode,
    setViewMode,
    selectedOrderId,
    setSelectedOrderId,
    bakeryProfile,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
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
    ordersCurrentPage,
    setOrdersCurrentPage,
    ordersItemsPerPage,
    setOrdersItemsPerPage,
    paginatedOrders,
    filteredCount,
    ordersTotalPages,
    filteredOrders,
    selectedOrder,
    dynamicEventTypes,
    dynamicFlavors,
    priceCalculation,
    sortBy,
    setSortBy,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    paymentFilter,
    setPaymentFilter,
    handleSetViewMode,
    handleStartEdit,
    startCamera,
    stopCamera,
    capturePhoto,
    handleCustomerChange,
    handleSaveOrder,
    handleAddPaymentInstallment,
    handleDeletePaymentInstallment,
    handleCompleteOrderSave,
  };
}
