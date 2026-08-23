import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { localDb, seedLocalDbFromPayload, getPreference, setPreference, removePreference } from "../db";
import { getApiUrl } from "../utils/api";
import { setFormatConfig } from "../utils/format";
import {
  Customer,
  Order,
  InventoryItem,
  Recipe,
  ChecklistItem,
  CustomEvent,
  DispatchedNotification,
  CustomScheduledAlert,
  BakeryProfile,
} from "../types";

export function useAppEngine() {
  const navigate = useNavigate();
  const location = useLocation();

  // User Authenticated State
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; token?: string } | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState<boolean>(true);
  const [profileChecked, setProfileChecked] = useState<boolean>(false);

  // accessibility Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("patisserie_dark_mode") === "true";
  });

  // Initial Sync / Data Pulling States
  const [isSyncingInitialData, setIsSyncingInitialData] = useState<boolean>(false);
  const [pullingStep, setPullingStep] = useState<string>("");
  const [pullingProgress, setPullingProgress] = useState<number>(0);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<"synced" | "offline" | "syncing" | "error">("synced");
  const isSyncingRef = useRef(false);
  const syncQueueRef = useRef(false);

  // Local state replicas of IndexedDB tables (Empty references used purely as lightweight reactive triggers)
  const [checkerList, setCheckerList] = useState<ChecklistItem[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [dispatchedNotifications, setDispatchedNotifications] = useState<DispatchedNotification[]>([]);
  const [scheduledAlerts, setScheduledAlerts] = useState<CustomScheduledAlert[]>([]);
  const [bakeryProfile, setBakeryProfile] = useState<BakeryProfile | null>(null);

  // High-performance dashboard statistics states (replaces in-memory computations)
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // App preferences startup loading
  useEffect(() => {
    async function initPreferences() {
      try {
        const savedUser = await getPreference("patisserie_user");
        const savedDarkMode = localStorage.getItem("patisserie_dark_mode") === "true";
        const currency = await getPreference("floura_currency") || "$";
        const dateFormat = await getPreference("floura_date_format") || "YYYY-MM-DD";
        
        setFormatConfig(currency, dateFormat);
        
        if (savedUser) {
          setUser(savedUser);
        }
        setDarkMode(savedDarkMode);
      } catch (err) {
        console.error("Failed to load user preferences from IndexedDB:", err);
      } finally {
        setInitializing(false);
      }
    }
    initPreferences();
  }, []);

  // Keep formatting utilities updated with user's bakery profile configuration
  useEffect(() => {
    if (bakeryProfile) {
      setFormatConfig(bakeryProfile.currency || "$", bakeryProfile.dateFormat || "YYYY-MM-DD");
      window.dispatchEvent(new Event("floura_settings_changed"));
    }
  }, [bakeryProfile]);

  // Toggle dark mode classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("patisserie_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("patisserie_dark_mode", "false");
    }
  }, [darkMode]);

  // Load data slice for react states (counts and active small tables) to prevent memory leak
  async function refreshReactStates() {
    try {
      const [
        localChecklist,
        localCustomEvents,
        localDispatchedNotifications,
        localScheduledAlerts,
        localBakeryProfile,
        allOrders,
        allInventory
      ] = await Promise.all([
        localDb.checklist.toArray(),
        localDb.customEvents.toArray(),
        localDb.dispatchedNotifications.toArray(),
        localDb.scheduledAlerts.toArray(),
        localDb.bakeryProfile.toArray(),
        localDb.orders.filter((o: any) => o.isDeleted !== 1).toArray(),
        localDb.inventory.filter((i: any) => i.isDeleted !== 1).toArray()
      ]);

      const completedCount = allOrders.filter((o: any) => o.status === "Completed").length;
      const pendingCount = allOrders.filter((o: any) => o.status === "Pending").length;
      const lowCount = allInventory.filter((i: any) => i.quantity < i.minStockLevel).length;

      setCompletedOrdersCount(completedCount);
      setActiveOrdersCount(pendingCount);
      setLowStockCount(lowCount);

      setCheckerList(localChecklist.filter((chk: any) => chk.isDeleted !== 1));
      setCustomEvents(localCustomEvents.filter((ev: any) => ev.isDeleted !== 1));
      setDispatchedNotifications(localDispatchedNotifications.filter((dn: any) => dn.isDeleted !== 1));
      setScheduledAlerts(localScheduledAlerts.filter((sa: any) => sa.isDeleted !== 1));
      setBakeryProfile(localBakeryProfile.filter((bp: any) => bp.isDeleted !== 1)[0] || null);

      // Dispatch event to notify child views (such as OrdersView, DashboardView, etc.) to reload their IndexedDB queries
      window.dispatchEvent(new Event("db-update"));
    } catch (err) {
      console.error("Failed to load IndexedDB data slice:", err);
    }
  }

  // Automatically refresh IndexedDB states when the window is focused or document visibility changes
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        refreshReactStates();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, []);

  // When user logging in or changing accounts, handle partition switching
  useEffect(() => {
    async function handleUserSwitch() {
      if (!user) {
        setIsLoadingFromDb(false);
        return;
      }
      if ((user as any).role === "admin" || (user as any).role === "superadmin") {
        setSyncStatus("synced");
        setIsLoadingFromDb(false);
        return;
      }
      
      setIsLoadingFromDb(true);
      const lastSyncedEmail = await getPreference("patisserie_last_synced_email");
      if (lastSyncedEmail && lastSyncedEmail !== user.email) {
        // Switch user: reset local database cache to prevent leaks, then sync
        try {
          await localDb.customers.clear();
          await localDb.orders.clear();
          await localDb.inventory.clear();
          await localDb.recipes.clear();
          await localDb.checklist.clear();
          await localDb.customEvents.clear();
          await localDb.dispatchedNotifications.clear();
          await localDb.scheduledAlerts.clear();
          await localDb.bakeryProfile.clear();
          await localDb.categories.clear();
        } catch (e) {
          console.error("Failed to clear local db on user change:", e);
        }
      }
      await setPreference("patisserie_last_synced_email", user.email);

      // Load data in parallel for optimal startup performance
      try {
        await refreshReactStates();
        setProfileChecked(true);

        const [custCount, ordCount] = await Promise.all([
          localDb.customers.count(),
          localDb.orders.count()
        ]);

        if (typeof navigator !== "undefined" && navigator.onLine) {
          if (custCount === 0 && ordCount === 0) {
            setIsSyncingInitialData(true);
            try {
              await fetchMasterData(user, (step, percent) => {
                setPullingStep(step);
                setPullingProgress(percent);
              });
              await new Promise((resolve) => setTimeout(resolve, 800));
            } catch (err) {
              console.error("Auto-sync fetchMasterData failed:", err);
            } finally {
              setIsSyncingInitialData(false);
            }
          } else {
            await triggerSync();
          }
        } else {
          setSyncStatus("offline");
        }
      } catch (err) {
        console.error("Failed to load IndexedDB data in parallel:", err);
      } finally {
        setIsLoadingFromDb(false);
      }
    }

    handleUserSwitch();
  }, [user?.email]);

  // Listen to network status alerts and trigger periodic auto-sync
  useEffect(() => {
    const handleOnline = () => triggerSync();
    const handleOffline = () => setSyncStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic auto-sync background check every 30 seconds if online and user exists
    const intervalId = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine && user) {
        triggerSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [user]);

  // Pull Master Data from Backend (runs once upon login/first initialization)
  async function fetchMasterData(
    targetUser?: { name: string; email: string; avatar: string; token?: string },
    onProgress?: (step: string, percent: number) => void
  ) {
    const activeUser = targetUser || user;
    if (!activeUser) return;
    setSyncStatus("syncing");
    
    if (onProgress) onProgress("Connecting to Floura cloud backup...", 10);
    
    try {
      let page = 1;
      const limit = 500;
      let hasMore = true;
      let isFirstPage = true;

      if (onProgress) onProgress("Wiping local table partitions...", 20);
      // Clear local DB tables completely to prevent old device leakage/stale states
      await Promise.all([
        localDb.customers.clear(),
        localDb.orders.clear(),
        localDb.inventory.clear(),
        localDb.recipes.clear(),
        localDb.checklist.clear(),
        localDb.customEvents.clear(),
        localDb.dispatchedNotifications.clear(),
        localDb.scheduledAlerts.clear(),
        localDb.bakeryProfile.clear(),
        localDb.categories.clear()
      ]);

      while (hasMore) {
        if (onProgress) onProgress(`Retrieving baking records page ${page}...`, Math.min(25 + page * 10, 85));
        
        const response = await fetch(getApiUrl(`/api/fetch?page=${page}&limit=${limit}`), {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + (activeUser?.token || ""),
            "x-user-email": activeUser?.email || "praveen023kumar@gmail.com"
          }
        });

        if (response.status === 401 || response.status === 403) {
          setSyncStatus("error");
          window.showToast("Your kitchen workspace credentials are empty, expired, or invalid. Please sign in again.", "error");
          handleLogout();
          return;
        }

        if (!response.ok) throw new Error("Fetch failed");
        
        const data = await response.json();
        if (data.status !== "success") throw new Error("Fetch returned failure");

        hasMore = data.hasMore;

        if (onProgress) onProgress("Unpacking cloud backup records...", Math.min(30 + page * 10, 90));
        
        // Seed fresh master records into IndexedDB
        await seedLocalDbFromPayload({
          customers: data.customers,
          orders: data.orders,
          inventory: isFirstPage ? data.inventory : [],
          recipes: isFirstPage ? data.recipes : [],
          checklist: isFirstPage ? data.checklist : [],
          customEvents: isFirstPage ? (data.customEvents || []) : [],
          dispatchedNotifications: isFirstPage ? (data.dispatchedNotifications || []) : [],
          scheduledAlerts: isFirstPage ? (data.scheduledAlerts || []) : [],
          bakeryProfile: isFirstPage ? (data.bakeryProfile || []) : [],
          categories: isFirstPage ? (data.categories || []) : []
        });

        isFirstPage = false;
        page++;
      }

      if (onProgress) onProgress("Loading inventory and recipe databases...", 90);
      
      // Load current reactive slice of data (e.g. limit to most recent 100) to keep react memory tiny
      await refreshReactStates();

      if (onProgress) onProgress("Setup finalized! Welcoming back Chef!", 100);
      setSyncStatus("synced");
    } catch (err) {
      console.error("Failed to fetch master data:", err);
      setSyncStatus("error");
      throw err;
    }
  }

  // Standard Offline-first push-only Sync logic
  async function triggerSync() {
    if (!user) return;

    if (isSyncingRef.current) {
      return;
    }
    isSyncingRef.current = true;
    setSyncStatus("syncing");

    try {
      // 1. Gather all local changes (unsynced) in parallel using IndexedDB indexes
      const [
        dirtyCustomers,
        dirtyOrders,
        dirtyInventory,
        dirtyRecipes,
        dirtyChecklist,
        dirtyCustomEvents,
        dirtyDispatchedNotifications,
        dirtyScheduledAlerts,
        dirtyBakeryProfile,
        dirtyCategories
      ] = await Promise.all([
        localDb.customers.where("localChange").equals(1).toArray(),
        localDb.orders.where("localChange").equals(1).toArray(),
        localDb.inventory.where("localChange").equals(1).toArray(),
        localDb.recipes.where("localChange").equals(1).toArray(),
        localDb.checklist.where("localChange").equals(1).toArray(),
        localDb.customEvents.where("localChange").equals(1).toArray(),
        localDb.dispatchedNotifications.where("localChange").equals(1).toArray(),
        localDb.scheduledAlerts.where("localChange").equals(1).toArray(),
        localDb.bakeryProfile.where("localChange").equals(1).toArray(),
        localDb.categories.where("localChange").equals(1).toArray()
      ]);

      const hasDirtyChanges =
        dirtyCustomers.length > 0 ||
        dirtyOrders.length > 0 ||
        dirtyInventory.length > 0 ||
        dirtyRecipes.length > 0 ||
        dirtyChecklist.length > 0 ||
        dirtyCustomEvents.length > 0 ||
        dirtyDispatchedNotifications.length > 0 ||
        dirtyScheduledAlerts.length > 0 ||
        dirtyBakeryProfile.length > 0 ||
        dirtyCategories.length > 0;

      // If no dirty changes are present, we fast-path exit!
      if (!hasDirtyChanges) {
        setSyncStatus("synced");
        isSyncingRef.current = false;
        return;
      }

      // 2. Transmit bulk changes payload to Node custom sync backend
      const response = await fetch(getApiUrl("/api/sync"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (user?.token || "")
        },
        body: JSON.stringify({
          userEmail: user?.email || "praveen023kumar@gmail.com",
          customers: dirtyCustomers,
          orders: dirtyOrders,
          inventory: dirtyInventory,
          recipes: dirtyRecipes,
          checklist: dirtyChecklist,
          customEvents: dirtyCustomEvents,
          dispatchedNotifications: dirtyDispatchedNotifications,
          scheduledAlerts: dirtyScheduledAlerts,
          bakeryProfile: dirtyBakeryProfile,
          categories: dirtyCategories
        }),
      });

      if (response.status === 401 || response.status === 403) {
        setSyncStatus("error");
        window.showToast("Your kitchen workspace credentials are empty, expired, or invalid. Please sign in again.", "error");
        handleLogout();
        return;
      }

      if (!response.ok) throw new Error("Sync failed");
      const data = await response.json();

      if (data.status === "success") {
        // Clear localChange dirty bits of successfully pushed items
        await localDb.transaction("rw", [
          localDb.customers,
          localDb.orders,
          localDb.inventory,
          localDb.recipes,
          localDb.checklist,
          localDb.customEvents,
          localDb.dispatchedNotifications,
          localDb.scheduledAlerts,
          localDb.bakeryProfile,
          localDb.categories
        ], async () => {
          const updates = [];
          for (const c of dirtyCustomers) updates.push(localDb.customers.update(c.id, { localChange: 0 }));
          for (const o of dirtyOrders) updates.push(localDb.orders.update(o.id, { localChange: 0 }));
          for (const item of dirtyInventory) updates.push(localDb.inventory.update(item.id, { localChange: 0 }));
          for (const r of dirtyRecipes) updates.push(localDb.recipes.update(r.id, { localChange: 0 }));
          for (const chk of dirtyChecklist) updates.push(localDb.checklist.update(chk.id, { localChange: 0 }));
          for (const ev of dirtyCustomEvents) updates.push(localDb.customEvents.update(ev.id, { localChange: 0 }));
          for (const dn of dirtyDispatchedNotifications) updates.push(localDb.dispatchedNotifications.update(dn.id, { localChange: 0 }));
          for (const sa of dirtyScheduledAlerts) updates.push(localDb.scheduledAlerts.update(sa.id, { localChange: 0 }));
          for (const bp of dirtyBakeryProfile) updates.push(localDb.bakeryProfile.update(bp.id, { localChange: 0 }));
          for (const cat of dirtyCategories) updates.push(localDb.categories.update(cat.id, { localChange: 0 }));
          await Promise.all(updates);
        });

        setSyncStatus("synced");
      }
    } catch (err) {
      console.error("Cloud synchronization failed", err);
      if (!navigator.onLine) {
        setSyncStatus("offline");
      } else {
        setSyncStatus("error");
      }
    } finally {
      isSyncingRef.current = false;
      if (syncQueueRef.current) {
        syncQueueRef.current = false;
        setTimeout(() => triggerSync(), 100);
      }
    }
  }

  const handleLogin = async (authenticatedUser: { name: string; email: string; avatar: string; token?: string; isNew?: boolean; role?: string }) => {
    console.log("[Auth Debug] handleLogin received authenticatedUser:", authenticatedUser);
    if (authenticatedUser.role === "admin" || authenticatedUser.role === "superadmin") {
      setUser({
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        avatar: authenticatedUser.avatar,
        token: authenticatedUser.token,
        role: authenticatedUser.role
      } as any);
      await setPreference("patisserie_user", {
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        avatar: authenticatedUser.avatar,
        token: authenticatedUser.token,
        role: authenticatedUser.role
      });
      return;
    }

    setIsSyncingInitialData(true);
    setPullingStep("Preparing local workspace partition...");
    setPullingProgress(5);

    // 1. Clear database completely to be absolute clean
    try {
      await Promise.all([
        localDb.customers.clear(),
        localDb.orders.clear(),
        localDb.inventory.clear(),
        localDb.recipes.clear(),
        localDb.checklist.clear(),
        localDb.customEvents.clear(),
        localDb.dispatchedNotifications.clear(),
        localDb.scheduledAlerts.clear(),
        localDb.bakeryProfile.clear()
      ]);
    } catch (err) {
      console.warn("Could not wipe existing local db on new device/user login:", err);
    }

    try {
      setPullingStep("Storing session credentials...");
      setPullingProgress(15);
      await setPreference("patisserie_user", {
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        avatar: authenticatedUser.avatar,
        token: authenticatedUser.token
      });
      await setPreference("patisserie_last_synced_email", authenticatedUser.email);
      
      if (authenticatedUser.isNew) {
        await setPreference("patisserie_is_new_user", "true");
        // Remove default cached values so onboarding can start clean if chosen
        await removePreference("patisserie_bakery_name");
        await removePreference("patisserie_bakery_email");
        await removePreference("patisserie_bakery_phone");
        await removePreference("patisserie_bakery_address");
        await removePreference("patisserie_bakery_role");
      }
    } catch (e) {
      console.warn("Could not save logged-in user to preferences:", e);
    }

    // Now call fetchMasterData with progress callbacks!
    try {
      await fetchMasterData(authenticatedUser, (step, percent) => {
        setPullingStep(step);
        setPullingProgress(percent);
      });
      
      // WhatsApp style: let user enjoy the 100% synced checkmark briefly
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setUser({
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        avatar: authenticatedUser.avatar,
        token: authenticatedUser.token
      });

      setIsSyncingInitialData(false);

      if (authenticatedUser.isNew) {
        navigate("/getting-started");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Initial data pull failed:", err);
      window.showToast("Failed to restore cloud database backup. Please try again.", "error");
      setIsSyncingInitialData(false);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      // Completely delete the local IndexedDB database and open a fresh schema instance
      await localDb.delete();
      await localDb.open();
    } catch (e) {
      console.warn("Could not delete IndexedDB database on logout:", e);
    }

    // Reset local memory states to prevent UI remnants
    setCheckerList([]);
    setCustomEvents([]);
    setDispatchedNotifications([]);
    setScheduledAlerts([]);
    setBakeryProfile(null);

    setUser(null);
    navigate("/");
  };

  // Periodic security token check to verify that this session hasn't been overwritten by logging in on another device.
  useEffect(() => {
    if (!user) return;
    if ((user as any).role === "admin" || (user as any).role === "superadmin") return;

    const intervalId = setInterval(async () => {
      // Only verify if we are online and not already syncing/initing
      if (!navigator.onLine) return;

      try {
        const response = await fetch(getApiUrl("/api/auth/verify"), {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + (user.token || ""),
            "x-user-email": user.email
          }
        });

        if (response.status === 401 || response.status === 403) {
          clearInterval(intervalId);
          window.showToast("Logged out: This account has been logged in on another device.", "warning");
          // Show a browser alert so the user immediately notices and knows why they are logged out
          alert("Session Expired: You have logged in on another mobile device. This device has been logged out.");
          handleLogout();
        }
      } catch (err) {
        console.error("Session verification ping failed", err);
      }
    }, 15000); // verify every 15 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  // --- CRUD WRAPPERS ---

  // Create Order Spec Mutation
  const handleAddOrder = async (newOrder: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
    const id = "ord-" + Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toISOString();
    let finalCustomerId = newOrder.customerId;

    // Automatically check if phone number exists in Customers list
    if (newOrder.customerMobile) {
      const cleanPhone = (p: string) => p.replace(/\D/g, "");
      const targetPhoneCleaned = cleanPhone(newOrder.customerMobile);
      
      const allCust = await localDb.customers.filter((c: any) => c.isDeleted !== 1).toArray();
      const existingCust = allCust.find(c => {
        if (!c.mobile) return false;
        return cleanPhone(c.mobile) === targetPhoneCleaned || c.mobile.trim() === newOrder.customerMobile.trim();
      });

      if (existingCust) {
        finalCustomerId = existingCust.id;
      } else if (newOrder.customerName) {
        // Automatically create a new customer record
        const newCustId = "cust-" + Math.random().toString(36).substring(2, 9);
        const newCustomer: Customer = {
          id: newCustId,
          name: newOrder.customerName,
          mobile: newOrder.customerMobile,
          type: "New",
          totalOrders: 0,
          memberSince: new Date().toISOString().split("T")[0],
          updatedAt: timeStr,
        };
        
        await localDb.customers.put({ ...newCustomer, localChange: 1 });
        finalCustomerId = newCustId;
      }
    }

    const orderRecord: Order = {
      ...newOrder,
      customerId: finalCustomerId || "guest",
      id,
      createdAt: timeStr,
      updatedAt: timeStr,
    };

    // Save locally to IndexedDB with dirty flag set to 1
    await localDb.orders.put({ ...orderRecord, localChange: 1 });
    
    // Automatically update customer's count and status if dynamic customer is linked
    if (orderRecord.customerId && orderRecord.customerId !== "guest" && orderRecord.customerId !== "new") {
      const custRecord = await localDb.customers.get(orderRecord.customerId);
      if (custRecord) {
        const newTotal = (custRecord.totalOrders || 0) + 1;
        const updatedCust = {
          ...custRecord,
          totalOrders: newTotal,
          type: newTotal >= 5 ? ("Frequent" as const) : custRecord.type,
          updatedAt: timeStr,
          localChange: 1,
        };
        await localDb.customers.put(updatedCust);
      }
    }

    // Refresh count states and triggers empty trigger state update
    await refreshReactStates();

    // Triggers silent backend cloud sync
    triggerSync();
    return orderRecord;
  };

  // Update order status trigger with extended stages
  const handleUpdateOrderStatus = async (id: string, status: Order["status"]) => {
    const timeStr = new Date().toISOString();
    const record = await localDb.orders.get(id);
    if (record) {
      const updated = {
        ...record,
        status,
        updatedAt: timeStr,
        localChange: 1,
      };
      await localDb.orders.put(updated);
      await refreshReactStates();
      
      // Sync with cloud SQLite
      triggerSync();
    }
  };

  // Update complete order details
  const handleUpdateOrder = async (updatedOrder: Order) => {
    let finalCustomerId = updatedOrder.customerId;
    const timeStr = new Date().toISOString();

    // Automatically check if phone number exists in Customers list
    if (updatedOrder.customerMobile) {
      const cleanPhone = (p: string) => p.replace(/\D/g, "");
      const targetPhoneCleaned = cleanPhone(updatedOrder.customerMobile);
      
      const allCust = await localDb.customers.filter((c: any) => c.isDeleted !== 1).toArray();
      const existingCust = allCust.find(c => {
        if (!c.mobile) return false;
        return cleanPhone(c.mobile) === targetPhoneCleaned || c.mobile.trim() === updatedOrder.customerMobile.trim();
      });

      if (existingCust) {
        finalCustomerId = existingCust.id;
      } else if (updatedOrder.customerName) {
        // Automatically create a new customer record
        const newCustId = "cust-" + Math.random().toString(36).substring(2, 9);
        const newCustomer: Customer = {
          id: newCustId,
          name: updatedOrder.customerName,
          mobile: updatedOrder.customerMobile,
          type: "New",
          totalOrders: 0,
          memberSince: new Date().toISOString().split("T")[0],
          updatedAt: timeStr,
        };
        
        await localDb.customers.put({ ...newCustomer, localChange: 1 });
        finalCustomerId = newCustId;
      }
    }

    const originalOrder = await localDb.orders.get(updatedOrder.id);
    const updated = {
      ...originalOrder,
      ...updatedOrder,
      customerId: finalCustomerId || "guest",
      updatedAt: timeStr,
      localChange: 1,
    };

    // Correctly update customer stats if customer assignment changes
    if (updated.customerId && updated.customerId !== "guest" && updated.customerId !== "new") {
      const custRecord = await localDb.customers.get(updated.customerId);
      if (custRecord) {
        const oldCustomerId = originalOrder?.customerId;
        
        if (oldCustomerId !== updated.customerId) {
          // Decrement old customer order count
          if (oldCustomerId && oldCustomerId !== "guest" && oldCustomerId !== "new") {
            const oldCust = await localDb.customers.get(oldCustomerId);
            if (oldCust) {
              const oldTotal = Math.max(0, (oldCust.totalOrders || 0) - 1);
              const updatedOldCust = {
                ...oldCust,
                totalOrders: oldTotal,
                type: oldTotal >= 5 ? ("Frequent" as const) : oldCust.type,
                updatedAt: timeStr,
                localChange: 1,
              };
              await localDb.customers.put(updatedOldCust);
            }
          }
          // Increment new customer order count
          const newTotal = (custRecord.totalOrders || 0) + 1;
          const updatedNewCust = {
            ...custRecord,
            totalOrders: newTotal,
            type: newTotal >= 5 ? ("Frequent" as const) : custRecord.type,
            updatedAt: timeStr,
            localChange: 1,
          };
          await localDb.customers.put(updatedNewCust);
        }
      }
    }

    await localDb.orders.put(updated);
    await refreshReactStates();
    triggerSync();
  };

  // Calendar event and notifications DB handlers
  const handleAddCustomEvent = async (event: CustomEvent) => {
    const record = { ...event, localChange: 1, isDeleted: 0 };
    await localDb.customEvents.put(record);
    setCustomEvents((prev) => [record, ...prev]);
    triggerSync();
  };

  const handleDeleteCustomEvent = async (id: string) => {
    const record = await localDb.customEvents.get(id);
    if (record) {
      const updated = { ...record, isDeleted: 1, localChange: 1 };
      await localDb.customEvents.put(updated);
      setCustomEvents((prev) => prev.filter((ev) => ev.id !== id));
      triggerSync();
    }
  };

  const handleAddScheduledAlert = async (alert: CustomScheduledAlert) => {
    const record = { ...alert, localChange: 1, isDeleted: 0 };
    await localDb.scheduledAlerts.put(record);
    setScheduledAlerts((prev) => [record, ...prev]);
    triggerSync();
  };

  const handleDeleteScheduledAlert = async (id: string) => {
    const record = await localDb.scheduledAlerts.get(id);
    if (record) {
      const updated = { ...record, isDeleted: 1, localChange: 1 };
      await localDb.scheduledAlerts.put(updated);
      setScheduledAlerts((prev) => prev.filter((sa) => sa.id !== id));
      triggerSync();
    }
  };

  const handleAddDispatchedNotification = async (notif: DispatchedNotification) => {
    const record = { ...notif, localChange: 1, isDeleted: 0 };
    await localDb.dispatchedNotifications.put(record);
    setDispatchedNotifications((prev) => [record, ...prev]);
    triggerSync();
  };

  const handleClearDispatchedNotifications = async () => {
    const active = await localDb.dispatchedNotifications.toArray();
    const updated = active.map(item => ({
      ...item,
      isDeleted: 1,
      localChange: 1
    }));
    if (updated.length > 0) {
      await localDb.dispatchedNotifications.bulkPut(updated);
    }
    setDispatchedNotifications([]);
    triggerSync();
  };

  // Create Customer Spec Mutation
  const handleAddCustomer = async (newCustomer: Omit<Customer, "id" | "updatedAt">) => {
    const id = "cust-" + Math.random().toString(36).substring(2, 9);
    const customerRecord: Customer = {
      ...newCustomer,
      id,
      updatedAt: new Date().toISOString(),
    };

    await localDb.customers.put({ ...customerRecord, localChange: 1 });
    await refreshReactStates();
    triggerSync();
    return customerRecord;
  };

  // Update Customer Spec Details
  const handleUpdateCustomer = async (updatedCust: Customer) => {
    const updated = {
      ...updatedCust,
      updatedAt: new Date().toISOString(),
      localChange: 1,
    };
    await localDb.customers.put(updated);
    await refreshReactStates();
    triggerSync();
  };

  // Delete Customer Record
  const handleDeleteCustomer = async (id: string) => {
    const existing = await localDb.customers.get(id);
    if (existing) {
      const softDeleted = {
        ...existing,
        isDeleted: 1,
        localChange: 1,
        updatedAt: new Date().toISOString()
      };
      await localDb.customers.put(softDeleted);
    }
    await refreshReactStates();
    triggerSync();
  };

  // Create Stock Material Mutation
  const handleAddInventoryItem = async (newItem: Omit<InventoryItem, "id" | "updatedAt">) => {
    const id = "inv-" + Math.random().toString(36).substring(2, 9);
    const itemRecord: InventoryItem = {
      ...newItem,
      id,
      updatedAt: new Date().toISOString(),
    };

    await localDb.inventory.put({ ...itemRecord, localChange: 1 });
    await refreshReactStates();
    triggerSync();
    return itemRecord;
  };

  // Update Stock Material Mutation
  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    const itemRecord: InventoryItem = {
      ...updatedItem,
      updatedAt: new Date().toISOString(),
    };
    await localDb.inventory.put({ ...itemRecord, localChange: 1 });
    await refreshReactStates();
    triggerSync();
    return itemRecord;
  };

  // Create Baking Formulation Mutation
  const handleAddRecipe = async (newRecipe: Omit<Recipe, "id" | "updatedAt">) => {
    const id = "rec-" + Math.random().toString(36).substring(2, 9);
    const recipeRecord: Recipe = {
      ...newRecipe,
      id,
      updatedAt: new Date().toISOString(),
    };

    await localDb.recipes.put({ ...recipeRecord, localChange: 1 });
    await refreshReactStates();
    triggerSync();
    return recipeRecord;
  };

  // Update Baking Formulation Mutation
  const handleUpdateRecipe = async (updatedRecipe: Recipe) => {
    const recipeRecord: Recipe = {
      ...updatedRecipe,
      updatedAt: new Date().toISOString(),
    };

    await localDb.recipes.put({ ...recipeRecord, localChange: 1 });
    await refreshReactStates();
    triggerSync();
    return recipeRecord;
  };

  // Checklist toggles
  const handleToggleChecklistItem = async (id: string, checked: boolean, date?: string) => {
    const targetDate = date || new Date().toISOString().split("T")[0];

    // 1. First local update UI immediately for instant feedback
    setCheckerList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let completedDates = item.completedDates ? [...item.completedDates] : (item.checked && item.date ? [item.date] : []);
          if (checked) {
            if (!completedDates.includes(targetDate)) {
              completedDates.push(targetDate);
            }
          } else {
            completedDates = completedDates.filter((d) => d !== targetDate);
          }
          return {
            ...item,
            checked: completedDates.includes(targetDate),
            completedDates,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    // 2. Then update Local DB and backend async
    try {
      const record = await localDb.checklist.get(id);
      if (record) {
        let completedDates = record.completedDates ? [...record.completedDates] : (record.checked && record.date ? [record.date] : []);
        if (checked) {
          if (!completedDates.includes(targetDate)) {
            completedDates.push(targetDate);
          }
        } else {
          completedDates = completedDates.filter((d) => d !== targetDate);
        }
        const updated = {
          ...record,
          checked: completedDates.includes(targetDate),
          completedDates,
          updatedAt: new Date().toISOString(),
          localChange: 1,
        };
        await localDb.checklist.put(updated);
        triggerSync();
      }
    } catch (err) {
      console.error("Failed to update checklist item in IndexedDB:", err);
    }
  };

  // Add Checklist Item
  const handleAddChecklistItem = async (text: string, date?: string) => {
    const id = "chk-" + Math.random().toString(36).substring(2, 9);
    const creationDate = date || new Date().toISOString().split("T")[0];
    const itemRecord: ChecklistItem = {
      id,
      text,
      checked: false,
      date: creationDate,
      completedDates: [],
      updatedAt: new Date().toISOString(),
    };
    await localDb.checklist.put({ ...itemRecord, localChange: 1 });
    setCheckerList((prev) => [...prev, itemRecord]);
    triggerSync();
    return itemRecord;
  };

  // Checklist Reset
  const handleResetChecklist = async (date?: string) => {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const all = await localDb.checklist.toArray();
    const updated = all.map((item) => {
      let completedDates = item.completedDates ? [...item.completedDates] : (item.checked && item.date ? [item.date] : []);
      completedDates = completedDates.filter((d) => d !== targetDate);
      return {
        ...item,
        checked: completedDates.includes(targetDate),
        completedDates,
        updatedAt: new Date().toISOString(),
        localChange: 1,
      };
    });
    if (updated.length > 0) {
      await localDb.checklist.bulkPut(updated);
    }
    const fresh = await localDb.checklist.toArray();
    setCheckerList(fresh.filter((chk: any) => chk.isDeleted !== 1));
    triggerSync();
  };

  // Calculate statistics for dashboard views
  const productionCount = useMemo(() => {
    return {
      completed: completedOrdersCount,
      progress: activeOrdersCount,
    };
  }, [completedOrdersCount, activeOrdersCount]);

  const handleUpdateProfile = async (updatedUser: any) => {
    setUser(updatedUser);
    await setPreference("patisserie_user", updatedUser);
  };

  const handleUpdateBakeryProfile = async (updatedProfile: any) => {
    await localDb.bakeryProfile.put({
      ...updatedProfile,
      localChange: 1,
      updatedAt: new Date().toISOString()
    });
    setBakeryProfile(updatedProfile);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      triggerSync();
    }
  };

  return {
    user,
    setUser,
    initializing,
    isLoadingFromDb,
    profileChecked,
    darkMode,
    setDarkMode,
    isSyncingInitialData,
    pullingStep,
    pullingProgress,
    syncStatus,
    checkerList,
    customEvents,
    dispatchedNotifications,
    scheduledAlerts,
    bakeryProfile,
    setBakeryProfile,
    completedOrdersCount,
    activeOrdersCount,
    lowStockCount,
    productionCount,
    triggerSync,
    handleLogin,
    handleLogout,
    handleUpdateProfile,
    handleUpdateBakeryProfile,
    handleAddOrder,
    handleUpdateOrderStatus,
    handleUpdateOrder,
    handleAddCustomEvent,
    handleDeleteCustomEvent,
    handleAddScheduledAlert,
    handleDeleteScheduledAlert,
    handleAddDispatchedNotification,
    handleClearDispatchedNotifications,
    handleAddCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    handleAddInventoryItem,
    handleUpdateInventoryItem,
    handleAddRecipe,
    handleUpdateRecipe,
    handleToggleChecklistItem,
    handleAddChecklistItem,
    handleResetChecklist,
  };
}
