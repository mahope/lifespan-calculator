// The old static cookie banner wrote this key but nothing ever read it.
// Remove it so the privacy policy can state exactly what is stored.
export function removeLegacyConsent(storage) {
  try {
    // Reading window.localStorage itself throws when the browser blocks site data,
    // so it must stay inside the try.
    (storage ?? window.localStorage).removeItem('consent:v1');
  } catch {
    // storage unavailable (private mode / blocked): nothing to clean up
  }
}
