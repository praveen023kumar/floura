// File Path: /src/components/Footer.tsx
import React, { useState } from "react";
import flouraLogo from "../assets/images/floura_logo.webp";
import LegalModal from "./LegalModal";

interface FooterProps {
  className?: string;
  onOpenLegalModal?: (type: "terms" | "privacy" | "disclaimer") => void;
}

export default function Footer({ className = "", onOpenLegalModal }: FooterProps) {
  const [internalModal, setInternalModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);

  const handleOpenModal = (type: "terms" | "privacy" | "disclaimer") => {
    if (onOpenLegalModal) {
      onOpenLegalModal(type);
    } else {
      setInternalModal(type);
    }
  };

  return (
    <>
      {/* FOOTER */}
      <footer className={`border-t border-zinc-150 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-12 px-6 lg:px-10 transition-colors ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
          <div className="flex items-center gap-2.5 select-none">
            <img src={flouraLogo} alt="Floura" width={24} height={24} loading="lazy" className="w-6 h-6 rounded-lg object-cover" />
            <span className="font-serif font-black text-zinc-650 dark:text-zinc-400 italic">Floura</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
          </div>

          <div>© {new Date().getFullYear()} Floura. All Rights Reserved.</div>

          <div className="flex items-center gap-5">
            <button
              id="btn-terms-modal-footer"
              onClick={() => handleOpenModal("terms")}
              className="hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer"
            >
              Terms
            </button>
            <button
              id="btn-privacy-modal-footer"
              onClick={() => handleOpenModal("privacy")}
              className="hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              id="btn-disclaimer-modal-footer"
              onClick={() => handleOpenModal("disclaimer")}
              className="hover:text-zinc-750 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Disclaimer
            </button>
          </div>
        </div>
      </footer>

      {!onOpenLegalModal && (
        <LegalModal
          isOpen={internalModal !== null}
          type={internalModal}
          onClose={() => setInternalModal(null)}
        />
      )}
    </>
  );
}
