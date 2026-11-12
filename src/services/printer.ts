import { Order, BakeryProfile } from "../types";
import { buildOrderEscPosInvoice, EscPosBuilder } from "../utils/escpos-encoder";
import { formatPrice, formatDate } from "../utils/format";

export interface BluetoothPrinterDevice {
  name: string;
  address: string;
}

export type PaperSize = "58mm" | "80mm";

const STORAGE_KEY_PRINTER = "floura_bluetooth_printer";
const STORAGE_KEY_DIRECT_PRINT = "floura_bluetooth_direct_print";
const STORAGE_KEY_PAPER_SIZE = "floura_printer_paper_size";

export function getBluetoothPrinter(): BluetoothPrinterDevice | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY_PRINTER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setBluetoothPrinter(device: BluetoothPrinterDevice | null): void {
  if (typeof window === "undefined") return;
  if (device) {
    localStorage.setItem(STORAGE_KEY_PRINTER, JSON.stringify(device));
  } else {
    localStorage.removeItem(STORAGE_KEY_PRINTER);
  }
}

export function isDirectBluetoothPrintEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY_DIRECT_PRINT);
  if (stored === null) {
    return Boolean(getBluetoothPrinter());
  }
  return stored === "true";
}

export function setDirectBluetoothPrintEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_DIRECT_PRINT, enabled ? "true" : "false");
}

export function getPrinterPaperSize(): PaperSize {
  if (typeof window === "undefined") return "80mm";
  const stored = localStorage.getItem(STORAGE_KEY_PAPER_SIZE);
  return stored === "58mm" ? "58mm" : "80mm";
}

export function setPrinterPaperSize(size: PaperSize): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PAPER_SIZE, size);
}

export function isNativeAndroidBridgeAvailable(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).AndroidPrinter);
}

export function isCordovaApp(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as any).IS_CORDOVA_APP || (window as any).cordova)
  );
}

/**
 * Fetch paired Bluetooth devices from Android native bridge
 */
export function fetchPairedBluetoothPrinters(): BluetoothPrinterDevice[] {
  if (typeof window === "undefined") return [];
  const bridge = (window as any).AndroidPrinter;
  if (!bridge || typeof bridge.getPairedBluetoothPrinters !== "function") {
    return [];
  }
  try {
    const raw = bridge.getPairedBluetoothPrinters();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[PrinterService] Failed to query paired devices:", err);
    return [];
  }
}

/**
 * Test print directly to the specified Bluetooth printer
 */
export async function testPrintBluetooth(
  printer: BluetoothPrinterDevice,
  paperSize: PaperSize = "80mm"
): Promise<{ success: boolean; error?: string }> {
  const bridge = (window as any).AndroidPrinter;
  if (!bridge || typeof bridge.printBluetooth !== "function") {
    return { success: false, error: "Native Android Bluetooth bridge not available on this device" };
  }

  try {
    const is58 = paperSize === "58mm";
    const width = is58 ? 32 : 48;
    const builder = new EscPosBuilder();

    builder.align("center");
    builder.size("double").bold(true).textLine("FLOURA BAKERY");
    builder.size("normal").bold(false);
    builder.textLine("Bluetooth Thermal Printer Test");
    builder.divider("=", width);
    builder.align("left");
    builder.twoColumns("Printer:", printer.name.slice(0, 18), width);
    builder.twoColumns("Paper Roll:", paperSize, width);
    builder.twoColumns("Timestamp:", new Date().toLocaleTimeString(), width);
    builder.divider("-", width);
    builder.align("center");
    builder.bold(true).textLine("CONNECTION SUCCESSFUL!");
    builder.bold(false);
    builder.textLine("Silent ESC/POS printing is ready.");
    builder.feed(2);
    builder.cut();

    const base64 = builder.toBase64();
    const rawRes = bridge.printBluetooth(printer.address, base64);
    let res: any = {};
    try {
      res = typeof rawRes === "string" ? JSON.parse(rawRes) : rawRes;
    } catch {
      res = { success: true };
    }

    if (res && res.success) {
      return { success: true };
    }
    return { success: false, error: res?.error || "Printer unreachable" };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to transmit test payload" };
  }
}

