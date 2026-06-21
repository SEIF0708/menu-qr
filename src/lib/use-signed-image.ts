import { getPublicUrl } from "./storage";

export function useSignedImage(path: string | null | undefined) {
  // Now uses synchronous public URLs to prevent LCP waterfall
  return getPublicUrl(path);
}
