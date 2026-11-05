// File Path: /src/hooks/useLeads.ts
import { useState, useMemo, useEffect, useCallback } from "react";
import { type Lead, type LeadChannel, type LeadStatus, type Customer } from "../types";
import { localDb } from "../db";

export interface UseLeadsProps {
  onSyncNeeded?: () => void;
}

export function useLeads({ onSyncNeeded }: UseLeadsProps = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeadStatus>("All");
  const [channelFilter, setChannelFilter] = useState<"All" | LeadChannel>("All");
  const [sortBy, setSortBy] = useState<"lastSpoke-newest" | "nextContact-soonest" | "updated-newest" | "created-newest" | "budget-highest" | "name-az">("lastSpoke-newest");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Load leads from SQLite
  const loadLeads = useCallback(async () => {
    try {
      const allRows = await localDb.leads.query("SELECT * FROM leads WHERE isDeleted = 0 ORDER BY updatedAt DESC");
      setLeads(allRows || []);
    } catch (err) {
      console.error("Failed to load leads from database:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();

    const handleDbUpdate = (e: any) => {
      const table = e.detail?.table;
      if (!table || table === "leads" || (Array.isArray(table) && table.includes("leads"))) {
        loadLeads();
      }
    };

    window.addEventListener("db-update", handleDbUpdate);
    return () => {
      window.removeEventListener("db-update", handleDbUpdate);
    };
  }, [loadLeads]);

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Channel filter
    if (channelFilter !== "All") {
      result = result.filter((l) => l.channel === channelFilter);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((l) => {
        const nameMatch = l.name?.toLowerCase().includes(q);
        const handleMatch = l.instagramHandle?.toLowerCase().includes(q);
        const whatsappMatch = l.whatsappNumber?.toLowerCase().includes(q);
        const phoneMatch = l.phone?.toLowerCase().includes(q);
        const notesMatch = l.notes?.toLowerCase().includes(q);
        return nameMatch || handleMatch || whatsappMatch || phoneMatch || notesMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "lastSpoke-newest") {
        const aDate = a.lastSpokeDate ? new Date(a.lastSpokeDate).getTime() : 0;
        const bDate = b.lastSpokeDate ? new Date(b.lastSpokeDate).getTime() : 0;
        if (bDate !== aDate) return bDate - aDate;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (sortBy === "nextContact-soonest") {
        if (!a.nextContactDate && !b.nextContactDate) return 0;
        if (!a.nextContactDate) return 1;
        if (!b.nextContactDate) return -1;
        const aTime = new Date(a.nextContactDate).getTime();
        const bTime = new Date(b.nextContactDate).getTime();
        if (aTime !== bTime) return aTime - bTime;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (sortBy === "updated-newest") {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (sortBy === "created-newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "budget-highest") {
        return (b.estimatedBudget || 0) - (a.estimatedBudget || 0);
      }
      if (sortBy === "name-az") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });

    return result;
  }, [leads, statusFilter, channelFilter, searchTerm, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const total = leads.length;
    const newInquiries = leads.filter((l) => l.status === "New Inquiry").length;
    const inDiscussion = leads.filter((l) => l.status === "In Discussion").length;
    const quotationSent = leads.filter((l) => l.status === "Quotation Sent").length;
    const converted = leads.filter((l) => l.status === "Converted").length;
    const lost = leads.filter((l) => l.status === "Lost").length;
    const followUpsDueToday = leads.filter((l) => l.nextContactDate === todayStr && l.status !== "Converted" && l.status !== "Lost").length;
    const overdueFollowUps = leads.filter((l) => l.nextContactDate && l.nextContactDate < todayStr && l.status !== "Converted" && l.status !== "Lost").length;
    return { total, newInquiries, inDiscussion, quotationSent, converted, lost, followUpsDueToday, overdueFollowUps };
  }, [leads]);

  // Actions
  const handleAddLead = async (leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "localChange" | "isDeleted">) => {
    try {
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...leadData,
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: now,
        updatedAt: now,
        localChange: 1,
        isDeleted: 0,
      };

      await localDb.leads.put(newLead);
      window.dispatchEvent(new CustomEvent("db-update", { detail: { table: "leads" } }));
      if (onSyncNeeded) onSyncNeeded();
      window.showToast?.("Lead inquiry saved successfully!", "success");
      loadLeads();
      return newLead;
    } catch (err) {
      console.error("Failed to add lead:", err);
      window.showToast?.("Failed to add lead inquiry.", "error");
      throw err;
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const existing = await localDb.leads.get(id);
      if (!existing) throw new Error("Lead not found");

      const updatedLead: Lead = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        localChange: 1,
      };

      await localDb.leads.put(updatedLead);
      window.dispatchEvent(new CustomEvent("db-update", { detail: { table: "leads" } }));
      if (onSyncNeeded) onSyncNeeded();
      window.showToast?.("Lead details updated!", "success");
      loadLeads();
      return updatedLead;
    } catch (err) {
      console.error("Failed to update lead:", err);
      window.showToast?.("Failed to update lead.", "error");
      throw err;
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const existing = await localDb.leads.get(id);
      if (existing) {
        await localDb.leads.put({
          ...existing,
          isDeleted: 1,
          localChange: 1,
          updatedAt: new Date().toISOString(),
        });
      }
      window.dispatchEvent(new CustomEvent("db-update", { detail: { table: "leads" } }));
      if (onSyncNeeded) onSyncNeeded();
      window.showToast?.("Lead inquiry removed.", "info");
      loadLeads();
    } catch (err) {
      console.error("Failed to delete lead:", err);
      window.showToast?.("Failed to delete lead.", "error");
      throw err;
    }
  };

  const handleConvertToCustomer = async (lead: Lead, customMobile?: string) => {
    try {
      const now = new Date().toISOString();
      const phoneToUse = (customMobile !== undefined ? customMobile : (lead.whatsappNumber || lead.phone || "")).trim().replace(/[^0-9+]/g, "");

      if (!phoneToUse) {
        window.showToast?.("Mobile number is required to convert to a customer.", "error");
        return false;
      }

      // Check if customer with same phone already exists
      let existingCustomer: Customer | undefined;
      const found = await localDb.customers.query(
        "SELECT * FROM customers WHERE mobile = ? AND isDeleted = 0 LIMIT 1",
        [phoneToUse]
      );
      existingCustomer = found && found[0];

      if (!existingCustomer) {
        const newCustomer: Customer = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: lead.name,
          mobile: phoneToUse,
          type: "New",
          totalOrders: 0,
          memberSince: now.split("T")[0],
          updatedAt: now,
          localChange: 1,
          isDeleted: 0,
        };
        await localDb.customers.put(newCustomer);
        window.dispatchEvent(new CustomEvent("db-update", { detail: { table: "customers" } }));
      }

      // Mark lead as Converted, and preserve the confirmed phone number
      const leadUpdates: Partial<Lead> = { status: "Converted" };
      if (!lead.whatsappNumber && !lead.phone) {
        leadUpdates.whatsappNumber = phoneToUse;
      }
      await handleUpdateLead(lead.id, leadUpdates);
      window.showToast?.(`Moved "${lead.name}" to Customer directory!`, "success");
      return true;
    } catch (err) {
      console.error("Failed to convert lead to customer:", err);
      window.showToast?.("Failed to convert lead to customer.", "error");
      return false;
    }
  };

  return {
    leads,
    filteredLeads,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    sortBy,
    setSortBy,
    isModalOpen,
    setIsModalOpen,
    editingLead,
    setEditingLead,
    stats,
    handleAddLead,
    handleUpdateLead,
    handleDeleteLead,
    handleConvertToCustomer,
    refreshLeads: loadLeads,
  };
}
