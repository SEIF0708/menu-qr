import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

const BUCKET = "restaurant-assets";

export async function uploadAsset(file: File, userId: string, kind: "logo" | "cover" | "product"): Promise<string> {
  let options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };

  if (kind === "logo") {
    options.maxSizeMB = 0.2;
    options.maxWidthOrHeight = 500;
  } else if (kind === "cover") {
    options.maxSizeMB = 0.5;
    options.maxWidthOrHeight = 1200;
  }

  let fileToUpload = file;
  try {
    fileToUpload = await imageCompression(file, options);
  } catch (err) {
    console.warn("Image compression failed, falling back to original:", err);
  }

  const ext = fileToUpload.name.split(".").pop() || "jpg";
  const path = `${userId}/${kind}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, fileToUpload, {
    cacheControl: "3600",
    upsert: false,
    contentType: fileToUpload.type,
  });
  if (error) throw error;
  return path;
}

// Cache signed URLs in memory for the session
const urlCache = new Map<string, { url: string; expires: number }>();

export async function getSignedUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  // Backward-compat: already a full URL
  if (/^https?:\/\//.test(path)) return path;
  const now = Date.now();
  const cached = urlCache.get(path);
  if (cached && cached.expires > now + 60_000) return cached.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  urlCache.set(path, { url: data.signedUrl, expires: now + 60 * 60 * 1000 });
  return data.signedUrl;
}

export async function deleteAsset(path: string | null | undefined) {
  if (!path || /^https?:\/\//.test(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
