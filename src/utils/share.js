/**
 * Share text via WhatsApp.
 * @param {string} phone - Phone number (optional, opens choose contact if empty)
 * @param {string} text - Message text
 */
export function shareViaWhatsApp(phone, text) {
  const encoded = encodeURIComponent(text);
  if (phone) {
    // Clean phone number — remove spaces, dashes, +
    const cleanPhone = phone.replace(/[\s\-+]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}

/**
 * Share via native Web Share API (mobile).
 * Falls back to copying text to clipboard.
 */
export async function nativeShare(data) {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
      console.warn('Share failed:', err);
    }
  }

  // Fallback: copy to clipboard
  if (data.text || data.url) {
    try {
      await navigator.clipboard.writeText(data.text || data.url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
