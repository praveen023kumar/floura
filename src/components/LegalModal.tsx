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
              Last Updated: August 27, 2026
            </p>
            <p>
              Welcome to <strong>Floura</strong> ("Service", "Application"), a cloud-synchronized bakery management suite. By accessing or using our application, you agree to be bound by these Terms &amp; Conditions.
            </p>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                1. Scope of Service &amp; License
              </h4>
              <p>
                Floura grants you a limited, non-exclusive, non-transferable, revocable license to use our bakery management tools — including order tracking, recipe scaling, inventory monitoring, and profit analytics — for your business or personal baking operations.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                2. User Account &amp; Security
              </h4>
              <p>
                To use the full capabilities of Floura, you must authenticate securely using a verified Google Account. You are fully responsible for maintaining the confidentiality of your account session and devices. Any unauthorised access must be reported immediately.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                3. Intellectual Property Rights
              </h4>
              <p>
                All algorithms, calculators, interface layouts, visual assets, icons, and software codebases are the exclusive property of Floura. You may not copy, reverse-engineer, decompile, distribute, or modify any portion of the software without explicit written authorisation.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                4. Operational Responsibility
              </h4>
              <p>
                Floura is an assistive software tool. You assume full responsibility for verifying all formulations, scaling outputs, ingredient conversions, and baking controls. Floura is not liable for kitchen operational failures, spoiled inventory, or any losses arising from reliance on app-generated data.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                5. Limitation of Liability
              </h4>
              <p>
                In no event shall Floura, its directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of business profits, data loss, or client goodwill — resulting from your use of or inability to use the Service.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                6. Amendments to Terms
              </h4>
              <p>
                We reserve the right to revise these Terms at our sole discretion. Changes will be published in this portal and take effect immediately upon posting. Continued use of the application following updates constitutes acceptance of the revised Terms.
              </p>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
            <p className="font-serif italic font-medium text-zinc-500 dark:text-zinc-400">
              Last Updated: August 27, 2026
            </p>
            <p>
              At <strong>Floura</strong>, we believe in transparency and absolute security of your data. This Privacy Policy details how we collect, store, and protect your workspace profile and operational data.
            </p>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                1. Information We Collect
              </h4>
              <p>
                We collect your basic Google Account details — verified email address, display name, and profile image URL — solely to establish your secure workspace. We do not gather behavioral tracking data, advertising profiles, or third-party telemetry.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                2. Operational Data Storage
              </h4>
              <p>
                Your operational data — including customer records, orders, inventory, and recipes — is stored securely in our cloud database and synchronized to your device for fast, reliable access. All data is encrypted in transit over Transport Layer Security (TLS) and at rest.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                3. Cookies &amp; Session Storage
              </h4>
              <p>
                We use secure, functional session tokens and cookies solely to preserve your active session and persist settings such as dark mode and currency preferences. We never use cookies for third-party advertising or cross-site tracking.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                4. Data Security Standards
              </h4>
              <p>
                All data transmissions are protected with end-to-end encryption. Firebase authentication rules ensure only authenticated workspace owners can read or modify their specific records. Sensitive fields are additionally encrypted at the application layer.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                5. Your Rights &amp; Data Deletion
              </h4>
              <p>
                You retain complete ownership of your data. You may request full deletion of your cloud records, export your data, or clear your local session at any time. To permanently remove your workspace, contact Floura support or clear site data from your browser settings.
              </p>
            </div>
          </div>
        );

      case "disclaimer":
        return (
          <div className="space-y-6 text-zinc-600 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed">
            <p className="font-serif italic font-medium text-zinc-500 dark:text-zinc-400">
              Last Updated: August 27, 2026
            </p>
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-serif font-bold block mb-1">Attention Professional Bakers</strong>
                The formulas, calculations, and data within Floura are provided for planning and workflow optimisation. Always exercise professional judgment before acting on app-generated outputs.
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                1. No Legal, Medical, or Allergen Endorsement
              </h4>
              <p>
                Information generated by Floura — including recipe scaling and ingredient metrics — is not certified food-safety, medical, or dietary advice. Users are fully responsible for complying with local health codes, allergen disclosure regulations, and sanitation guidelines.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                2. Calculation &amp; Scaling Accuracy
              </h4>
              <p>
                While our scaling algorithms are designed to be precise, real-world factors such as humidity, ingredient density variations, and mechanical tolerances can affect results. Always physically weigh ingredients on certified scales before mixing large commercial batches.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                3. Data Sync &amp; Accuracy Notice
              </h4>
              <p>
                Floura syncs your data to the cloud automatically. However, changes made during brief periods of network unavailability will be queued and pushed once connectivity is restored. Always verify your sync status indicator to confirm the latest data has been saved to the cloud.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-zinc-800 dark:text-zinc-100 text-sm uppercase tracking-wide">
                4. Third-Party Services
              </h4>
              <p>
                Floura uses Google Authentication and Firebase cloud services. Your use of these third-party services is subject to their respective terms and privacy policies. Floura is not responsible for the availability or data practices of these external providers.
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