/**
 * Main Auto-Connect & Print Invoice Function
 * Follows LAN2POS prioritized architecture:
 * 1. Direct Silent Bluetooth ESC/POS print (0-dialogs, auto-connect)
 * 2. Android Native PrintManager bridge
 * 3. Web isolated iframe print
 * 4. Fallback to window.print()
 */
export async function printOrderInvoice(
  order: Order,
  bakeryProfile?: BakeryProfile | null,
  orderSeqId?: string
): Promise<{ success: boolean; method: "bluetooth" | "android_native" | "web_iframe" | "window_print" }> {
  const btPrinter = getBluetoothPrinter();
  const directBtEnabled = isDirectBluetoothPrintEnabled();
  const paperSize = getPrinterPaperSize();
  const bridge = typeof window !== "undefined" ? (window as any).AndroidPrinter : null;

  // 1. Direct Silent Bluetooth Thermal Printing
  if (directBtEnabled && btPrinter && btPrinter.address && bridge && typeof bridge.printBluetooth === "function") {
    try {
      window.showToast?.(`🖨️ Printing invoice to ${btPrinter.name}...`, "info");
      const escpos = buildOrderEscPosInvoice(order, bakeryProfile, paperSize, orderSeqId);
      const base64 = escpos.toBase64();
      const rawRes = bridge.printBluetooth(btPrinter.address, base64);
      let res: any = {};
      try {
        res = typeof rawRes === "string" ? JSON.parse(rawRes) : rawRes;
      } catch {
        res = { success: true };
      }

      if (res && res.success) {
        window.showToast?.(`✅ Invoice printed to ${btPrinter.name}!`, "success");
        return { success: true, method: "bluetooth" };
      } else {
        console.warn("[PrinterService] Bluetooth print failed:", res?.error);
        window.showToast?.(
          `⚠️ Printer ${btPrinter.name} unreachable: ${res?.error || "Offline"}. Opening print dialog...`,
          "warning"
        );
      }
    } catch (btErr: any) {
      console.warn("[PrinterService] Bluetooth print error:", btErr);
      window.showToast?.(
        `⚠️ Bluetooth print error: ${btErr?.message || "Unavailable"}. Opening print dialog...`,
        "warning"
      );
    }
  }

  // 2. Android Native PrintManager Bridge
  if (bridge && typeof bridge.printHtml === "function") {
    try {
      window.showToast?.("🖨️ Opening print manager...", "info");
      const html = generatePrintableHtml(order, bakeryProfile, orderSeqId);
      const handled = bridge.printHtml(`Invoice_${orderSeqId || order.id}`, html);
      if (handled) {
        return { success: true, method: "android_native" };
      }
    } catch (e) {
      console.warn("[PrinterService] AndroidPrinter.printHtml error:", e);
    }
  }

  // 3. Isolated Web Iframe Print (clean thermal/A4 output without interfering with main DOM)
  try {
    let iframe = document.getElementById("floura-print-iframe") as HTMLIFrameElement;
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    iframe = document.createElement("iframe");
    iframe.id = "floura-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      const html = generatePrintableHtml(order, bakeryProfile, orderSeqId);
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("[PrinterService] Iframe print failed, falling back to window.print():", e);
          window.print();
        }
      }, 250);

      window.showToast?.("Invoice Generated", "success");
      return { success: true, method: "web_iframe" };
    }
  } catch (err) {
    console.warn("[PrinterService] Web iframe setup failed:", err);
  }

  // 4. Fallback to standard window.print()
  window.print();
  window.showToast?.("Invoice Generated", "success");
  return { success: true, method: "window_print" };
}

/**
 * Generate standard HTML for browser / iframe printing
 */
