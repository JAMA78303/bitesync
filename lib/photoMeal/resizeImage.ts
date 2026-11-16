/**
 * Shrinks a photo in the browser before it's sent: a phone photo is 3–12 MB,
 * and 1,024 px on the long side is plenty to recognise food (~150–300 KB as
 * JPEG). Browsers apply the photo's EXIF rotation when drawing it, so the
 * result is the right way up.
 *
 * Fails with a readable message when the browser can't decode the file
 * (HEIC in desktop Chrome, a non-image picked from Files).
 */
export async function resizePhoto(
  file: File,
  maxSide = 1024,
): Promise<{ mediaType: "image/jpeg"; base64: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new Error("decode");
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    if (base64.length < 100) throw new Error("encode");
    return { mediaType: "image/jpeg", base64 };
  } finally {
    URL.revokeObjectURL(url);
  }
}
