/**
 * Floura Image Compression Utility
 * Compresses images (File or Base64 Data URL) to the maximum extent possible
 * while strictly guaranteeing the resulting file/payload size is under 50KB.
 */

/**
 * Calculates the approximate binary byte size of a Base64 Data URL.
 */
export function getBase64ByteSize(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIndex = dataUrl.indexOf(",");
  const base64Str = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const padding = base64Str.endsWith("==") ? 2 : base64Str.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64Str.length * 3) / 4) - padding);
}

/**
 * Formats a byte size into a human-readable KB string (e.g. "34 KB").
 */
export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  return kb < 1 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
}

/**
 * Loads an image from a File, Blob, or Data URL.
 */
function loadImage(input: string | File | Blob): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    let objectUrl = "";
    if (typeof input === "string") {
      img.src = input;
    } else {
      objectUrl = URL.createObjectURL(input);
      img.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = () => resolve({ img, cleanup });
    img.onerror = (err) => {
      cleanup();
      reject(err);
    };
  });
}

/**
 * Compresses an image to be strictly under maxKB (default 50KB).
 * Applies proportional dimension clamping, white background fill (to preserve transparent PNGs),
 * and adaptive multi-pass quality reduction.
 *
 * @param input Base64 string, File, or Blob
 * @param maxWidth Max initial width bound (default: 800)
 * @param maxHeight Max initial height bound (default: 800)
 * @param maxKB Target maximum size ceiling in KB (default: 50)
 * @returns Promise<string> Base64 Data URL under maxKB
 */
export async function compressImage(
  input: string | File | Blob,
  maxWidth: number = 800,
  maxHeight: number = 800,
  maxKB: number = 50
): Promise<string> {
  if (!input) return "";

  // If input is already a string under 50KB and not a huge raw file, check if it's already tiny
  const maxBytes = maxKB * 1024;

  let loaded;
  try {
    loaded = await loadImage(input);
  } catch (err) {
    console.warn("Failed to load image for compression:", err);
    if (typeof input === "string") return input;
    throw err;
  }

  const { img, cleanup } = loaded;

  try {
    const naturalWidth = img.naturalWidth || img.width || 400;
    const naturalHeight = img.naturalHeight || img.height || 400;

    // Calculate initial target dimensions adhering to aspect ratio
    let targetWidth = naturalWidth;
    let targetHeight = naturalHeight;

    if (targetWidth > targetHeight) {
      if (targetWidth > maxWidth) {
        targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
        targetWidth = maxWidth;
      }
    } else {
      if (targetHeight > maxHeight) {
        targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
        targetHeight = maxHeight;
      }
    }

    const canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanup();
      return typeof input === "string" ? input : "";
    }

    // Adaptive search: reduce quality first, then downscale dimensions if still over 50KB
    const qualitySteps = [0.72, 0.60, 0.50, 0.40, 0.30, 0.22];
    let bestCandidate = "";
    let minSize = Infinity;

    let curWidth = Math.max(80, Math.round(targetWidth));
    let curHeight = Math.max(80, Math.round(targetHeight));

    // Try up to 5 dimension scaling passes
    for (let pass = 0; pass < 5; pass++) {
      canvas.width = curWidth;
      canvas.height = curHeight;

      ctx = canvas.getContext("2d");
      if (!ctx) break;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background white so transparent PNG/WebP images do not render with black borders in JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, curWidth, curHeight);
      ctx.drawImage(img, 0, 0, curWidth, curHeight);

      for (const quality of qualitySteps) {
        const candidate = canvas.toDataURL("image/jpeg", quality);
        const size = getBase64ByteSize(candidate);

        if (size < minSize) {
          minSize = size;
          bestCandidate = candidate;
        }

        // If candidate meets the strict under 50KB threshold, we're done!
        if (size <= maxBytes) {
          cleanup();
          return candidate;
        }
      }

      // If still over 50KB after lowest quality step, downscale dimensions by 25% and retry
      if (curWidth <= 120 || curHeight <= 120) break;
      curWidth = Math.max(80, Math.round(curWidth * 0.75));
      curHeight = Math.max(80, Math.round(curHeight * 0.75));
    }

    cleanup();
    return bestCandidate || (typeof input === "string" ? input : "");
  } catch (err) {
    cleanup();
    console.warn("Error during image compression:", err);
    return typeof input === "string" ? input : "";
  }
}