function generatePrintableHtml(order: Order, bakeryProfile?: BakeryProfile | null, orderSeqId?: string): string {
  const bakeryName = bakeryProfile?.bakeryName || "Floura Bakery";
  const displayId = orderSeqId ? `#${orderSeqId}` : `#${order.id.slice(-6).toUpperCase()}`;
  const basePrice = order.basePrice || order.totalAmount * 0.7;
  const decoCharge = order.decorationCharge || order.totalAmount * 0.2;
  const deliveryFee = order.deliveryFee || 0;
  const paid = order.paidAmount || 0;
  const balance = Math.max(0, order.totalAmount - paid);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${displayId}</title>
  <style>
    @page { size: auto; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 20px; }
    .bakery-title { font-size: 24px; font-weight: bold; margin: 0; color: #09090b; }
    .invoice-title { font-size: 20px; font-weight: bold; text-align: right; color: #27272a; margin: 0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; color: #71717a; border-bottom: 1px solid #d4d4d8; padding: 6px 0; }
    td { padding: 8px 0; border-bottom: 1px solid #f4f4f5; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .total-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; margin-top: 10px; }
    .footer { border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 10px; color: #71717a; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="bakery-title">${bakeryName}</h1>
      <p style="margin: 2px 0; font-size: 11px; color: #71717a;">Exquisite Custom Bakes & Confections</p>
      ${bakeryProfile?.address ? `<p style="margin: 2px 0; font-size: 11px;">${bakeryProfile.address}</p>` : ""}
      ${bakeryProfile?.phone ? `<p style="margin: 2px 0; font-size: 11px;">Phone: ${bakeryProfile.phone}</p>` : ""}
    </div>
    <div style="text-align: right;">
      <h2 class="invoice-title">INVOICE</h2>
      <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 12px;">ID: ${displayId}</p>
      <p style="margin: 2px 0 0 0; font-size: 11px;">Date: ${formatDate(order.createdAt)}</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold;">Status: ${order.status.toUpperCase()}</p>
    </div>
  </div>

  <div class="grid-2">
    <div>
      <div class="section-title">Bill To / Client</div>
      <p style="margin: 0; font-weight: bold;">${order.customerName || "Valued Client"}</p>
      ${order.customerMobile ? `<p style="margin: 2px 0; font-family: monospace; font-size: 11px;">${order.customerMobile}</p>` : ""}
    </div>
    <div>
      <div class="section-title">Delivery & Logistics</div>
      ${order.eventType ? `<p style="margin: 2px 0;"><strong>Event:</strong> ${order.eventType}</p>` : ""}
      <p style="margin: 2px 0;"><strong>Date:</strong> ${formatDate(order.deliveryDate || order.eventDate)} at ${order.deliveryTime || "09:00"}</p>
      <p style="margin: 2px 0;"><strong>Venue:</strong> ${order.venueAddress || "In-store pickup"}</p>
    </div>
  </div>

  <div class="section-title">Cake Specifications</div>
  <table>
    <thead>
      <tr>
        <th>Specification</th>
        <th>Selection</th>
        <th class="text-right">Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Flavor Profile</strong></td>
        <td>${order.cakeFlavor}</td>
        <td class="text-right">${order.preference}</td>
      </tr>
      <tr>
        <td><strong>Structure & Tier</strong></td>
        <td>${order.layers}</td>
        <td class="text-right">${order.cakeShape} format</td>
      </tr>
      <tr>
        <td><strong>Size / Weight</strong></td>
        <td>${order.cakeWeight || "1.0 kg"}</td>
        <td class="text-right">—</td>
      </tr>
      ${order.cakeInscription ? `<tr><td><strong>Inscription</strong></td><td colspan="2">"${order.cakeInscription}"</td></tr>` : ""}
      ${order.specialInstructions ? `<tr><td><strong>Instructions</strong></td><td colspan="2">${order.specialInstructions}</td></tr>` : ""}
    </tbody>
  </table>

  <div class="total-box">
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span>Base Cake Price:</span>
      <span style="font-family: monospace;">${formatPrice(basePrice)}</span>
    </div>
    ${decoCharge > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span>Decoration Charge:</span>
      <span style="font-family: monospace;">${formatPrice(decoCharge)}</span>
    </div>` : ""}
    ${deliveryFee > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span>Delivery Fee:</span>
      <span style="font-family: monospace;">${formatPrice(deliveryFee)}</span>
    </div>` : ""}
    <div style="border-top: 1px solid #d4d4d8; margin: 8px 0;"></div>
    <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin-bottom: 4px;">
      <span>Grand Total:</span>
      <span>${formatPrice(order.totalAmount)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #047857; margin-bottom: 4px;">
      <span>Total Paid:</span>
      <span style="font-family: monospace;">${formatPrice(paid)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold;">
      <span>Balance Due:</span>
      <span>${formatPrice(balance)}</span>
    </div>
  </div>

  <div class="footer">
    <p style="margin: 0 0 4px 0; font-weight: bold;">Thank you for letting us sweeten your special celebration!</p>
    <p style="margin: 0;">Floura Kitchen Business Suite</p>
  </div>
</body>
</html>
  `;
}
