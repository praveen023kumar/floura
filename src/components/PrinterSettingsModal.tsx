import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Bluetooth,
  Sliders,
  FileText
} from "lucide-react";
import {
  getBluetoothPrinter,
  setBluetoothPrinter,
  isDirectBluetoothPrintEnabled,
  setDirectBluetoothPrintEnabled,
  getPrinterPaperSize,
  setPrinterPaperSize,
  fetchPairedBluetoothPrinters,
  testPrintBluetooth,
  isNativeAndroidBridgeAvailable,
  BluetoothPrinterDevice,
  PaperSize
} from "../services/printer";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedPrinter, setSelectedPrinterState] = useState<BluetoothPrinterDevice | null>(() => getBluetoothPrinter());
  const [directPrint, setDirectPrintState] = useState<boolean>(() => isDirectBluetoothPrintEnabled());
  const [paperSize, setPaperSizeState] = useState<PaperSize>(() => getPrinterPaperSize());
  const [pairedDevices, setPairedDevices] = useState<BluetoothPrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const isNative = isNativeAndroidBridgeAvailable();

  const loadDevices = () => {
    setIsScanning(true);
    try {
      const devices = fetchPairedBluetoothPrinters();
      setPairedDevices(devices);
    } finally {
      setTimeout(() => setIsScanning(false), 300);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedPrinterState(getBluetoothPrinter());
      setDirectPrintState(isDirectBluetoothPrintEnabled());
      setPaperSizeState(getPrinterPaperSize());
      if (isNative) {
        loadDevices();
      }
    }
  }, [isOpen, isNative]);

  const handleSelectPrinter = (device: BluetoothPrinterDevice | null) => {
    setBluetoothPrinter(device);
    setSelectedPrinterState(device);
    if (device) {
      window.showToast?.(`Selected: ${device.name}`, "success");
    }
  };

  const handleToggleDirect = (checked: boolean) => {
    setDirectBluetoothPrintEnabled(checked);
    setDirectPrintState(checked);
    if (checked && !selectedPrinter) {
      window.showToast?.("Please select a paired Bluetooth printer below", "info");
    }
  };

  const handleSelectPaper = (size: PaperSize) => {
    setPrinterPaperSize(size);
    setPaperSizeState(size);
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      window.showToast?.("Please select a printer first", "warning");
      return;
    }
    setIsTesting(true);
    try {
      const res = await testPrintBluetooth(selectedPrinter, paperSize);
      if (res.success) {
        window.showToast?.(`✅ Test slip printed to ${selectedPrinter.name}!`, "success");
      } else {
        window.showToast?.(`⚠️ Could not print: ${res.error || "Device offline"}`, "error");
      }
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-brand/10 dark:bg-orange-500/10 text-primary-brand dark:text-orange-400 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  Thermal Printer Setup
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Auto-connect & print ESC/POS thermal invoices
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Print Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="space-y-0.5 pr-3">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                Direct Auto-Print (Silent)
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-tight">
                Send invoice directly to Bluetooth printer with zero print dialogs
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={directPrint}
                onChange={(e) => handleToggleDirect(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-brand dark:peer-checked:bg-orange-400"></div>
            </label>
          </div>

          {/* Paper Size Setting */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span>Thermal Paper Roll Size</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPaper("58mm")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  paperSize === "58mm"
                    ? "bg-primary-brand text-white border-primary-brand shadow-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                58mm Roll (2 inch)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPaper("80mm")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  paperSize === "80mm"
                    ? "bg-primary-brand text-white border-primary-brand shadow-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                80mm Roll (3 inch)
              </button>
            </div>
          </div>

          {/* Bluetooth Device Selection */}
          <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
                <span>Paired Bluetooth Printer</span>
              </label>
              {isNative && (
                <button
                  type="button"
                  onClick={loadDevices}
                  disabled={isScanning}
                  className="text-[10px] font-bold text-primary-brand dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                  <span>Scan</span>
                </button>
              )}
            </div>

            {isNative ? (
              pairedDevices.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {pairedDevices.map((d) => {
                    const isSelected = selectedPrinter?.address === d.address;
                    return (
                      <div
                        key={d.address}
                        onClick={() => handleSelectPrinter(isSelected ? null : d)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary-brand/5 dark:bg-orange-500/10 border-primary-brand dark:border-orange-400"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                            {d.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            {d.address}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-zinc-400 shrink-0">
                            Select
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center space-y-1.5">
                  <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    No paired printers found
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Please pair your thermal printer in Android Bluetooth Settings first, then tap Scan.
                  </p>
                </div>
              )
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-left space-y-2">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-bold">
                  <FileText className="w-4 h-4 text-primary-brand" />
                  <span>Browser Print Active</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  In Web/Desktop browsers, clicking <strong>Print Invoice</strong> generates an isolated clean print preview. In the Android APK, direct Bluetooth connects silently without dialogs!
                </p>
              </div>
            )}
          </div>

          {/* Test Print Button & Done */}
          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex gap-2">
            {isNative && selectedPrinter && (
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTesting}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>Test Slip</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-primary-brand hover:bg-opacity-95 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
