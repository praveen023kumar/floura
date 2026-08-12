import { useState } from "react";

export interface UseMoreProps {
  onLogout?: () => void;
}

export function useMore({ onLogout }: UseMoreProps = {}) {
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);

  return {
    activeModal,
    setActiveModal,
  };
}
