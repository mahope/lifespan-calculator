// The old static cookie banner wrote this key but nothing ever read it.
// Remove it so the privacy policy can state exactly what is stored.
export function removeLegacyConsent(storage = typeof window !== 'undefined' ? window.localStorage : undefined) {
  try {
    storage?.removeItem('consent:v1');
  } catch {
    // storage unavailable (private mode / blocked): nothing to clean up
  }
}
