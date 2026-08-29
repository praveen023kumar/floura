// File Path: /src/App.tsx
import { useEffect, useState, lazy, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isNativeApp } from "./utils/api";
import { useAppEngine } from "./hooks/useAppEngine";
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
  User,
  Lock
} from "lucide-react";

declare global {
  interface Window {
    showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  }
}

// Components
import Header from "./components/Header";
import flouraLogo from "./assets/images/floura_logo.webp";
import Avatar from "./components/Avatar";
import LandingPage from "./components/LandingPage";
import InitialSyncLoader from "./components/InitialSyncLoader";

// Lazy loaded page components for optimal app bundles and load performance
const AdminDashboardView = lazy(() => import("./components/AdminDashboardView"));
const AdminLoginView = lazy(() => import("./components/AdminLoginView"));
const LoginView = lazy(() => import("./components/LoginView"));
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
const DebriefsView = lazy(() => import("./components/DebriefsView"));
const FeedbackView = lazy(() => import("./components/FeedbackView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
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
    if (pathname.startsWith("/feedback")) return "feedback";
    return "dashboard";
  };

  const currentScreen = getScreenFromPath(location.pathname);

  const {
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
  } = useAppEngine();

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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Memoized page elements to prevent unnecessary route-level re-renders when parent states update
  const dashboardViewElement = useMemo(() => (
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
  ), [productionCount, activeOrdersCount, lowStockCount, checkerList, user, navigate, handleToggleChecklistItem]);

  const ordersListElement = useMemo(() => (
    <OrdersList
      onAddOrder={handleAddOrder}
      onUpdateOrder={handleUpdateOrder}
      onUpdateOrderStatus={handleUpdateOrderStatus}
      onNavigate={navigate}
    />
  ), [handleAddOrder, handleUpdateOrder, handleUpdateOrderStatus, navigate]);

  const orderCreateElement = useMemo(() => (
    <OrderCreate
      onAddOrder={handleAddOrder}
      onUpdateOrder={handleUpdateOrder}
      onUpdateOrderStatus={handleUpdateOrderStatus}
      onNavigate={navigate}
    />
  ), [handleAddOrder, handleUpdateOrder, handleUpdateOrderStatus, navigate]);

  const orderDetailElement = useMemo(() => (
    <OrderDetail
      onAddOrder={handleAddOrder}
      onUpdateOrder={handleUpdateOrder}
      onUpdateOrderStatus={handleUpdateOrderStatus}
      onNavigate={navigate}
    />
  ), [handleAddOrder, handleUpdateOrder, handleUpdateOrderStatus, navigate]);

  const customersListViewElement = useMemo(() => (
    <CustomersListView
      locationState={location.state}
      onNavigate={navigate}
    />
  ), [location.state, navigate]);

  const customerCreateViewElement = useMemo(() => (
    <CustomerCreateView 
      onAddCustomer={handleAddCustomer}
      onUpdateCustomer={handleUpdateCustomer}
      customerToEdit={location.state?.customer}
      onNavigate={navigate}
    />
  ), [handleAddCustomer, handleUpdateCustomer, location.state?.customer, navigate]);

  const customerDetailViewElement = useMemo(() => (
    <CustomerDetailView
      locationSearch={location.search}
      onNavigate={navigate}
    />
  ), [location.search, navigate]);

  const inventoryListViewElement = useMemo(() => (
    <InventoryListView
      onUpdateInventoryItem={handleUpdateInventoryItem}
      onNavigate={navigate}
    />
  ), [handleUpdateInventoryItem, navigate]);

  const inventoryCreateViewElement = useMemo(() => (
    <InventoryCreateView
      onAddInventoryItem={handleAddInventoryItem}
      onUpdateInventoryItem={handleUpdateInventoryItem}
      itemToEdit={location.state?.item}
      onNavigate={navigate}
    />
  ), [handleAddInventoryItem, handleUpdateInventoryItem, location.state?.item, navigate]);

  const checklistViewElement = useMemo(() => (
    <ChecklistView
      checkerList={checkerList}
      onToggleChecklistItem={handleToggleChecklistItem}
      onAddChecklistItem={handleAddChecklistItem}
      onResetChecklist={handleResetChecklist}
    />
  ), [checkerList, handleToggleChecklistItem, handleAddChecklistItem, handleResetChecklist]);

  const recipesViewElement = useMemo(() => <RecipesView onNavigate={navigate} />, [navigate]);

  const recipeCreateViewElement = useMemo(() => (
    <RecipeCreateView 
      onAddRecipe={handleAddRecipe}
      onUpdateRecipe={handleUpdateRecipe}
      recipeToEdit={location.state?.recipe}
      onNavigate={navigate}
    />
  ), [handleAddRecipe, handleUpdateRecipe, location.state?.recipe, navigate]);

  const recipeDetailViewElement = useMemo(() => (
    <RecipeDetailView
      onNavigate={navigate}
    />
  ), [navigate]);

  const gettingStartedViewElement = useMemo(() => (
    <GettingStartedView
      user={user}
      onUpdateProfile={handleUpdateProfile}
      onUpdateBakeryProfile={handleUpdateBakeryProfile}
    />
  ), [user, handleUpdateProfile, handleUpdateBakeryProfile]);

  const profileViewElement = useMemo(() => (
    <ProfileView
      user={user}
      onUpdateProfile={handleUpdateProfile}
      bakeryProfile={bakeryProfile}
      onUpdateBakeryProfile={handleUpdateBakeryProfile}
    />
  ), [user, bakeryProfile, handleUpdateProfile, handleUpdateBakeryProfile]);

  const moreViewElement = useMemo(() => (
    <MoreView
      initialMoreTab="menu"
      onLogout={handleLogout}
      user={user}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      syncStatus={syncStatus}
      onSync={triggerSync}
      onNavigate={navigate}
    />
  ), [user, darkMode, syncStatus, handleLogout, setDarkMode, triggerSync, navigate]);

  const debriefsViewElement = useMemo(() => <DebriefsView />, []);

  const feedbackViewElement = useMemo(() => (
    <FeedbackView 
      user={user}
      onNavigate={navigate}
    />
  ), [user, navigate]);

  if (isDbLocked) {
    return (
      <div className="min-h-screen bg-baking-cream dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-150 dark:border-zinc-800 flex flex-col items-center"
        >
          {/* Locked Icon Illustration */}
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center border border-amber-200/50 dark:border-amber-900/30 mb-6 shrink-0">
            <Lock className="w-10 h-10 text-amber-500 animate-bounce" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-zinc-800 dark:text-zinc-100 mb-3">
            Workspace Already Open
          </h2>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-sans">
            Floura only supports one open tab at a time to prevent data corruption. 
            This workspace is already active in another browser tab or window.
          </p>

          <div className="w-full flex flex-col gap-3">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-850 text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
              Please <strong>close the other open tab(s)</strong> of Floura and click below to refresh and unlock this session.
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 px-6 bg-primary-brand hover:bg-orange-600 dark:bg-orange-550 dark:hover:bg-orange-650 text-white font-sans font-semibold rounded-2xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all cursor-pointer border-none outline-none"
            >
              Refresh and Continue
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (initializing || isLoadingFromDb) {
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
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-full border-2 border-pink-750 border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-serif font-semibold text-zinc-650 dark:text-zinc-350">
            Loading Admin Workspace...
          </p>
        </div>
      }>
        {!isLoggedAdmin ? (
          <AdminLoginView onLogin={handleLogin} />
        ) : (
          <AdminDashboardView
            user={user}
            onLogout={handleLogout}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        )}
      </Suspense>
    );
  }

  // Gate check for standard Chef paths
  const isLandingPath = location.pathname === "/landing";
  const showLanding = isLandingPath || (!isNativeApp() && (!user || (user as any).role === "admin" || (user as any).role === "superadmin"));

  if (showLanding) {
    return <LoginView user={user} onLogin={handleLogin} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  if (!user || (user as any).role === "admin" || (user as any).role === "superadmin") {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-baking-cream dark:bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary-brand border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-serif font-semibold text-zinc-650 dark:text-zinc-350">
            Loading secure sign-in...
          </p>
        </div>
      }>
        <LoginView onLogin={handleLogin} />
      </Suspense>
    );
  }

  // Force onboarding for new users who haven't completed bakery profile setup
  // Guard: only redirect after the first IndexedDB read has completed (profileChecked)
  // to avoid false redirects on page refresh before data loads
  const isGettingStarted = location.pathname === "/getting-started";
  if (profileChecked && !bakeryProfile && !isGettingStarted) {
    return <Navigate to="/getting-started" replace />;
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
              <Route path="/getting-started" element={gettingStartedViewElement} />
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
              <Route path="/dashboard" element={dashboardViewElement} />
              <Route path="/orders" element={ordersListElement} />
              <Route path="/orders/new" element={orderCreateElement} />
              <Route path="/orders/:id" element={orderDetailElement} />
              <Route path="/customers" element={customersListViewElement} />
              <Route path="/customers/new" element={customerCreateViewElement} />
              <Route path="/customers/:id" element={customerDetailViewElement} />
              <Route path="/inventory" element={inventoryListViewElement} />
              <Route path="/inventory/new" element={inventoryCreateViewElement} />
              <Route path="/checklist" element={checklistViewElement} />
              <Route path="/recipes" element={recipesViewElement} />
              <Route path="/recipes/new" element={recipeCreateViewElement} />
              <Route path="/recipes/:id" element={recipeDetailViewElement} />
              <Route path="/getting-started" element={gettingStartedViewElement} />
              <Route path="/profile" element={profileViewElement} />
              <Route path="/more" element={moreViewElement} />
              <Route path="/debriefs" element={debriefsViewElement} />
              <Route path="/feedback" element={feedbackViewElement} />
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
          onClick={() => navigate("/recipes")}
          className={`flex flex-col items-center justify-center p-2 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
            currentScreen === "recipes" || currentScreen === "recipes-form"
              ? "text-primary-brand dark:text-pink-400 scale-102"
              : "text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Recipes</span>
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

  useEffect(() => {
    const handleDbUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ table?: string | string[] }>;
      const table = customEvent.detail?.table;
      
      if (table) {
        const tables = Array.isArray(table) ? table : [table];
        for (const t of tables) {
          queryClient.invalidateQueries({ queryKey: [t], refetchType: "all" });
        }
        
        // If orders, inventory, or checklist changes, invalidate dashboard
        const dashboardNeedsInvalidation = tables.some(t => 
          ["orders", "inventory", "checklist"].includes(t)
        );
        if (dashboardNeedsInvalidation) {
          queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
        }
        // If orders change, also invalidate debriefs
        if (tables.includes("orders")) {
          queryClient.invalidateQueries({ queryKey: ["debriefs"], refetchType: "all" });
        }
      } else {
        // If no table is specified (e.g. initial sync or pull), invalidate everything
        queryClient.invalidateQueries({ refetchType: "all" });
      }
    };
    window.addEventListener("db-update", handleDbUpdate);
    return () => {
      window.removeEventListener("db-update", handleDbUpdate);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainAppContent />
      </Router>
    </QueryClientProvider>
  );
}
