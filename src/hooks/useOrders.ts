import React, { useState, useMemo, useEffect, useRef } from "react";
import { type Order, type Customer, type BakeryProfile, type Recipe } from "../types";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { localDb } from "../db";
import { formatPrice } from "../utils/format";
import { useQuery } from "@tanstack/react-query";

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


  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">(initialViewMode);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
    cakeWeight: "1.0 kg",
    cakeFlavor: "",
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

  const [selectedCustomerOption, setSelectedCustomerOption] = useState<{ value: string; label: string } | null>(null);
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



  // Load orders using TanStack useQuery
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const loaded = await localDb.orders.query("SELECT id, createdAt, isDeleted, eventType, cakeFlavor FROM orders WHERE isDeleted = 0");
      return loaded as any;
    }
  });

  // Load bakery profile using useQuery
  const { data: bakeryProfile = null } = useQuery<BakeryProfile | null>({
    queryKey: ["bakeryProfile"],
    queryFn: async () => {
      const bp = await localDb.bakeryProfile.toArray();
      return bp.filter((item: any) => item.isDeleted !== 1)[0] || null;
    }
  });

  // Load recipes using useQuery
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["recipes", "all"],
    queryFn: async () => {
      const loaded = await localDb.recipes.query("SELECT * FROM recipes WHERE isDeleted = 0");
      return loaded as any;
    }
  });

  // Load paginated list of orders using useQuery
  const { data: queryResult = { filteredCount: 0, filteredOrders: [], paginatedOrders: [] }, isLoading: loading } = useQuery({
    queryKey: [
      "orders",
      "list",
      searchTerm,
      filter,
      ordersCurrentPage,
      ordersItemsPerPage,
      sortBy,
      dateFilter,
      customStartDate,
      customEndDate,
      calMonth,
      calYear,
      viewTab,
      paymentFilter
    ],
    queryFn: async () => {
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

      // Build base conditions for SQLite query
      const conditions = ["isDeleted = 0"];
      const params: any[] = [];

      // 1. Status Filter
      if (filter) {
        const filterLower = filter.toLowerCase();
        if (filterLower === "active") {
          conditions.push("status != 'Completed' AND status != 'Cancelled'");
        } else if (filterLower === "archived") {
          conditions.push("(status = 'Completed' OR status = 'Cancelled')");
        } else if (filterLower !== "all") {
          conditions.push("status = ?");
          params.push(filter);
        }
      }

      // 2. Date Filter
      if (isCalendar) {
        const targetYear = calYear !== undefined ? calYear : new Date().getFullYear();
        const targetMonth = calMonth !== undefined ? calMonth : new Date().getMonth();
        const yearMonthPrefix = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
        conditions.push("COALESCE(NULLIF(deliveryDate, ''), eventDate) LIKE ?");
        params.push(`${yearMonthPrefix}%`);
      } else {
        if (dateFilter === "future") {
          conditions.push("COALESCE(NULLIF(deliveryDate, ''), eventDate) > ?");
          params.push(getLocalDateString(0));
        } else if (dateFilter === "today") {
          conditions.push("COALESCE(NULLIF(deliveryDate, ''), eventDate) = ?");
          params.push(getLocalDateString(0));
        } else if (dateFilter === "tomorrow") {
          conditions.push("COALESCE(NULLIF(deliveryDate, ''), eventDate) = ?");
          params.push(getLocalDateString(1));
        } else if (dateFilter === "custom") {
          if (customStartDate) {
            conditions.push("COALESCE(NULLIF(deliveryDate, ''), eventDate) >= ?");
            params.push(customStartDate);
          }
          if (customEndDate) {
            conditions.push("COALESCE(NULLIF(deliveryDate, ''), eventDate) <= ?");
            params.push(customEndDate);
          }
        }
      }

      // 3. Sorting Clause for SQLite
      let orderBy = "";
      if (sortBy === "created-newest") {
        orderBy = "ORDER BY COALESCE(createdAt, '') DESC";
      } else if (sortBy === "created-oldest") {
        orderBy = "ORDER BY COALESCE(createdAt, '') ASC";
      } else if (sortBy === "delivery-soonest") {
        orderBy = "ORDER BY COALESCE(NULLIF(deliveryDate, ''), eventDate, '') ASC, COALESCE(deliveryTime, '') ASC";
      } else if (sortBy === "delivery-latest") {
        orderBy = "ORDER BY COALESCE(NULLIF(deliveryDate, ''), eventDate, '') DESC, COALESCE(deliveryTime, '') DESC";
      } else if (sortBy === "amount-highest") {
        orderBy = "ORDER BY totalAmount DESC";
      } else { // "amount-lowest"
        orderBy = "ORDER BY totalAmount ASC";
      }

      const whereClause = conditions.join(" AND ");
      const hasEncryptedFilters = searchTerm || (paymentFilter && paymentFilter !== "all");

      let filteredCount = 0;
      let filteredOrders: Order[] = [];
      let paginatedOrders: Order[] = [];

      if (!hasEncryptedFilters) {
        if (isCalendar) {
          const matchedOrders = await localDb.orders.query(
            `SELECT * FROM orders WHERE ${whereClause} ${orderBy}`,
            params
          );
          filteredCount = matchedOrders.length;
          filteredOrders = matchedOrders;
          paginatedOrders = [];
        } else {
          const countResult = await localDb.orders.query(
            `SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`,
            params
          );
          filteredCount = countResult[0]?.count || 0;

          const pageOrders = await localDb.orders.query(
            `SELECT * FROM orders WHERE ${whereClause} ${orderBy} LIMIT ? OFFSET ?`,
            [...params, ordersItemsPerPage, startIndex]
          );

          filteredOrders = pageOrders;
          paginatedOrders = pageOrders;
        }
      } else {
        const baseOrders = await localDb.orders.query(
          `SELECT id, customerName, eventType, cakeFlavor, layers, paymentStatus, createdAt, eventDate, deliveryDate, deliveryTime, totalAmount, status FROM orders WHERE ${whereClause} ${orderBy}`,
          params
        );

        const matched = baseOrders.filter(o => {
          if (paymentFilter && paymentFilter !== "all" && (o.paymentStatus || "Unpaid") !== paymentFilter) return false;

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
          return true;
        });

        filteredCount = matched.length;

        if (isCalendar) {
          const pageIds = matched.map(o => o.id);
          if (pageIds.length > 0) {
            const placeholders = pageIds.map(() => "?").join(",");
            const fullOrders = await localDb.orders.query(
              `SELECT * FROM orders WHERE id IN (${placeholders})`,
              pageIds
            );
            const orderMap = new Map(fullOrders.map(o => [o.id, o]));
            const sortedFullOrders = pageIds
              .map(id => orderMap.get(id))
              .filter((o): o is Order => !!o);
            filteredOrders = sortedFullOrders;
          }
          paginatedOrders = [];
        } else {
          const pageIds = matched
            .slice(startIndex, startIndex + ordersItemsPerPage)
            .map(o => o.id);

          if (pageIds.length > 0) {
            const placeholders = pageIds.map(() => "?").join(",");
            const pageOrders = await localDb.orders.query(
              `SELECT * FROM orders WHERE id IN (${placeholders})`,
              pageIds
            );
            const orderMap = new Map(pageOrders.map(o => [o.id, o]));
            const sortedPageOrders = pageIds
              .map(id => orderMap.get(id))
              .filter((o): o is Order => !!o);
            filteredOrders = sortedPageOrders;
            paginatedOrders = sortedPageOrders;
          }
        }
      }

      return { filteredCount, filteredOrders, paginatedOrders };
    }
  });

  const filteredCount = queryResult.filteredCount;
  const filteredOrders = queryResult.filteredOrders;
  const paginatedOrders = queryResult.paginatedOrders;

  const ordersTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / ordersItemsPerPage);
  }, [filteredCount, ordersItemsPerPage]);

  // Selected order details query using useQuery
  const { data: selectedOrder = null } = useQuery<Order | null>({
    queryKey: ["orders", "detail", selectedOrderId],
    enabled: !!selectedOrderId,
    queryFn: async () => {
      return (await localDb.orders.get(selectedOrderId!)) || null;
    }
  });

  // Handle setting view mode
  const handleSetViewMode = (mode: "list" | "form" | "detail") => {
    setViewMode(mode);
    if (onViewModeChange && (mode === "list" || mode === "form")) {
      onViewModeChange(mode);
    }
  };

  // Prepopulate form on routing state change
  useEffect(() => {
    async function handleRoutingState() {
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
          cakeFlavor: o.cakeFlavor || "",
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

        // Update refs to prevent initial sync override
        lastBasePrice.current = String(o.basePrice);
        lastDecorationCharge.current = String(o.decorationCharge);
        lastDeliveryFee.current = String(o.deliveryFee);
        prevCakeAttrs.current = {
          cakeWeight: o.cakeWeight || "2.0 kg",
          cakeShape: o.cakeShape || "Round",
          layers: o.layers || "Double Tier",
          preference: o.preference || "Egg",
        };

        // Pre-select customer in AsyncSelect
        if (o.customerId && o.customerId !== "guest" && o.customerId !== "") {
          setSelectedCustomerOption({ value: o.customerId, label: `${o.customerName} (${o.customerMobile || ""})` });
        }

        setViewMode("form");
      } else if (location.state && (location.state as any).selectedOrderId) {
        const targetId = (location.state as any).selectedOrderId;
        const targetOrder = await localDb.orders.get(targetId);
        if (targetOrder) {
          setSelectedOrderId(targetId);
          setViewMode("detail");
        }
      } else if (location.state && (location.state as any).highlightOrderId) {
        const targetId = (location.state as any).highlightOrderId;
        const targetOrder = await localDb.orders.get(targetId);
        if (targetOrder) {
          setSearchTerm(targetOrder.customerName || "");
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
    }
    handleRoutingState();
  }, [location.state]);

  // (Bakery profile useEffect removed, managed by useQuery instead)

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
    const recipeNames = recipes.map((r) => r.name).filter(Boolean);
    const combined = [...recipeNames];
    if (formData.cakeFlavor && !combined.includes(formData.cakeFlavor)) {
      combined.push(formData.cakeFlavor);
    }
    return combined.map((f) => ({ value: f, label: f }));
  }, [recipes, formData.cakeFlavor]);


  // Reset fields to empty when starting wizard
  useEffect(() => {
    setProfitAmount("");
    setCostGoingText("");
    setDifficultiesText("");
  }, [completingOrder]);

  // AsyncSelect loadOptions — queries DB only when user types, returns matching customers
  const loadCustomerOptions = async (inputValue: string): Promise<{ value: string; label: string }[]> => {
    try {
      const allCust = await localDb.customers.filter((c: any) => c.isDeleted !== 1).toArray();
      const lower = inputValue.toLowerCase();
      const matched = allCust.filter((c: any) => {
        if (!inputValue) return true;
        return (
          (c.name || "").toLowerCase().includes(lower) ||
          (c.mobile || "").includes(lower) ||
          (c.id || "").toLowerCase().includes(lower)
        );
      });
      return matched.slice(0, 50).map((c: any) => ({ value: c.id, label: `${c.name} (${c.mobile})` }));
    } catch (err) {
      console.error("Failed to load customer options:", err);
      return [];
    }
  };

  // Reset pagination on search, filter, dateFilter, sort, viewTab, calMonth, calYear, paymentFilter
  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [searchTerm, filter, sortBy, dateFilter, customStartDate, customEndDate, viewTab, calMonth, calYear, paymentFilter]);

  // Paginated and sorted orders
  // (loadDbOrders and loadSelectedOrder useEffect blocks removed, managed by useQuery instead)

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

  // Refs to track previous values of component overrides to detect changes from user inputs
  const lastBasePrice = useRef("");
  const lastDecorationCharge = useRef("");
  const lastDeliveryFee = useRef("");

  // Ref to track cake attributes in order to clear price overrides when they change
  const prevCakeAttrs = useRef({
    cakeWeight: formData.cakeWeight || "2.0 kg",
    cakeShape: formData.cakeShape || "Round",
    layers: formData.layers || "Double Tier",
    preference: formData.preference || "Egg",
  });

  // Automatically recalculate overrideTotalAmount when the component overrides change
  useEffect(() => {
    const hasBaseChanged = overrideBasePrice !== lastBasePrice.current;
    const hasDecorationChanged = overrideDecorationCharge !== lastDecorationCharge.current;
    const hasDeliveryChanged = overrideDeliveryFee !== lastDeliveryFee.current;

    if (hasBaseChanged || hasDecorationChanged || hasDeliveryChanged) {
      const base = overrideBasePrice ? parseFloat(overrideBasePrice) || 0 : priceCalculation.basePrice;
      const dec = overrideDecorationCharge ? parseFloat(overrideDecorationCharge) || 0 : priceCalculation.decorationCharge;
      const del = overrideDeliveryFee ? parseFloat(overrideDeliveryFee) || 0 : priceCalculation.deliveryFee;

      if (overrideBasePrice === "" && overrideDecorationCharge === "" && overrideDeliveryFee === "") {
        setOverrideTotalAmount("");
      } else {
        const newTotal = (base + dec + del).toFixed(2);
        setOverrideTotalAmount(newTotal);
      }

      // Update refs to current values
      lastBasePrice.current = overrideBasePrice;
      lastDecorationCharge.current = overrideDecorationCharge;
      lastDeliveryFee.current = overrideDeliveryFee;
    }
  }, [overrideBasePrice, overrideDecorationCharge, overrideDeliveryFee, priceCalculation]);

  // Clear component price overrides and total override when cake composition attributes change
  useEffect(() => {
    const hasWeightChanged = formData.cakeWeight !== prevCakeAttrs.current.cakeWeight;
    const hasShapeChanged = formData.cakeShape !== prevCakeAttrs.current.cakeShape;
    const hasLayersChanged = formData.layers !== prevCakeAttrs.current.layers;
    const hasPrefChanged = formData.preference !== prevCakeAttrs.current.preference;

    if (hasWeightChanged || hasShapeChanged || hasLayersChanged || hasPrefChanged) {
      setOverrideBasePrice("");
      setOverrideTotalAmount("");

      prevCakeAttrs.current = {
        cakeWeight: formData.cakeWeight,
        cakeShape: formData.cakeShape,
        layers: formData.layers,
        preference: formData.preference,
      };
    }
  }, [formData.cakeWeight, formData.cakeShape, formData.layers, formData.preference]);

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
      
      // Update refs to prevent initial sync override
      lastBasePrice.current = String(o.basePrice);
      lastDecorationCharge.current = String(o.decorationCharge);
      lastDeliveryFee.current = String(o.deliveryFee);
      prevCakeAttrs.current = {
        cakeWeight: o.cakeWeight || "2.0 kg",
        cakeShape: o.cakeShape || "Round",
        layers: o.layers || "Double Tier",
        preference: o.preference || "Egg",
      };

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

  const handleCustomerChange = async (option: { value: string; label: string } | null) => {
    const customerId = option?.value || "";
    setSelectedCustomerOption(option);
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
        const original = await localDb.orders.get(editingOrderId);
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
          cakeWeight: "1.0 kg",
          cakeFlavor: "",
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
        
        // Reset refs
        lastBasePrice.current = "";
        lastDecorationCharge.current = "";
        lastDeliveryFee.current = "";
        prevCakeAttrs.current = {
          cakeWeight: "1.0 kg",
          cakeShape: "Round",
          layers: "Double Tier",
          preference: "Egg",
        };

        setEditingOrderId(null);
        setSelectedCustomerOption(null);
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
    loading,
    orders,
    recipes,
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
    selectedCustomerOption,
    setSelectedCustomerOption,
    loadCustomerOptions,
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
