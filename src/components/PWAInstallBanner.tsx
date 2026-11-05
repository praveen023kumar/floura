import React from "react";
import { Download, X, Share2, PlusSquare, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import flouraLogo from "../assets/images/floura_logo.webp";
import { usePWAInstall } from "../hooks/usePWAInstall";

export default function PWAInstallBanner() {
  const {
    showBanner,
    showIOSModal,
    setShowIOSModal,
    installApp,
    dismissBanner
  } = usePWAInstall();

  return (
    <>
      {/* Floating PWA Install Prompt Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-white dark:bg-zinc-850 rounded-2xl p-4 shadow-xl border border-zinc-200/80 dark:border-zinc-700/80 flex items-center gap-3.5 backdrop-blur-md"
          >
            <img
              src={flouraLogo}
              alt="Floura"
              className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0 border border-zinc-150 dark:border-zinc-700"
            />
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Install Floura App
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                Fast offline access, native full-screen experience & instant launch.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={installApp}
                  className="bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
                <button
                  type="button"
                  onClick={dismissBanner}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[11px] py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 -mt-8 -mr-1 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Installation Instruction Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 text-left space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-brand/10 dark:bg-orange-500/10 flex items-center justify-center text-primary-brand dark:text-orange-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Install Floura on iOS
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Add to your iPhone or iPad home screen
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-750">
                  <div className="w-6 h-6 rounded-full bg-primary-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      Tap the <Share2 className="w-3.5 h-3.5 text-primary-brand dark:text-orange-400" /> Share button
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Located in the Safari browser toolbar at the bottom or top of your screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-750">
                  <div className="w-6 h-6 rounded-full bg-primary-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      Select <PlusSquare className="w-3.5 h-3.5 text-primary-brand dark:text-orange-400" /> "Add to Home Screen"
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Scroll down in the share menu until you find this option.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-750">
                  <div className="w-6 h-6 rounded-full bg-primary-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Tap "Add" in the top-right corner
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Floura will appear on your home screen as a standalone app!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
