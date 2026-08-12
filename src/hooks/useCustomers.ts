import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { type Customer, type Order } from "../types";
import { localDb } from "../db";

export interface UseCustomersProps {
  onAddCustomer: (customer: Omit<Customer, "id" | "updatedAt">) => Promise<any>;
  onUpdateCustomer?: (customer: Customer) => Promise<any>;
  onDeleteCustomer?: (id: string) => Promise<any>;
  initialViewMode?: "list" | "form" | "detail";
  onViewModeChange?: (mode: "list" | "form" | "detail") => void;
}

export function useCustomers({
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  initialViewMode = "list",
  onViewModeChange,
}: UseCustomersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("db-update", handler);
    return () => window.removeEventListener("db-update", handler);
  }, []);

  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">(initialViewMode);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [expandedOrdersCustomer, setExpandedOrdersCustomer] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Frequent" | "New" | "Corporate">("All");

  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [customerOrderCounts, setCustomerOrderCounts] = useState<{ [id: string]: number }>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[]>([]);

  const [customersCurrentPage, setCustomersCurrentPage] = useState<number>(1);
  const [customersItemsPerPage, setCustomersItemsPerPage] = useState<number>(10);

  // Auto-select or search based on router state
  useEffect(() => {
    const state = location.state as { searchCustomerName?: string; fromOrderId?: string } | null;
    if (state?.searchCustomerName) {
      async function findAndSelect() {
        try {
          const match = await localDb.customers
            .filter(c => c.name.toLowerCase() === state!.searchCustomerName!.toLowerCase() && c.isDeleted !== 1)
            .first();
          if (match) {
            navigate(`/customers/${match.id}${state!.fromOrderId ? `?fromOrderId=${state!.fromOrderId}` : ""}`, { replace: true });
          } else {
            setSearchTerm(state!.searchCustomerName!);
          }
        } catch (err) {
          console.error("Failed to auto-select customer in CustomersView:", err);
        }
      }
      findAndSelect();
    }
  }, [location.state, navigate]);

  // Sync selectedCustomerId and viewMode with URL params
  useEffect(() => {
    if (id && id !== "new") {
      setSelectedCustomerId(id);
      setViewMode("detail");
    } else {
      setSelectedCustomerId(null);
      if (initialViewMode === "form") {
        setEditingCustomer(null);
        setIsCreateModalOpen(true);
        setViewMode("list");
      } else {
        setViewMode(initialViewMode);
      }
    }
  }, [id, initialViewMode]);

  // Fetch counts of orders for paginated list customers
  useEffect(() => {
    async function fetchCounts() {
      if (paginatedCustomers.length === 0) return;
      try {
        const counts: { [id: string]: number } = {};
        const allOrders = await localDb.orders.toArray();
        paginatedCustomers.forEach((c) => {
          const count = allOrders.filter(o => o.customerId === c.id && o.isDeleted !== 1).length;
          counts[c.id] = count;
        });
        setCustomerOrderCounts(counts);
      } catch (err) {
        console.error("Failed to fetch customer order counts:", err);
      }
    }
    fetchCounts();
  }, [paginatedCustomers, refreshTrigger]);

  // Fetch selected customer and orders dynamically
  useEffect(() => {
    async function fetchSelectedDetails() {
      if (!selectedCustomerId) {
        setSelectedCustomer(null);
        setSelectedCustomerOrders([]);
        return;
      }
      try {
        const [customer, allOrders] = await Promise.all([
          localDb.customers.get(selectedCustomerId),
          localDb.orders.toArray()
        ]);
        const custOrders = allOrders.filter(o => o.customerId === selectedCustomerId && o.isDeleted !== 1);
        setSelectedCustomer(customer || null);
        custOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSelectedCustomerOrders(custOrders);
      } catch (err) {
        console.error("Failed to fetch selected customer details:", err);
      }
    }
    fetchSelectedDetails();
  }, [selectedCustomerId, refreshTrigger]);

  // Reset pagination on filter change
  useEffect(() => {
    setCustomersCurrentPage(1);
  }, [searchTerm, filterType]);

  // Load customers
  useEffect(() => {
    async function loadDbCustomers() {
      try {
        const allCustomers = await localDb.customers.filter(c => c.isDeleted !== 1).toArray();

        let matched = allCustomers;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          matched = matched.filter(c => 
            c.name.toLowerCase().includes(term) ||
            c.id.toLowerCase().includes(term) ||
            c.mobile.includes(term)
          );
        }

        if (filterType !== "All") {
          matched = matched.filter(c => c.type === filterType);
        }

        matched.sort((a, b) => new Date(b.updatedAt || b.memberSince || 0).getTime() - new Date(a.updatedAt || a.memberSince || 0).getTime());

        setFilteredCount(matched.length);

        const startIndex = (customersCurrentPage - 1) * customersItemsPerPage;
        const pageSlice = matched.slice(startIndex, startIndex + customersItemsPerPage);
        setPaginatedCustomers(pageSlice);
      } catch (err) {
        console.error("Failed to query customers from localDb:", err);
      }
    }
    loadDbCustomers();
  }, [refreshTrigger, searchTerm, filterType, customersCurrentPage, customersItemsPerPage]);

  const customersTotalPages = useMemo(() => {
    return Math.ceil(filteredCount / customersItemsPerPage);
  }, [filteredCount, customersItemsPerPage]);

  const filteredCustomers = useMemo(() => {
    return { length: filteredCount };
  }, [filteredCount]);

  const handleSetViewMode = (mode: "list" | "form" | "detail") => {
    if (mode === "form") {
      setEditingCustomer(null);
      setIsCreateModalOpen(true);
    } else {
      setViewMode(mode);
    }
    if (onViewModeChange && mode !== "detail") {
      onViewModeChange(mode === "form" ? "form" : "list");
    }
  };

  const handleStartEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setIsCreateModalOpen(true);
  };

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

  return {
    refreshTrigger,
    viewMode,
    setViewMode,
    selectedCustomerId,
    setSelectedCustomerId,
    expandedOrdersCustomer,
    setExpandedOrdersCustomer,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingCustomer,
    setEditingCustomer,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    paginatedCustomers,
    filteredCount,
    customerOrderCounts,
    selectedCustomer,
    selectedCustomerOrders,
    customersCurrentPage,
    setCustomersCurrentPage,
    customersItemsPerPage,
    setCustomersItemsPerPage,
    customersTotalPages,
    filteredCustomers,
    handleSetViewMode,
    handleStartEditCustomer,
    handleCall,
    handleSMS,
    handleWhatsApp,
  };
}
