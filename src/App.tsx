// File Path: /src/App.tsx
import { useEffect, useState, useMemo, lazy, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { localDb, seedLocalDbFromPayload, getPreference, setPreference, removePreference } from "./db";
import { isNativeApp } from "./utils/api";
import { setFormatConfig } from "./utils/format";
import { getApiUrl } from "./utils/api";
import { Customer, Order, InventoryItem, Recipe, ChecklistItem, CustomEvent, DispatchedNotification, CustomScheduledAlert, BakeryProfile } from "./types";
import {
  LayoutDashboard,
  LayoutGrid,
  ShoppingBag,
  Users,
  Boxes,
  BookOpen,
  LogOut,
  RefreshCw,
  Award,
  UserCog,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  MoreHorizontal,
  Sun,
  Moon,
  Calendar,
  MessageSquare,
  User
} from "lucide-react";

declare global {
  interface Window {
    showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  }
}

// Components
import Header from "./components/Header";
import flouraLogo from "./assets/images/floura_logo.jpg";
import Avatar from "./components/Avatar";
import LandingPage from "./components/LandingPage";
import InitialSyncLoader from "./components/InitialSyncLoader";
import AdminDashboardView from "./components/AdminDashboardView";
import AdminLoginView from "./components/AdminLoginView";

// Lazy loaded page components for optimal app bundles and load performance
const DashboardView = lazy(() => import("./components/DashboardView"));
const OrdersList = lazy(() => import("./components/OrdersList"));
const OrderCreate = lazy(() => import("./components/OrderCreate"));
const OrderDetail = lazy(() => import("./components/OrderDetail"));
const CustomersListView = lazy(() => import("./components/CustomersListView"));
const CustomerCreateView = lazy(() => import("./components/CustomerCreateView"));
const CustomerDetailView = lazy(() => import("./components/CustomerDetailView"));
const InventoryListView = lazy(() => import("./components/InventoryListView"));
const InventoryCreateView = lazy(() => import("./components/InventoryCreateView"));
const ChecklistView = lazy(() => import("./components/ChecklistView"));
const RecipesView = lazy(() => import("./components/RecipesView"));
const RecipeCreateView = lazy(() => import("./components/RecipeCreateView"));
const RecipeDetailView = lazy(() => import("./components/RecipeDetailView"));
const ProfileView = lazy(() => import("./components/ProfileView"));
const GettingStartedView = lazy(() => import("./components/GettingStartedView"));
const MoreView = lazy(() => import("./components/MoreView"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const DebriefsView = lazy(() => import("./components/DebriefsView"));
const FeedbackView = lazy(() => import("./components/FeedbackView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function MainAppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const getScreenFromPath = (pathname: string): string => {
    if (pathname.startsWith("/orders/new")) return "orders-form";
    if (pathname.startsWith("/orders")) return "orders";
    if (pathname.startsWith("/customers/new")) return "customers-form";
    if (pathname.startsWith("/customers")) return "customers";
    if (pathname.startsWith("/inventory/new")) return "inventory-form";
    if (pathname.startsWith("/inventory")) return "inventory";
    if (pathname.startsWith("/checklist")) return "checklist";
    if (pathname.startsWith("/recipes/new")) return "recipes-form";
    if (pathname.startsWith("/recipes")) return "recipes";
    if (pathname.startsWith("/debriefs")) return "debriefs";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/getting-started")) return "getting-started";
    if (pathname.startsWith("/more")) return "more";
    if (pathname.startsWith("/calendar")) return "calendar";
    if (pathname.startsWith("/feedback")) return "feedback";
    return "dashboard";
  };

  const currentScreen = getScreenFromPath(location.pathname);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  useEffect(() => {
    window.showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      setToast({ message, type });
    };
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // User Authenticated State
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; token?: string } | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // accessibility Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("patisserie_dark_mode") === "true";
  });

  // Initial Sync / Data Pulling States
  const [isSyncingInitialData, setIsSyncingInitialData] = useState<boolean>(false);
  const [pullingStep, setPullingStep] = useState<string>("");
  const [pullingProgress, setPullingProgress] = useState<number>(0);

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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Load data slice for react states (counts and active small tables) to prevent memory leak
  async function refreshReactStates() {
    try {
      const [
        localChecklist,
        localCustomEvents,
        localDispatchedNotifications,
        localScheduledAlerts,
        localBakeryProfile,
        completedCount,
        pendingCount,
        lowCount
      ] = await Promise.all([
        localDb.checklist.toArray(),
        localDb.customEvents.toArray(),
        localDb.dispatchedNotifications.toArray(),
        localDb.scheduledAlerts.toArray(),
        localDb.bakeryProfile.toArray(),
        localDb.orders.filter((o: any) => o.isDeleted !== 1 && o.status === "Completed").count(),
        localDb.orders.filter((o: any) => o.isDeleted !== 1 && o.status === "Pending").count(),
        localDb.inventory.filter((i: any) => i.isDeleted !== 1 && i.quantity < i.minStockLevel).count()
      ]);

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

  // When user logging in or changing accounts, handle partition switching
  useEffect(() => {
    async function handleUserSwitch() {
      if (!user) return;
      if ((user as any).role === "admin" || (user as any).role === "superadmin") {
        setSyncStatus("synced");
        return;
      }
      
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

        if (onProgress) onProgress(`Unpacking cloud backup records (Page ${page})...`, Math.min(30 + page * 10, 90));
        
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
    await removePreference("patisserie_user");
    await removePreference("patisserie_last_synced_email");
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
    } catch (e) {
      console.warn("Could not wipe IndexedDB tables on logout:", e);
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

  if (initializing) {
    return (
      <div className="min-h-screen bg-baking-cream dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-sm text-center"
        >
          {/* Pulsing Logo Sphere */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0 0px rgba(224, 130, 68, 0.2)",
                "0 0 0 16px rgba(224, 130, 68, 0)",
                "0 0 0 0px rgba(224, 130, 68, 0)"
              ]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border border-zinc-150 dark:border-zinc-800 mb-6 animate-pulse overflow-hidden p-0.5"
          >
            <img src={flouraLogo} alt="Floura Logo" className="w-full h-full rounded-full object-cover select-none" referrerPolicy="no-referrer" />
          </motion.div>

          {/* Loader Icon */}
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-primary-brand dark:text-orange-400 animate-spin" />
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 tracking-wide font-sans font-medium">
            Warming up the ovens & prepping recipes...
          </p>
        </motion.div>
      </div>
    );
  }

  if (isSyncingInitialData) {
    return (
      <InitialSyncLoader 
        step={pullingStep} 
        progress={pullingProgress} 
      />
    );
  }

  // Gate check for separate Admin routes
  const isAdminPath = location.pathname.startsWith("/admin");

  if (isAdminPath) {
    const isLoggedAdmin = user && ((user as any).role === "admin" || (user as any).role === "superadmin");
    if (!isLoggedAdmin) {
      return <AdminLoginView onLogin={handleLogin} />;
    }
    
    return (
      <AdminDashboardView
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // Gate check for standard Chef paths
  const isLandingPath = location.pathname === "/landing";
  if (!user || (user as any).role === "admin" || (user as any).role === "superadmin" || isLandingPath) {
    return <LandingPage user={user} onLogin={handleLogin} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (currentScreen === "getting-started") {
    return (
      <div className="min-h-screen bg-baking-cream dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
        <main className="flex-grow w-full mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <Suspense fallback={
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-primary-brand border-t-transparent dark:border-orange-400 dark:border-t-transparent flex items-center justify-center mb-4"
              />
              <p className="text-sm font-serif font-semibold text-zinc-750 dark:text-zinc-200">
                Freshly baking page view...
              </p>
            </div>
          }>
            <Routes>
              <Route path="/getting-started" element={
                <GettingStartedView
                  user={user}
                  onUpdateProfile={async (updatedUser) => {
                    setUser(updatedUser);
                    await setPreference("patisserie_user", updatedUser);
                  }}
                  onUpdateBakeryProfile={async (updatedProfile) => {
                    await localDb.bakeryProfile.put({
                      ...updatedProfile,
                      localChange: 1,
                      updatedAt: new Date().toISOString()
                    });
                    if (typeof navigator !== "undefined" && navigator.onLine) {
                      triggerSync();
                    } else {
                      const fresh = await localDb.bakeryProfile.toArray();
                      setBakeryProfile(fresh.filter((bp: any) => bp.isDeleted !== 1)[0] || null);
                    }
                  }}
                />
              } />
              <Route path="*" element={<Navigate to="/getting-started" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-baking-cream dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar - Desktop Layout (Responsive slim side menu mirroring design block) */}
      <aside className="desktop-sidebar hidden md:flex w-20 shrink-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col justify-between sticky top-0 h-screen z-40 select-none py-6 items-center transition-all duration-200 overflow-visible">
        <div className="flex flex-col items-center w-full">
          {/* Logo Section */}
          <div className="sidebar-logo-container mb-8 flex items-center justify-center">
            <button
              onClick={() => navigate("/landing")}
              className="sidebar-logo-btn w-12 h-12 rounded-full cursor-pointer hover:rotate-6 transition-all duration-200 border-none outline-none overflow-hidden shrink-0 shadow-xs"
              title="Floura Logo"
            >
              <img 
                src={flouraLogo} 
                alt="Floura Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none" 
              />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav flex flex-col items-center gap-3 w-full px-2">
            {/* Dashboard Link */}
            <button
              onClick={() => navigate("/dashboard")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "dashboard"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <LayoutGrid className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Dashboard
              </span>
            </button>

            {/* Orders Link */}
            <button
              onClick={() => navigate("/orders")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "orders" || currentScreen === "orders-form"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Orders
              </span>
            </button>

            {/* Recipes Link */}
            <button
              onClick={() => navigate("/recipes")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "recipes" || currentScreen === "recipes-form"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Recipes
              </span>
            </button>

            {/* Inventory Link */}
            <button
              onClick={() => navigate("/inventory")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "inventory" || currentScreen === "inventory-form"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <Boxes className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Inventory
              </span>
            </button>

            {/* Customers Link */}
            <button
              onClick={() => navigate("/customers")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "customers" || currentScreen === "customers-form"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-955 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Customers
              </span>
            </button>

            {/* Debriefs Link */}
            <button
              onClick={() => navigate("/debriefs")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "debriefs"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <MessageSquare className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Debriefs
              </span>
            </button>

            {/* Checklist Link */}
            <button
              onClick={() => navigate("/checklist")}
              className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
                currentScreen === "checklist"
                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-white shadow-xs font-extrabold"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                Checklist
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="sidebar-bottom mt-auto flex flex-col items-center gap-4 w-full px-2">
          {/* Settings / More Link */}
          <button
            onClick={() => navigate("/more")}
            className={`sidebar-btn w-11 h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer relative group active:scale-95 ${
              currentScreen === "more"
                ? "bg-zinc-150 dark:bg-zinc-850 text-zinc-950 dark:text-white"
                : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-550 dark:hover:text-zinc-200"
            }`}
          >
            <UserCog className="w-5 h-5" />
            <span className="absolute left-16 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
              More
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Mobile Top Brand Bar (Visible only on mobile/tablet dashboard screen) */}
        {currentScreen === "dashboard" && (
          <header className="md:hidden flex items-center justify-between px-5 h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-900/40 sticky top-0 z-30 select-none shadow-xs">
            <button
              onClick={() => navigate("/landing")}
              className="flex items-center gap-3 cursor-pointer border-none bg-transparent outline-none focus:outline-none p-0 active:scale-95 transition-all"
              title="Go to Landing Page"
            >
              <img
                src={flouraLogo}
                alt="Floura Logo"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-2xl object-cover shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-xs"
              />
              <span className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white font-sans">
                Floura
              </span>
            </button>
            
            {/* User Profile Avatar Icon */}
            <button
              onClick={() => navigate("/profile")}
              className="relative group cursor-pointer active:scale-95 shrink-0 border-none bg-transparent p-0 outline-none"
              title="View Profile"
            >
              {user ? (
                <Avatar
                  avatarKey={user.avatar}
                  name={user.name}
                  className="w-9 h-9 text-xs ring-2 ring-zinc-100 dark:ring-zinc-850"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
              )}
            </button>
          </header>
        )}

        {/* Main viewport Container */}
        <main className="flex-grow w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">
          <Suspense fallback={
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-primary-brand border-t-transparent dark:border-orange-400 dark:border-t-transparent flex items-center justify-center mb-4"
              />
              <p className="text-sm font-serif font-semibold text-zinc-750 dark:text-zinc-200">
                Freshly baking page view...
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Gathering recipes & active inventories
              </p>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={
                <DashboardView
                  onNavigate={(scName) => {
                    if (scName === "dashboard") navigate("/dashboard");
                    else if (scName === "orders") navigate("/orders");
                    else if (scName === "orders-form") navigate("/orders/new");
                    else if (scName === "customers") navigate("/customers");
                    else if (scName === "customers-form") navigate("/customers/new");
                    else if (scName === "inventory") navigate("/inventory");
                    else if (scName === "inventory-form") navigate("/inventory/new");
                    else if (scName === "recipes") navigate("/recipes");
                    else if (scName === "recipes-form") navigate("/recipes/new");
                    else if (scName === "debriefs") navigate("/debriefs");
                    else if (scName === "checklist") navigate("/checklist");
                    else if (scName === "profile") navigate("/profile");
                    else if (scName === "more") navigate("/more");
                  }}
                  productionCount={productionCount}
                  activeOrdersCount={activeOrdersCount}
                  lowStockCount={lowStockCount}
                  checklist={checkerList}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onAlertClick={(orderId) => {
                    navigate(`/orders/${orderId}`);
                  }}
                  user={user}
                />
              } />

              <Route path="/orders" element={
                <OrdersList
                  onAddOrder={handleAddOrder}
                  onUpdateOrder={handleUpdateOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              } />

              <Route path="/orders/new" element={
                <OrderCreate
                  onAddOrder={handleAddOrder}
                  onUpdateOrder={handleUpdateOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              } />

              <Route path="/orders/:id" element={
                <OrderDetail
                  onAddOrder={handleAddOrder}
                  onUpdateOrder={handleUpdateOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              } />

              <Route path="/customers" element={
                <CustomersListView />
              } />

              <Route path="/customers/new" element={
                <CustomerCreateView 
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                />
              } />

              <Route path="/customers/:id" element={
                <CustomerDetailView />
              } />
               <Route path="/inventory" element={
                <InventoryListView
                  onUpdateInventoryItem={handleUpdateInventoryItem}
                />
              } />

              <Route path="/inventory/new" element={
                <InventoryCreateView
                  onAddInventoryItem={handleAddInventoryItem}
                  onUpdateInventoryItem={handleUpdateInventoryItem}
                />
              } />

              <Route path="/checklist" element={
                <ChecklistView
                  checkerList={checkerList}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onAddChecklistItem={handleAddChecklistItem}
                  onResetChecklist={handleResetChecklist}
                />
              } />

              <Route path="/recipes" element={
                <RecipesView />
              } />

              <Route path="/recipes/new" element={
                <RecipeCreateView 
                  onAddRecipe={handleAddRecipe}
                />
              } />

              <Route path="/recipes/:id" element={
                <RecipeDetailView />
              } />

              <Route path="/getting-started" element={
                <GettingStartedView
                  user={user}
                  onUpdateProfile={async (updatedUser) => {
                    setUser(updatedUser);
                    await setPreference("patisserie_user", updatedUser);
                  }}
                  onUpdateBakeryProfile={async (updatedProfile) => {
                    await localDb.bakeryProfile.put({
                      ...updatedProfile,
                      localChange: 1,
                      updatedAt: new Date().toISOString()
                    });
                    if (typeof navigator !== "undefined" && navigator.onLine) {
                      triggerSync();
                    } else {
                      const fresh = await localDb.bakeryProfile.toArray();
                      setBakeryProfile(fresh.filter((bp: any) => bp.isDeleted !== 1)[0] || null);
                    }
                  }}
                />
              } />

              <Route path="/profile" element={
                <ProfileView
                  user={user}
                  onUpdateProfile={async (updatedUser) => {
                    setUser(updatedUser);
                    await setPreference("patisserie_user", updatedUser);
                  }}
                  bakeryProfile={bakeryProfile}
                  onUpdateBakeryProfile={async (updatedProfile) => {
                    await localDb.bakeryProfile.put({
                      ...updatedProfile,
                      localChange: 1,
                      updatedAt: new Date().toISOString()
                    });
                    if (typeof navigator !== "undefined" && navigator.onLine) {
                      triggerSync();
                    } else {
                      const fresh = await localDb.bakeryProfile.toArray();
                      setBakeryProfile(fresh.filter((bp: any) => bp.isDeleted !== 1)[0] || null);
                    }
                  }}
                />
              } />

              <Route path="/more" element={
                <MoreView
                  initialMoreTab="menu"
                  onLogout={handleLogout}
                  user={user}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  syncStatus={syncStatus}
                  onSync={triggerSync}
                />
              } />

              <Route path="/calendar" element={
                <CalendarView
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  customEvents={customEvents}
                  dispatchedLogs={dispatchedNotifications}
                  scheduledAlerts={scheduledAlerts}
                  onAddCustomEvent={handleAddCustomEvent}
                  onDeleteCustomEvent={handleDeleteCustomEvent}
                  onAddScheduledAlert={handleAddScheduledAlert}
                  onDeleteScheduledAlert={handleDeleteScheduledAlert}
                  onAddDispatchedNotification={handleAddDispatchedNotification}
                  onClearDispatchedNotifications={handleClearDispatchedNotifications}
                />
              } />

              <Route path="/debriefs" element={
                <DebriefsView />
              } />

              <Route path="/feedback" element={
                <FeedbackView user={user} />
              } />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Universal Sticky Bottom Navigation Bar matching screenshots visual styling */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex justify-around items-center py-2 pb-safe shadow-lg z-45 transition-colors duration-200">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex flex-col items-center justify-center p-2 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
            currentScreen === "dashboard"
              ? "text-primary-brand dark:text-pink-400 scale-102"
              : "text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => navigate("/orders")}
          className={`flex flex-col items-center justify-center p-2 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
            currentScreen === "orders" || currentScreen === "orders-form"
              ? "text-primary-brand dark:text-pink-400 scale-102"
              : "text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => navigate("/customers")}
          className={`flex flex-col items-center justify-center p-2 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
            currentScreen === "customers" || currentScreen === "customers-form"
              ? "text-primary-brand dark:text-pink-400 scale-102"
              : "text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Customers</span>
        </button>

        <button
          onClick={() => navigate("/more")}
          className={`flex flex-col items-center justify-center p-2 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
            currentScreen === "more"
              ? "text-primary-brand dark:text-pink-400 scale-102"
              : "text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Universal Toast Alert Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 md:bottom-6 right-6 left-6 md:left-auto md:w-96 z-50 flex items-center justify-between p-4 rounded-2xl shadow-xl border border-zinc-150/40 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-500 shrink-0" />}
              
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {toast.message}
              </span>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-1 rounded-lg ml-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const Router = isNativeApp() ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainAppContent />
      </Router>
    </QueryClientProvider>
  );
}
