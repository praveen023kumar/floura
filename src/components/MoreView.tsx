// /src/components/MoreView.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  CheckCircle,
  Boxes,
  BookOpen,
  Activity,
  MessageSquare,
  ShieldCheck,
  FileText,
  AlertCircle,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import LegalModal from "./LegalModal";
import { useMore } from "../hooks/useMore";
import Avatar from "./Avatar";

interface MoreViewProps {
  initialMoreTab?: string;
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
    avatar: string;
    token?: string;
  } | null;
}

interface MenuItemProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function MoreView({
  onLogout,
  user,
  initialMoreTab,
}: MoreViewProps) {
  const navigate = useNavigate();
  const { activeModal, setActiveModal } = useMore({ onLogout });

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      onLogout?.();
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    description,
    onClick,
    danger = false,
  }: MenuItemProps) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          group w-full flex items-center gap-3.5
          px-4 py-3.5
          text-left
          transition-colors
          cursor-pointer
          ${
            danger
              ? "hover:bg-rose-50 dark:hover:bg-rose-950/20"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          }
        `}
      >
        {/* Icon */}
        <div
          className={`
            w-8 h-8
            shrink-0
            flex items-center justify-center
            ${
              danger
                ? "text-rose-500 dark:text-rose-400"
                : "text-zinc-600 dark:text-zinc-400"
            }
          `}
        >
          <Icon className="w-[17px] h-[17px]" strokeWidth={1.7} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p
            className={`
              text-[13px] font-medium
              ${
                danger
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-zinc-800 dark:text-zinc-100"
              }
            `}
          >
            {title}
          </p>

          {description && (
            <p className="mt-0.5 text-[10px] leading-4 text-zinc-400 dark:text-zinc-500 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Arrow */}
        {!danger && (
          <ChevronRight
            className="
              w-4 h-4
              shrink-0
              text-zinc-300
              dark:text-zinc-600
              group-hover:text-zinc-500
              dark:group-hover:text-zinc-400
              transition-colors
            "
            strokeWidth={1.8}
          />
        )}
      </button>
    );
  };

  const MenuSection = ({
    title,
    children,
  }: MenuSectionProps) => {
    return (
      <section>
        <div className="px-4 pb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
            {title}
          </h2>
        </div>

        <div
          className="
            overflow-hidden
            rounded-xl
            border border-zinc-200/80
            dark:border-zinc-800
            bg-white
            dark:bg-zinc-900
            divide-y
            divide-zinc-100
            dark:divide-zinc-800
          "
        >
          {children}
        </div>
      </section>
    );
  };

  return (
    <>
      <div
        id="more-page-container"
        className="
          w-full
          max-w-2xl
          mx-auto
          px-4
          sm:px-6
          py-5
          sm:py-8
        "
      >
        {/* ======================================================
            PAGE HEADER
        ====================================================== */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-brand dark:text-orange-400" />

            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              More
            </h1>
          </div>

          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Manage your bakery, account and app settings
          </p>
        </div>

        {/* ======================================================
            PROFILE
        ====================================================== */}
        <div
          className="
            mb-5
            overflow-hidden
            rounded-xl
            border border-zinc-200/80
            dark:border-zinc-800
            bg-white
            dark:bg-zinc-900
          "
        >
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="
              group
              w-full
              flex
              items-center
              gap-3.5
              p-4
              text-left
              cursor-pointer
              hover:bg-zinc-50
              dark:hover:bg-zinc-800/50
              transition-colors
            "
          >
            {user ? (
              <Avatar
                avatarKey={user.avatar}
                name={user.name}
                className="
                  w-12 h-12
                  shrink-0
                  text-sm
                  ring-2
                  ring-pink-500/10
                  dark:ring-pink-400/10
                "
              />
            ) : (
              <div
                className="
                  w-12 h-12
                  shrink-0
                  rounded-full
                  bg-zinc-100
                  dark:bg-zinc-800
                  flex items-center justify-center
                "
              >
                <User className="w-5 h-5 text-zinc-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {user?.name || "Bakery Operator"}
                </h2>

                <span
                  className="
                    shrink-0
                    px-1.5
                    py-0.5
                    rounded
                    text-[8px]
                    font-bold
                    bg-pink-50
                    dark:bg-pink-950/30
                    text-primary-brand
                    dark:text-pink-400
                  "
                >
                  HOME BAKER
                </span>
              </div>

              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                {user?.email || "Manage your bakery account"}
              </p>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

                <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
                  Account active
                </span>
              </div>
            </div>

            <ChevronRight
              className="
                w-4 h-4
                shrink-0
                text-zinc-300
                dark:text-zinc-600
                group-hover:text-zinc-500
                transition-colors
              "
            />
          </button>
        </div>

        {/* ======================================================
            BAKERY
            (previously 4 items — Bakery Profile, Business Information,
            Payment Methods, Delivery Settings — all pointed to the same
            /profile route, so they've been collapsed into one entry)
        ====================================================== */}
        <div className="space-y-5">
          <MenuSection title="Bakery">
            <MenuItem
              icon={Building2}
              title="Bakery Profile"
              description="Business info, payment methods and delivery settings"
              onClick={() => navigate("/profile")}
            />
          </MenuSection>

          {/* ====================================================
              OPERATIONS
          ==================================================== */}
          <MenuSection title="Operations">
            <MenuItem
              icon={CheckCircle}
              title="Daily Prep Checklist"
              description="Manage today's kitchen preparation tasks"
              onClick={() => navigate("/checklist")}
            />

            <MenuItem
              icon={Boxes}
              title="Inventory & Raw Materials"
              description="Ingredients, stock levels and alerts"
              onClick={() => navigate("/inventory")}
            />

            <MenuItem
              icon={BookOpen}
              title="Formulations & Recipes"
              description="Recipes, measurements and baking formulations"
              onClick={() => navigate("/recipes")}
            />

            <MenuItem
              icon={Activity}
              title="Kitchen Debriefs"
              description="Review completed orders and kitchen performance"
              onClick={() => navigate("/debriefs")}
            />
          </MenuSection>

          {/* ====================================================
              PREFERENCES section removed — Notifications, Appearance,
              and Backup & Restore had no routes/handlers wired up yet.
              Re-add individually once each is actually implemented.
          ==================================================== */}

          {/* ====================================================
              SUPPORT
          ==================================================== */}
          <MenuSection title="Support & Information">
            <MenuItem
              icon={MessageSquare}
              title="Share Feedback"
              description="Send bugs, requests or suggestions"
              onClick={() => navigate("/feedback")}
            />

            {/* Legal */}
            <MenuItem
              icon={ShieldCheck}
              title="Privacy Policy"
              description="How your information is handled"
              onClick={() => setActiveModal("privacy")}
            />

            <MenuItem
              icon={FileText}
              title="Terms & Conditions"
              description="Floura terms of use"
              onClick={() => setActiveModal("terms")}
            />

            <MenuItem
              icon={AlertCircle}
              title="Disclaimer"
              description="Important information about Floura"
              onClick={() => setActiveModal("disclaimer")}
            />
          </MenuSection>

          {/* ====================================================
              LOGOUT
          ==================================================== */}
          <div
            className="
              overflow-hidden
              rounded-xl
              border border-zinc-200/80
              dark:border-zinc-800
              bg-white
              dark:bg-zinc-900
            "
          >
            <MenuItem
              icon={LogOut}
              title="Logout"
              description="Sign out from this account"
              onClick={handleLogout}
              danger
            />
          </div>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}
        <div className="text-center pt-6 pb-2">
          <p className="text-[9px] text-zinc-300 dark:text-zinc-700">
            Floura Bakery Management
          </p>
        </div>
      </div>

      {/* ========================================================
          LEGAL MODAL
      ======================================================== */}
      <LegalModal
        isOpen={activeModal !== null}
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}