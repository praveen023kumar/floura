// File Path: /src/components/LegalModal.tsx
import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, Scale, FileText, AlertTriangle } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  type: "terms" | "privacy" | "disclaimer" | null;
  onClose: () => void;
}

export default function LegalModal({ isOpen, type, onClose }: LegalModalProps) {

  const getHeaderIcon = () => {
    switch (type) {
      case "terms":
        return <Scale className="w-6 h-6 text-orange-500 dark:text-orange-400" />;
      case "privacy":
        return <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />;
      case "disclaimer":
        return <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />;
      default:
        return <FileText className="w-6 h-6 text-blue-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "terms":
        return "Terms & Conditions";
      case "privacy":
        return "Privacy Policy";
      case "disclaimer":
        return "Legal Disclaimer";
      default:
        return "Legal Information";
    }
  };

  const renderContent = () => {
    switch (type) {
      case "terms":
        return (
          <div className="space-y-6 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
            <p className="font-serif italic font-medium text-zinc-500 dark:text-zinc-400">
              Last Updated: July 4, 2026
            </p>
            <p>
              Welcome to <strong>Floura Bakery Pro</strong> ("Service", "Application"), a premium cloud-synchronized kitchen operations suite developed by Floura Co. By accessing or using our application, local database caches, formulation calculators, and services, you agree to be bound by these Terms & Conditions.
            </p>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                1. Scope of Service & License
              </h4>
              <p>
                Floura Bakery Pro grants you a limited, non-exclusive, non-transferable, revocable license to use our bakery management tools, recipe scaling matrices, checklist dashboards, and inventory monitors for your business or personal baking operations.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                2. User Account & Security
              </h4>
              <p>
                To utilize the full capabilities of our operational workspace, you must authenticate securely using a verified Google Account. You are entirely responsible for maintaining the privacy and security of your browser's local database session, credentials, and devices. Any unauthorized actions originating from your secure session must be reported immediately.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                3. Intellectual Property Rights
              </h4>
              <p>
                All proprietary formulation algorithms, baker's percentage calculators, user interface layouts, visual assets, icons, typography frameworks, and software codebases are the exclusive property of Floura Co. You may not copy, reverse-engineer, decompile, distribute, or modify any portion of the software without explicit written authorization.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                4. Operational Disclaimer & Safety
              </h4>
              <p>
                Floura is an assistive software tool. You assume full, independent responsibility for verifying all baked goods formulations, scaling outputs, ingredient conversions, and baking temperature controls. Floura Co. is not liable for kitchen operational failures, ruined inventory materials, spoiled dough batches, or oven malfunctions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                5. Limitation of Liability
              </h4>
              <p>
                In no event shall Floura Co., its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of baking profits, operational data loss, client goodwill, or other intangible losses resulting from your use of or inability to use the Service.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                6. Amendments to Terms
              </h4>
              <p>
                We reserve the right to revise or replace these Terms at our sole discretion. Any changes will be published in this portal and will take effect immediately upon posting. Your continued use of the application following updates constitutes binding acceptance of the revised Terms.
              </p>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
            <p className="font-serif italic font-medium text-zinc-500 dark:text-zinc-400">
              Last Updated: July 4, 2026
            </p>
            <p>
              At <strong>Floura Bakery Pro</strong>, we believe in radical transparency, absolute digital security, and user data privacy. This Privacy Policy details how we handle, store, and safeguard your kitchen workspace profile and operational data.
            </p>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                1. Information We Collect
              </h4>
              <p>
                We collect your basic Google Account details (verified email address, display name, and profile image URL) exclusively to establish your secure workspace profile. We do not gather secondary background profiles, tracking telemetry, or behavioral marketing metrics.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                2. Operational Data Storage & Local Persistence
              </h4>
              <p>
                To provide a fast and reliable offline experience in high-heat kitchen environments, your primary operational data (including customer lists, custom order values, inventory volumes, checklist states, and recipes) is stored locally on your device using a high-performance offline database cache. This data is synchronized securely with our cloud service over Transport Layer Security (TLS) when your device is online.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                3. Cookies & Session Storage
              </h4>
              <p>
                We use secure, functional local tokens and session cookies solely to preserve active kitchen sessions, prevent unauthorized spoofing, and persist system settings (such as dark mode and currency choices). We never use cookies for third-party advertising or cross-site telemetry trackers.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                4. Data Security Standards
              </h4>
              <p>
                All data transmissions between your browser and our cloud synchronization endpoints are protected using robust end-to-end encryption. Firebase authentication rules are continuously hardened to ensure that only authenticated owners of a bakery workspace can read or modify its specific database records.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                5. User Control & Data Deletion
              </h4>
              <p>
                You retain complete ownership over your operational data. You have the right to request full deletion of your cloud records, export your databases, or clear your local browser database cache at any time. To purge your workspace completely, you may clean your browser's site data storage or contact Floura support.
              </p>
            </div>
          </div>
        );

      case "disclaimer":
        return (
          <div className="space-y-6 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
            <p className="font-serif italic font-medium text-zinc-500 dark:text-zinc-400">
              Last Updated: July 4, 2026
            </p>
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-serif font-bold block mb-1">Attention Professional Bakers</strong>
                The formulas, calculations, and materials logs within Floura are provided exclusively for planning and workflow optimization. Always exercise professional judgment.
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                1. No Legal or Medical/Allergen Endorsement
              </h4>
              <p>
                The information generated by Floura, including recipe scaling coefficients and ingredient metrics, is not intended as certified food-safety, medical, or dietary advice. Users are fully responsible for complying with municipal kitchen health codes, allergen disclosure regulations, and sanitation guidelines.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                2. Calculation & Scaling Accuracy
              </h4>
              <p>
                While our baker's percentage algorithms and unit converters are designed to be extremely precise, mechanical scaling, humidity factors, and ingredient densities can vary widely in real-world environments. Check and physically weigh ingredients on certified baking scales before mixing large, commercial dough batches.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                3. Offline Synchronization Notice
              </h4>
              <p>
                Floura integrates a robust client-side offline database. However, data that has not been fully synced to the cloud is vulnerable to loss if your browser's application cache is force-cleared, the device is reset, or incognito/private windows are closed. Verify that your system displays "SYNCED LOCALLY" or "ONLINE" status regularly to guarantee cloud backups.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && type && (
        <div 
          id="legal-modal-overlay" 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/75 backdrop-blur-sm"
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-2xl shadow-xs border border-zinc-100 dark:border-zinc-700">
                  {getHeaderIcon()}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-black text-zinc-800 dark:text-zinc-100 leading-tight">
                    {getTitle()}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">
                    Floura Legal Center
                  </span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-full scrollbar-thin scrollbar-thumb-zinc-250 dark:scrollbar-thumb-zinc-700">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium font-sans">
                Protecting professional bakers since 2026.
              </p>
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                Close Document
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
