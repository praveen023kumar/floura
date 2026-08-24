// File Path: /src/components/BeforeAfterSlider.tsx
import React, { useState, useRef, useEffect } from "react";
import { 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  XCircle, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  Smartphone, 
  WifiOff, 
  Database,
  Lock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(50); // Percentage 0 - 100

  const updateSlider = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setPosition(clamped);
  };

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 105 - 2.5; // slight margin adjustment
    updateSlider(percentage);
  };

  // Mouse and Touch Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleGlobalUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMove);
      document.addEventListener("mouseup", handleGlobalUp);
      document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
      document.addEventListener("touchend", handleGlobalUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalUp);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalUp);
    };
  }, [isDragging]);

  // Keydown accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newPosition = position;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        newPosition -= 5;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "ArrowUp":
        newPosition += 5;
        e.preventDefault();
        break;
      case "Home":
        newPosition = 0;
        e.preventDefault();
        break;
      case "End":
        newPosition = 100;
        e.preventDefault();
        break;
    }
    updateSlider(newPosition);
  };

  return (
    <div className="w-full flex flex-col items-center py-10 px-4">
      <div className="text-center max-w-xl mb-8 space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-widest text-primary-brand dark:text-pink-400">
          The Bakery Transformation
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
          Slide to See the Difference
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm">
          Drag the slider to compare traditional manual bakery management with Floura’s streamlined digital system.
        </p>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl aspect-[16/10] md:aspect-[16/9] min-h-[420px] md:min-h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900 select-none"
        onClick={(e) => {
          // Allow clicking anywhere to jump slider to that point
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            updateSlider(pct);
          }
        }}
      >
        {/* AFTER PANEL (Right/Bottom Layer - Green/Pink theme) */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-50/40 via-white to-pink-100/30 dark:from-zinc-950 dark:via-zinc-950 dark:to-pink-950/20 flex flex-col justify-between p-6 md:p-10 select-none z-0">
          <div className="flex justify-between items-center border-b border-pink-100 dark:border-pink-950/80 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200/30">
                <Sparkles className="w-3 h-3" />
                With Floura
              </span>
              <h3 className="font-serif text-xl md:text-2xl font-black text-zinc-900 dark:text-white mt-1.5">
                Digital Calmness
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Status</span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">Perfectly Organized</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-auto py-4">
            <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-pink-100/50 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Centralized Order Tracker</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Securely store shapes, flavours, inscriptions, and reference photos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-pink-100/50 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Automatic Margin Analytics</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Real-time calculations of ingredient costs, pricing margins, and profit.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-pink-100/50 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">100% Offline Database</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">All data is local and encrypted. Works without network, syncs seamlessly later.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-pink-100/50 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Interactive Recipe Scaler</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Change recipe servings or size and let the app scale ingredient quantities instantly.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-pink-100/50 dark:border-pink-950/40 pt-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
            <span>FLOURA BAKERY COMMAND CENTER</span>
            <span>SECURE & DECENTRALIZED</span>
          </div>
        </div>

        {/* BEFORE PANEL (Left/Top Layer - Red/Stuffy theme) - Clipped */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-rose-50/50 via-white to-orange-50/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-between p-6 md:p-10 select-none z-10 border-r border-transparent"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`,
            transition: isDragging ? "none" : "clip-path 0.15s ease-out"
          }}
        >
          {/* Ensure child doesn't shrink during clip, matching container width */}
          <div className="w-full h-full flex flex-col justify-between" style={{ minWidth: containerRef.current?.getBoundingClientRect().width || "800px" }}>
            <div className="flex justify-between items-center border-b border-rose-100 dark:border-rose-950/40 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/20">
                  <AlertCircle className="w-3 h-3 animate-pulse" />
                  Before Floura
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-black text-zinc-900 dark:text-white mt-1.5">
                  Traditional Chaos
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Status</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Manual & Stressful</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-auto py-4">
              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-rose-100/50 dark:border-zinc-800/20 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-rose-500/80" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Stained & Lost Paper Orders</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Scribbling cake specs on paper order sheets that get lost or grease-stained.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-rose-100/50 dark:border-rose-800/20 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5 text-rose-500/80" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Guesswork Profit Margins</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Hoping prices cover rising ingredient costs without real cost data.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-rose-100/50 dark:border-rose-800/20 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-rose-500/80" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Locked Out of Information</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Can't check delivery details or recipe ingredients when away from the shop.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-rose-100/50 dark:border-rose-800/20 shadow-sm backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-rose-500/80" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Errors Scaling Recipes</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Recalculating batch sizes manually on paper, leading to costly waste and mistakes.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-rose-150/40 dark:border-rose-950/40 pt-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
              <span>MANUAL TRACKING SPECS</span>
              <span>UNORGANIZED & FRUSTRATING</span>
            </div>
          </div>
        </div>

        {/* Labels displayed floating on top */}
        <span className="absolute top-4 left-4 z-20 px-3 py-1 bg-rose-500/90 text-white font-extrabold text-[10px] rounded-full uppercase shadow-md select-none pointer-events-none transform -translate-y-1 hover:translate-y-0 transition-transform">
          Before
        </span>
        <span className="absolute top-4 right-4 z-20 px-3 py-1 bg-green-500/90 text-white font-extrabold text-[10px] rounded-full uppercase shadow-md select-none pointer-events-none transform -translate-y-1 hover:translate-y-0 transition-transform">
          After
        </span>

        {/* Slider line separator */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] z-30 pointer-events-none"
          style={{ 
            left: `${position}%`,
            background: "linear-gradient(to bottom, transparent, rgba(219, 39, 119, 0.4) 15%, rgba(219, 39, 119, 0.9) 40%, rgba(219, 39, 119, 0.9) 60%, rgba(219, 39, 119, 0.4) 85%, transparent)",
            transition: isDragging ? "none" : "left 0.15s ease-out"
          }}
        />

        {/* Slider knob */}
        <button
          type="button"
          tabIndex={0}
          role="slider"
          aria-label="Before and After Floura comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white dark:bg-zinc-800 text-primary-brand dark:text-pink-400 border border-pink-200 dark:border-zinc-700 shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-all z-40 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          style={{ 
            left: `${position}%`,
            transition: isDragging ? "none" : "left 0.15s ease-out"
          }}
          onClick={(e) => {
            // Prevent the parent container's click handler from triggering jumps when clicking directly on the knob
            e.stopPropagation();
          }}
        >
          <div className="flex items-center -space-x-1.5 text-primary-brand dark:text-pink-400">
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <ChevronRight className="w-4 h-4 shrink-0" />
          </div>
        </button>
      </div>
    </div>
  );
}
