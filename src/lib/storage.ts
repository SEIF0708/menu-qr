import { supabase } from "@/integrations/supabase/client";

const BUCKET = "restaurant-assets";

export async function uploadAsset(file: File, userId: string, kind: "logo" | "cover" | "product"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
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
