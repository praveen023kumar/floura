import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { type Customer, type Order } from "../types";
import { localDb } from "../db";
import { useQuery } from "@tanstack/react-query";

export interface UseCustomersProps {
  onAddCustomer?: (customer: Omit<Customer, "id" | "updatedAt">) => Promise<any>;
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
}: UseCustomersProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();


  const [viewMode, setViewMode] = useState<"list" | "form" | "detail">(initialViewMode);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [expandedOrdersCustomer, setExpandedOrdersCustomer] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Frequent" | "New" | "Corporate">("All");
  const [sortBy, setSortBy] = useState<"updated-newest" | "member-newest" | "member-oldest" | "orders-highest" | "orders-lowest" | "name-az">("updated-newest");

  const [customersCurrentPage, setCustomersCurrentPage] = useState<number>(1);
  const [customersItemsPerPage, setCustomersItemsPerPage] = useState<number>(10);

  // Auto-select or search based on router state
  useEffect(() => {
    const state = location.state as { searchCustomerName?: string; fromOrderId?: string } | null;
    if (state?.searchCustomerName) {
      async function findAndSelect() {
        try {
          const allCust = await localDb.customers.toArray();
          const match = allCust.find(c => c.name.toLowerCase() === state!.searchCustomerName!.toLowerCase() && c.isDeleted !== 1);
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

  // Load customers paginated list using useQuery
  const listQuery = useQuery({
    queryKey: [
      "customers",
      "list",
      searchTerm,
      filterType,
      sortBy,
      customersCurrentPage,
      customersItemsPerPage
    ],
    queryFn: async () => {
      const startIndex = (customersCurrentPage - 1) * customersItemsPerPage;
      const hasEncryptedFilters = searchTerm.trim() !== "" || sortBy === "name-az";

      let filteredCount = 0;
      let paginatedCustomers: Customer[] = [];

      if (!hasEncryptedFilters) {
        // No encrypted filters: Paginate directly in SQLite using index queries
        const conditions = ["isDeleted = 0"];
        const params: any[] = [];

        if (filterType !== "All") {
          conditions.push("type = ?");
          params.push(filterType);
        }

        const whereClause = conditions.join(" AND ");

        // Count query
        const countResult = await localDb.customers.query(
          `SELECT COUNT(*) as count FROM customers WHERE ${whereClause}`,
          params
        );
        filteredCount = countResult[0]?.count || 0;

        // Build sorting clause for SQLite
        let orderByClause = "";
        if (sortBy === "member-newest") {
          orderByClause = "ORDER BY COALESCE(memberSince, '') DESC";
        } else if (sortBy === "member-oldest") {
          orderByClause = "ORDER BY COALESCE(memberSince, '') ASC";
        } else if (sortBy === "orders-highest") {
          orderByClause = "ORDER BY COALESCE(totalOrders, 0) DESC";
        } else if (sortBy === "orders-lowest") {
          orderByClause = "ORDER BY COALESCE(totalOrders, 0) ASC";
        } else { // "updated-newest" (default)
          orderByClause = "ORDER BY COALESCE(updatedAt, '') DESC";
        }

        const pageCustomers = await localDb.customers.query(
          `SELECT * FROM customers WHERE ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`,
          [...params, customersItemsPerPage, startIndex]
        );

        paginatedCustomers = pageCustomers;
      } else {
        // Has encrypted filters: Retrieve lightweight columns to filter/sort in memory
        const allCustLight = await localDb.customers.query(
          "SELECT id, name, mobile, type, totalOrders, memberSince, updatedAt FROM customers WHERE isDeleted = 0"
        );

        // Filter customer records in memory
        const matched = allCustLight.filter(c => {
          if (filterType !== "All" && c.type !== filterType) return false;
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
              c.name.toLowerCase().includes(term) ||
              c.id.toLowerCase().includes(term) ||
              c.mobile.includes(term)
            );
          }
          return true;
        });

        // Sort in memory
        matched.sort((a, b) => {
          if (sortBy === "member-newest") {
            return new Date(b.memberSince || 0).getTime() - new Date(a.memberSince || 0).getTime();
          } else if (sortBy === "member-oldest") {
            return new Date(a.memberSince || 0).getTime() - new Date(b.memberSince || 0).getTime();
          } else if (sortBy === "orders-highest") {
            return (b.totalOrders || 0) - (a.totalOrders || 0);
          } else if (sortBy === "orders-lowest") {
            return (a.totalOrders || 0) - (b.totalOrders || 0);
          } else if (sortBy === "name-az") {
            return a.name.localeCompare(b.name);
          } else { // "updated-newest" (default)
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
          }
        });

        filteredCount = matched.length;

        const pageIds = matched
          .slice(startIndex, startIndex + customersItemsPerPage)
          .map(c => c.id);

        if (pageIds.length > 0) {
          const placeholders = pageIds.map(() => "?").join(",");
          const pageCustomers = await localDb.customers.query(
            `SELECT * FROM customers WHERE id IN (${placeholders})`,
            pageIds
          );

          // Re-sort to match the in-memory filtered & sorted pageIds order
          const customerMap = new Map(pageCustomers.map(c => [c.id, c]));
          paginatedCustomers = pageIds
            .map(id => customerMap.get(id))
            .filter((c): c is Customer => !!c);
        }
      }

      return { filteredCount, paginatedCustomers };
    }
  });

  const queryResult = listQuery.data || { filteredCount: 0, paginatedCustomers: [] };
  const filteredCount = queryResult.filteredCount;
  const paginatedCustomers = queryResult.paginatedCustomers;

  // Load customer order counts using useQuery
  const paginatedIdsStr = paginatedCustomers.map(c => c.id).join(",");
  const orderCountsQuery = useQuery<{ [id: string]: number }>({
    queryKey: ["customers", "orderCounts", paginatedIdsStr],
    enabled: paginatedCustomers.length > 0,
    queryFn: async () => {
      const customerIds = paginatedCustomers.map(c => c.id);
      const placeholders = customerIds.map(() => "?").join(",");
      const queryResult = await localDb.orders.query(
        `SELECT customerId, COUNT(*) as count FROM orders WHERE isDeleted = 0 AND customerId IN (${placeholders}) GROUP BY customerId`,
        customerIds
      );

      const counts: { [id: string]: number } = {};
      for (const c of paginatedCustomers) {
        const matchedRow = queryResult.find((row: any) => row.customerId === c.id);
        counts[c.id] = matchedRow ? matchedRow.count : 0;
      }
      return counts;
    }
  });

  const customerOrderCounts = orderCountsQuery.data || {};

  // Load selected customer details and orders using useQuery
  const detailsQuery = useQuery({
    queryKey: ["customers", "detail", selectedCustomerId],
    enabled: !!selectedCustomerId,
    queryFn: async () => {
      const [customer, custOrders] = await Promise.all([
        localDb.customers.get(selectedCustomerId!),
        localDb.orders.query(
          "SELECT * FROM orders WHERE customerId = ? AND isDeleted = 0",
          [selectedCustomerId!]
        )
      ]);
      custOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return { selectedCustomer: customer || null, selectedCustomerOrders: custOrders };
    }
  });

  const detailsResult = detailsQuery.data || { selectedCustomer: null, selectedCustomerOrders: [] };
  const selectedCustomer = detailsResult.selectedCustomer;
  const selectedCustomerOrders = detailsResult.selectedCustomerOrders;

  const isLoading = listQuery.isLoading || (!!selectedCustomerId && detailsQuery.isLoading);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCustomersCurrentPage(1);
  }, [searchTerm, filterType, sortBy]);

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
    sortBy,
    setSortBy,
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
    isLoading,
  };
}
