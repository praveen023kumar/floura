import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { localDb, seedLocalDbFromPayload, getPreference, setPreference, removePreference, closeDatabase } from "../db";
import { getApiUrl } from "../utils/api";
import { setFormatConfig } from "../utils/format";
import {
  Customer,
  Order,
  InventoryItem,
  Recipe,
  ChecklistItem,
  BakeryProfile,
} from "../types";
import { scaleRecipeIngredients, parseWeightToGrams } from "../../shared/calculations";


export function useAppEngine(
  initialUser: { name: string; email: string; avatar: string; token?: string; role?: string } | null = null,
  onLogoutCallback?: () => void
) {
  const navigate = useNavigate();
  const location = useLocation();

  // User Authenticated State
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; token?: string; role?: string } | null>(initialUser);

  // Sync user changes from props
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const [initializing, setInitializing] = useState<boolean>(true);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState<boolean>(true);
  const [profileChecked, setProfileChecked] = useState<boolean>(false);

  // DB Lock State & Event Listener
  const [isDbLocked, setIsDbLocked] = useState<boolean>(false);
  useEffect(() => {
    const handleDbLocked = () => {
      setIsDbLocked(true);
    };
    window.addEventListener("db-locked", handleDbLocked);
    return () => {
      window.removeEventListener("db-locked", handleDbLocked);
    };
  }, []);

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
  const isLoggingOutRef = useRef(false);

  // Local state replicas of IndexedDB tables (Empty references used purely as lightweight reactive triggers)
  const [checkerList, setCheckerList] = useState<ChecklistItem[]>([]);
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
        
        let currency = "$";
        let dateFormat = "YYYY-MM-DD";
        
        if (savedUser) {
          setUser(savedUser);
          if (savedUser.isFreshLogin) {
            // Remove isFreshLogin flag from local storage/state
            const cleanUser = { ...savedUser };
            delete cleanUser.isFreshLogin;
            localStorage.setItem("patisserie_user", JSON.stringify(cleanUser));
            setUser(cleanUser);
            
            // Trigger fresh database sync
            await runFreshLoginSync(savedUser);
          } else {
            // Normal startup session recovery
            currency = await getPreference("floura_currency") || "$";
            dateFormat = await getPreference("floura_date_format") || "YYYY-MM-DD";
            setIsLoadingFromDb(false);
            setInitializing(false);
          }
        } else {
          setIsLoadingFromDb(false);
          setInitializing(false);
        }
        
        setFormatConfig(currency, dateFormat);
        setDarkMode(savedDarkMode);
      } catch (err) {
        console.error("Failed to load user preferences on startup:", err);
        setIsLoadingFromDb(false);
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
  async function refreshReactStates(skipNotify = false, table?: string | string[], isRouteTransition = false, isFromBroadcast = false) {
    if (!user) return; // Skip database queries entirely if user is not authenticated
    try {
      let p = window.location.hash ? window.location.hash.substring(1) : window.location.pathname;
      if (p.startsWith("/")) p = p.substring(1);
      const activeTab = p.split("?")[0].split("/")[0].toLowerCase();

      const loadChecklist = activeTab === "checklist" || activeTab === "dashboard";
      const loadStats = activeTab === "dashboard" || activeTab === "";

      const shouldLoadProfile = !isRouteTransition || !bakeryProfile || (table === "bakeryProfile" || (Array.isArray(table) && table.includes("bakeryProfile")));

      const [
        localBakeryProfile,
        completedCountResult,
        pendingCountResult,
        lowStockCountResult
      ] = await Promise.all([
        shouldLoadProfile ? localDb.bakeryProfile.query("SELECT * FROM bakeryProfile WHERE isDeleted = 0 LIMIT 1") : Promise.resolve([]),
        loadStats ? localDb.orders.query("SELECT COUNT(*) as count FROM orders WHERE isDeleted = 0 AND status = 'Completed'") : Promise.resolve([]),
        loadStats ? localDb.orders.query("SELECT COUNT(*) as count FROM orders WHERE isDeleted = 0 AND status = 'Pending'") : Promise.resolve([]),
        loadStats ? localDb.inventory.query("SELECT COUNT(*) as count FROM inventory WHERE isDeleted = 0 AND quantity < minStockLevel") : Promise.resolve([])
      ]);

      if (loadStats) {
        const completedCount = completedCountResult[0]?.count || 0;
        const pendingCount = pendingCountResult[0]?.count || 0;
        const lowCount = lowStockCountResult[0]?.count || 0;

        setCompletedOrdersCount(completedCount);
        setActiveOrdersCount(pendingCount);
        setLowStockCount(lowCount);
      }

      if (shouldLoadProfile) {
        setBakeryProfile(localBakeryProfile[0] || null);
      }

      // Dispatch event to notify child views (such as OrdersView, DashboardView, etc.) to reload their SQLite queries
      if (!skipNotify) {
        window.dispatchEvent(new CustomEvent("db-update", { detail: { table } }));
      }

      // Broadcast update to other tabs of the same app to keep them in sync
      if (!skipNotify && !isFromBroadcast && typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const channel = new BroadcastChannel("floura_db_sync");
          channel.postMessage({ table });
          channel.close();
        } catch (e) {
          console.error("Failed to broadcast database update:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load SQLite data slice:", err);
    }
  }

  // Keep a reference to the latest refreshReactStates to prevent stale closures in event listeners
  const refreshReactStatesRef = useRef(refreshReactStates);
  const handleLogoutRef = useRef(handleLogout);
  useEffect(() => {
    refreshReactStatesRef.current = refreshReactStates;
    handleLogoutRef.current = handleLogout;
  });

  // Automatically refresh states when document visibility changes
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        refreshReactStatesRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  // Listen for db updates and logout broadcasts from other tabs
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("floura_db_sync");
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "logout") {
        handleLogoutRef.current(true);
        return;
      }
      const { table } = event.data;
      refreshReactStatesRef.current(false, table, false, true);
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  // Silently refresh route-specific states when url / tab changes
  useEffect(() => {
    const handleUrlChange = () => {
      refreshReactStatesRef.current(true, undefined, true);
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
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
        await refreshReactStates(true);
        setProfileChecked(true);

        if (typeof navigator !== "undefined" && navigator.onLine) {
          await triggerSync();
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
      // 1. Gather all local changes (unsynced) in parallel using SQLite
      // Query metadata table to find which tables have pending local changes
      const changedRows = await localDb.updated_tables.query(
        "SELECT tableName FROM updated_tables WHERE hasChanges = 1"
      );
      const changedTables = new Set(changedRows.map(r => r.tableName));

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
        changedTables.has("customers") ? localDb.customers.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("orders") ? localDb.orders.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("inventory") ? localDb.inventory.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("recipes") ? localDb.recipes.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("checklist") ? localDb.checklist.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("customEvents") ? localDb.customEvents.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("dispatchedNotifications") ? localDb.dispatchedNotifications.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("scheduledAlerts") ? localDb.scheduledAlerts.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("bakeryProfile") ? localDb.bakeryProfile.where("localChange").equals(1).toArray() : Promise.resolve([]),
        changedTables.has("categories") ? localDb.categories.where("localChange").equals(1).toArray() : Promise.resolve([])
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

  async function runFreshLoginSync(authenticatedUser: { name: string; email: string; avatar: string; token?: string; isNew?: boolean; role?: string }) {
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
        localDb.bakeryProfile.clear(),
        localDb.categories.clear()
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
      setIsLoadingFromDb(false);
      setInitializing(false);

      if (authenticatedUser.isNew) {
        navigate("/getting-started");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Initial data pull failed:", err);
      window.showToast("Failed to restore cloud database backup. Please try again.", "error");
      setIsSyncingInitialData(false);
      setIsLoadingFromDb(false);
      setInitializing(false);
    }
  }

  const handleLogin = async (authenticatedUser: { name: string; email: string; avatar: string; token?: string; isNew?: boolean; role?: string }) => {
    isLoggingOutRef.current = false;
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
    await runFreshLoginSync(authenticatedUser);
  };

  async function handleLogout(isFromBroadcast = false) {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    // Broadcast logout to other tabs if this logout action was triggered locally on this tab
    if (!isFromBroadcast && typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("floura_db_sync");
        channel.postMessage({ type: "logout" });
        channel.close();
      } catch (e) {
        console.warn("Failed to broadcast logout event:", e);
      }
    }

    isLoggingOutRef.current = false;

    // Reset local memory states to prevent UI remnants before unmount
    setCheckerList([]);
    setBakeryProfile(null);

    if (onLogoutCallback) {
      // Call parent logout callback first to unmount PrivateAppContent/MainAppContent synchronously
      onLogoutCallback();
    } else {
      // Fallback if no callback is supplied
      setUser(null);
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("patisserie_user");
          localStorage.removeItem("patisserie_last_synced_email");
        }
      } catch (e) {
        console.warn("Could not remove session from localStorage on logout:", e);
      }
      try {
        await localDb.delete();
        await localDb.open();
        closeDatabase();
      } catch (e) {
        console.warn("Could not clean database on fallback logout:", e);
      }
      navigate("/");
    }
  }

  // Security token check on window focus — verify this session hasn't been displaced
  // by a login on another device. Runs on tab focus / page visibility restore instead
  // of a polling interval to avoid unnecessary network traffic.
  useEffect(() => {
    if (!user || isLoggingOutRef.current) return;
    if ((user as any).role === "admin" || (user as any).role === "superadmin") return;

    async function verifySession() {
      if (!navigator.onLine || !user || isLoggingOutRef.current) return;
      try {
        const response = await fetch(getApiUrl("/api/auth/verify"), {
          method: "GET",
          headers: {
            "Authorization": "Bearer " + (user!.token || ""),
            "x-user-email": user!.email
          }
        });

        if (response.status === 401 || response.status === 403) {
          if (isLoggingOutRef.current) return;
          window.showToast("Session Expired: You have logged in on another device.", "warning");
          await handleLogout();
        }
      } catch (err) {
        console.error("Session verification failed", err);
      }
    }

    function onFocus() {
      verifySession();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        verifySession();
      }
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
      inventoryReduced: 0,
    };

    const isOtherStatus = newOrder.status !== "Pending" && newOrder.status !== "Ordered Ingredients" && newOrder.status !== "Cancelled";
    if (isOtherStatus) {
      await reduceInventoryForOrder(orderRecord);
      orderRecord.inventoryReduced = 1;
    }

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
    const statesToRefresh = ["orders", "customers"];
    if (orderRecord.inventoryReduced) {
      statesToRefresh.push("inventory");
    }
    await refreshReactStates(false, statesToRefresh);

    // Triggers silent backend cloud sync
    triggerSync();
    return orderRecord;
  };


  // Reduce inventory quantities based on order flavor recipe and weight
  const reduceInventoryForOrder = async (order: Order) => {
    try {
      const recipes = await localDb.recipes.toArray();
      const matchingRecipe = recipes.find(
        (r: any) => r.isDeleted !== 1 && r.name.trim().toLowerCase() === order.cakeFlavor.trim().toLowerCase()
      );
      
      if (!matchingRecipe) {
        console.log(`[Inventory Sync] No matching recipe found for flavor: ${order.cakeFlavor}`);
        return;
      }
      
      const targetWeight = parseWeightToGrams(order.cakeWeight);
      const scaledIngredients = scaleRecipeIngredients(matchingRecipe, targetWeight);
      
      const inventoryItems = await localDb.inventory.toArray();
      for (const ing of scaledIngredients) {
        const invItem = inventoryItems.find(
          (item: any) => item.isDeleted !== 1 && item.name.trim().toLowerCase() === ing.name.trim().toLowerCase()
        );
        if (invItem) {
          const qtyToReduce = ing.scaledQty;
          const newQty = Math.max(0, invItem.quantity - qtyToReduce);
          
          await localDb.inventory.put({
            ...invItem,
            quantity: parseFloat(newQty.toFixed(3)),
            updatedAt: new Date().toISOString(),
            localChange: 1
          });
          console.log(`[Inventory Sync] Reduced ${ing.name} by ${qtyToReduce} ${invItem.unit} (new qty: ${newQty})`);
        } else {
          console.warn(`[Inventory Sync] Ingredient ${ing.name} in recipe not found in inventory.`);
        }
      }
    } catch (err) {
      console.error("[Inventory Sync] Failed to reduce inventory for order:", err);
    }
  };

  // Restore inventory quantities based on order flavor recipe and weight
  const restoreInventoryForOrder = async (order: Order) => {
    try {
      const recipes = await localDb.recipes.toArray();
      const matchingRecipe = recipes.find(
        (r: any) => r.isDeleted !== 1 && r.name.trim().toLowerCase() === order.cakeFlavor.trim().toLowerCase()
      );
      
      if (!matchingRecipe) {
        console.log(`[Inventory Sync] No matching recipe found for flavor: ${order.cakeFlavor}`);
        return;
      }
      
      const targetWeight = parseWeightToGrams(order.cakeWeight);
      const scaledIngredients = scaleRecipeIngredients(matchingRecipe, targetWeight);
      
      const inventoryItems = await localDb.inventory.toArray();
      for (const ing of scaledIngredients) {
        const invItem = inventoryItems.find(
          (item: any) => item.isDeleted !== 1 && item.name.trim().toLowerCase() === ing.name.trim().toLowerCase()
        );
        if (invItem) {
          const qtyToRestore = ing.scaledQty;
          const newQty = invItem.quantity + qtyToRestore;
          
          await localDb.inventory.put({
            ...invItem,
            quantity: parseFloat(newQty.toFixed(3)),
            updatedAt: new Date().toISOString(),
            localChange: 1
          });
          console.log(`[Inventory Sync] Restored ${ing.name} by ${qtyToRestore} ${invItem.unit} (new qty: ${newQty})`);
        }
      }
    } catch (err) {
      console.error("[Inventory Sync] Failed to restore inventory for order:", err);
    }
  };

  // Update order status trigger with extended stages
  const handleUpdateOrderStatus = async (id: string, status: Order["status"]) => {
    const timeStr = new Date().toISOString();
    const record = await localDb.orders.get(id);
    if (record) {
      let inventoryReducedVal = record.inventoryReduced || 0;
      const isOtherStatus = status !== "Pending" && status !== "Ordered Ingredients" && status !== "Cancelled";
      const shouldReduce = isOtherStatus && !inventoryReducedVal;
      const shouldRestore = !isOtherStatus && inventoryReducedVal;

      if (shouldReduce) {
        await reduceInventoryForOrder(record);
        inventoryReducedVal = 1;
      } else if (shouldRestore) {
        await restoreInventoryForOrder(record);
        inventoryReducedVal = 0;
      }

      const updated = {
        ...record,
        status,
        inventoryReduced: inventoryReducedVal,
        updatedAt: timeStr,
        localChange: 1,
      };
      await localDb.orders.put(updated);
      await refreshReactStates(false, ["orders", "inventory"]);
      
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
    let inventoryReducedVal = originalOrder?.inventoryReduced || 0;
    const newStatus = updatedOrder.status;
    const isOtherStatus = newStatus !== "Pending" && newStatus !== "Ordered Ingredients" && newStatus !== "Cancelled";
    
    // Check if details affecting inventory changed
    const detailsChanged = originalOrder && (
      originalOrder.cakeFlavor !== updatedOrder.cakeFlavor ||
      originalOrder.cakeWeight !== updatedOrder.cakeWeight
    );

    const updated = {
      ...originalOrder,
      ...updatedOrder,
      inventoryReduced: inventoryReducedVal,
      customerId: finalCustomerId || "guest",
      updatedAt: timeStr,
      localChange: 1,
    };

    if (originalOrder && inventoryReducedVal === 1) {
      if (!isOtherStatus) {
        // Status changed to non-reduced status: restore inventory
        await restoreInventoryForOrder(originalOrder);
        updated.inventoryReduced = 0;
      } else if (detailsChanged) {
        // Details changed on an already reduced order: restore old, reduce new
        await restoreInventoryForOrder(originalOrder);
        await reduceInventoryForOrder(updated);
        updated.inventoryReduced = 1;
      }
    } else if (isOtherStatus && inventoryReducedVal === 0) {
      // Status changed to active: reduce inventory
      await reduceInventoryForOrder(updated);
      updated.inventoryReduced = 1;
    }

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
    await refreshReactStates(false, ["orders", "customers", "inventory"]);
    triggerSync();

  };


  const handleAddCustomer = async (newCustomer: Omit<Customer, "id" | "updatedAt">) => {
    const id = "cust-" + Math.random().toString(36).substring(2, 9);
    const customerRecord: Customer = {
      ...newCustomer,
      id,
      updatedAt: new Date().toISOString(),
    };

    await localDb.customers.put({ ...customerRecord, localChange: 1 });
    await refreshReactStates(false, "customers");
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
    await refreshReactStates(false, "customers");
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
    await refreshReactStates(false, "customers");
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
    await refreshReactStates(false, "inventory");
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
    await refreshReactStates(false, "inventory");
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
    await refreshReactStates(false, "recipes");
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
    await refreshReactStates(false, "recipes");
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
        await refreshReactStates(false, "checklist");
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
    await refreshReactStates(false, "checklist");
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
    await refreshReactStates(false, "checklist");
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
    await refreshReactStates(false, "bakeryProfile");
    if (typeof navigator !== "undefined" && navigator.onLine) {
      triggerSync();
    }
  };

  return {
    user,
    setUser,
    initializing,
    isLoadingFromDb,
    isDbLocked,
    profileChecked,
    darkMode,
    setDarkMode,
    isSyncingInitialData,
    pullingStep,
    pullingProgress,
    syncStatus,
    checkerList,
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
