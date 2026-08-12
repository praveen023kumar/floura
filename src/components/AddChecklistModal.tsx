// File Path: /src/components/AddChecklistModal.tsx
import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AddChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChecklistItem?: (text: string, date?: string) => Promise<any>;
  defaultDate: string;
}

export default function AddChecklistModal({
  isOpen,
  onClose,
  onAddChecklistItem,
  defaultDate,
}: AddChecklistModalProps) {
  const [taskText, setTaskText] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state when active date changes in parent view or modal opens
  useEffect(() => {
    if (isOpen) {
      setTaskText("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) {
      window.showToast?.("Please enter a task description", "warning");
      return;
    }

    setSaving(true);
    try {
      if (onAddChecklistItem) {
        await onAddChecklistItem(taskText.trim(), defaultDate);
        setSuccess(true);
        window.showToast?.("Task added successfully!", "success");
        setTimeout(() => {
          setSuccess(false);
          setTaskText("");
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error("Failed to add checklist item:", err);
      window.showToast?.("Failed to add checklist item", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Slide-up Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] shadow-2xl border-t border-zinc-200 dark:border-zinc-850 p-6 z-10 max-h-[85vh] overflow-y-auto pb-8 text-left"
          >
            {/* Pill Drag Handle Indicator */}
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-5" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold font-serif text-zinc-850 dark:text-zinc-200">
                  Add Prep Task
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create a new kitchen check item for your prep flow.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Task Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="e.g. Preheat ovens to 180°C and prep bake sheets..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-brand dark:focus:ring-orange-500 font-medium text-zinc-800 dark:text-zinc-100 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-97"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || success}
                  className="flex-1 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    "Adding..."
                  ) : success ? (
                    "Added! ✓"
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
