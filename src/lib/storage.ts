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

export function getPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAsset(path: string | null | undefined) {
  if (!path || /^https?:\/\//.test(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
