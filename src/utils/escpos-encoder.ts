import { Order, BakeryProfile } from "../types";
import { formatPrice, formatDate } from "./format";

/**
 * Lightweight, zero-dependency ESC/POS binary command encoder for 58mm and 80mm thermal receipt printers.
 * Generates raw bytes conforming to standard Epson/Star ESC/POS command sets.
 */

// ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  /** Initialize printer to default settings */
  init(): this {
    this.buffer.push(ESC, 0x40);
    return this;
  }

  /** Set text alignment (0: Left, 1: Center, 2: Right) */
  align(alignment: "left" | "center" | "right"): this {
    const val = alignment === "center" ? 1 : alignment === "right" ? 2 : 0;
    this.buffer.push(ESC, 0x61, val);
    return this;
  }

  /** Set bold text */
  bold(enable: boolean): this {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  /** Set font size multiplier (normal, double, double-height) */
  size(mode: "normal" | "double" | "double-height"): this {
    if (mode === "double") {
      this.buffer.push(GS, 0x21, 0x11); // Double width & height
    } else if (mode === "double-height") {
      this.buffer.push(GS, 0x21, 0x01); // Double height only
    } else {
      this.buffer.push(GS, 0x21, 0x00); // Normal
    }
    return this;
  }

  /** Add ASCII text with currency symbol sanitization for thermal printer fonts */
  text(str: string): this {
    const cleanStr = str
      .replace(/₹/g, "Rs. ")
      .replace(/[^\x00-\x7F]/g, " ");

    for (let i = 0; i < cleanStr.length; i++) {
      this.buffer.push(cleanStr.charCodeAt(i) & 0xff);
    }
    return this;
  }

  /** Add text with newline */
  textLine(str: string = ""): this {
    this.text(str);
    this.buffer.push(0x0a); // Line feed \n
    return this;
  }

  /** Feed multiple lines */
  feed(lines: number = 2): this {
    this.buffer.push(ESC, 0x64, lines);
    return this;
  }

  /** Cut paper (partial cut with feed) */
  cut(): this {
    this.buffer.push(GS, 0x56, 0x42, 0x00);
    return this;
  }

  /** Formats a 2-column key-value row padded across the printable width */
  twoColumns(left: string, right: string, width: number = 32): this {
    const cleanLeft = left.replace(/₹/g, "Rs. ");
    const cleanRight = right.replace(/₹/g, "Rs. ");
    const spaceCount = Math.max(1, width - cleanLeft.length - cleanRight.length);
    const line = cleanLeft + " ".repeat(spaceCount) + cleanRight;
    this.textLine(line.slice(0, width));
    return this;
  }

  /** Print a horizontal dashed divider line */
  divider(char: string = "-", width: number = 32): this {
    this.textLine(char.repeat(width));
    return this;
  }

  /** Get compiled byte array */
  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /** Convert compiled byte array to Base64 string for Android bridge */
  toBase64(): string {
    const bytes = this.toBytes();
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

/**
 * Builds standard ESC/POS binary receipt for a Bakery Order Invoice
 */
export function buildOrderEscPosInvoice(
  order: Order,
  bakeryProfile?: BakeryProfile | null,
  paperWidth: "58mm" | "80mm" = "80mm",
  orderSeqId?: string
): EscPosBuilder {
  const is58 = paperWidth === "58mm";
  const maxChars = is58 ? 32 : 48;
  const builder = new EscPosBuilder();

  const bakeryName = (bakeryProfile?.bakeryName || "FLOURA BAKERY").toUpperCase();
  const address = bakeryProfile?.address;
  const phone = bakeryProfile?.phone;

  // 1. Header (Centered)
  builder.align("center");
  builder.size("double").bold(true).textLine(bakeryName);
  builder.size("normal").bold(false);

  if (address) {
    builder.textLine(address);
  }
  if (phone) {
    builder.textLine(`Tel: ${phone}`);
  }
  builder.textLine("Exquisite Bakes & Confections");
  builder.divider("=", maxChars);

  // 2. Invoice Details
  builder.align("center");
  builder.bold(true).textLine("ORDER INVOICE");
  builder.bold(false);
  builder.align("left");

  const displayId = orderSeqId ? `#${orderSeqId}` : `#${order.id.slice(-6).toUpperCase()}`;
  builder.twoColumns("Invoice ID:", displayId, maxChars);
  builder.twoColumns("Order Date:", formatDate(order.createdAt), maxChars);
  builder.twoColumns("Status:", order.status.toUpperCase(), maxChars);
  builder.divider("-", maxChars);

  // 3. Client & Logistics
  builder.bold(true).textLine("CUSTOMER & DELIVERY");
  builder.bold(false);
  builder.twoColumns("Customer:", order.customerName || "Valued Client", maxChars);
  if (order.customerMobile) {
    builder.twoColumns("Mobile:", order.customerMobile, maxChars);
  }
  if (order.eventType) {
    builder.twoColumns("Event:", order.eventType, maxChars);
  }
  builder.twoColumns("Delivery Date:", formatDate(order.deliveryDate || order.eventDate), maxChars);
  if (order.deliveryTime) {
    builder.twoColumns("Schedule:", order.deliveryTime, maxChars);
  }
  if (order.venueAddress) {
    builder.textLine(`Venue: ${order.venueAddress.slice(0, maxChars - 7)}`);
    if (order.venueAddress.length > maxChars - 7) {
      builder.textLine(`  ${order.venueAddress.slice(maxChars - 7, maxChars * 2 - 9)}`);
    }
  }
  builder.divider("-", maxChars);

  // 4. Cake Composition & Specifications
  builder.bold(true).textLine("CAKE SPECIFICATIONS");
  builder.bold(false);
  builder.twoColumns("Flavor:", `${order.cakeFlavor} (${order.preference})`, maxChars);
  builder.twoColumns("Structure:", `${order.cakeShape} - ${order.layers}`, maxChars);
  builder.twoColumns("Size / Weight:", order.cakeWeight || "1.0 kg", maxChars);

  if (order.cakeInscription) {
    builder.textLine(`Inscription: "${order.cakeInscription.slice(0, maxChars - 14)}"`);
  }
  if (order.specialInstructions) {
    builder.textLine(`Note: ${order.specialInstructions.slice(0, maxChars - 6)}`);
  }
  builder.divider("-", maxChars);

  // 5. Financial Summary
  builder.bold(true).textLine("BILLING STATEMENT");
  builder.bold(false);
  const basePrice = order.basePrice || order.totalAmount * 0.7;
  const decoCharge = order.decorationCharge || order.totalAmount * 0.2;
  const deliveryFee = order.deliveryFee || 0;
  const paid = order.paidAmount || 0;
  const balance = Math.max(0, order.totalAmount - paid);

  builder.twoColumns("Base Cake Price:", formatPrice(basePrice), maxChars);
  if (decoCharge > 0) {
    builder.twoColumns("Decoration / Spec:", formatPrice(decoCharge), maxChars);
  }
  if (deliveryFee > 0) {
    builder.twoColumns("Delivery Fee:", formatPrice(deliveryFee), maxChars);
  }
  builder.divider("-", maxChars);

  // Grand Total in double height bold
  builder.size("double-height").bold(true);
  builder.twoColumns("GRAND TOTAL:", formatPrice(order.totalAmount), maxChars);
  builder.size("normal").bold(false);

  builder.twoColumns("Total Paid:", formatPrice(paid), maxChars);
  builder.bold(true);
  builder.twoColumns("BALANCE DUE:", formatPrice(balance), maxChars);
  builder.bold(false);
  builder.divider("=", maxChars);

  // 6. Footer (Centered)
  builder.align("center");
  builder.textLine("Thank you for letting us sweeten");
  builder.textLine("your special celebration!");
  builder.textLine("Floura Bakery Suite");
  builder.feed(2);
  builder.cut();

  return builder;
}
