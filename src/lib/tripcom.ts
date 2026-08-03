export function buildTripComLink({
  origin,
  destination,
  departureDate,
  returnDate,
}: {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD
}): string {
  const isRoundTrip = !!returnDate;

  const params = new URLSearchParams({
    dcity: origin.toLowerCase(),
    acity: destination.toLowerCase(),
    ddate: departureDate,
    triptype: isRoundTrip ? "rt" : "ow",
    class: "y",
    quantity: "1",
    curr: "THB",
    Allianceid: "9008742",
    SID: "322378603",
    trip_sub1: "flightdip",
  });

  if (isRoundTrip) {
    params.set("rdate", returnDate!);
  }

  return `https://www.trip.com/flights/showfarefirst?${params.toString()}`;
}

// Opens a Trip.com booking URL, attempting to launch the native app on mobile.
//
// On Android: uses an Intent URL (package ctrip.english = Trip.com International on Play Store).
//   Falls back to browser if the app is not installed.
// On iOS: tries the "ctrip://" URL scheme — UNVERIFIED, educated guess from Trip.com's
//   former brand name "Ctrip". Must be tested on a real device. If the scheme isn't
//   registered or the app isn't installed, falls back to opening the https URL in a new tab.
//   NOTE: If Trip.com has Universal Links configured, the plain https link already opens
//   the app automatically — test current links on device before relying on this fallback.
// On desktop: opens in a new tab as normal.
export function openTripComLink(url: string): void {
  if (typeof window === 'undefined') return;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (!isIOS && !isAndroid) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  if (isAndroid) {
    // Intent URL: opens Trip.com app (package: ctrip.english) if installed.
    // S.browser_fallback_url ensures browser fallback when app is absent.
    const intentUrl =
      'intent://' + url.replace(/^https?:\/\//, '') +
      '#Intent;scheme=https;package=ctrip.english;S.browser_fallback_url=' +
      encodeURIComponent(url) + ';end';
    window.location.href = intentUrl;
    return;
  }

  // iOS: attempt custom scheme. If app opens, document.hidden becomes true
  // and the fallback setTimeout is skipped. If scheme fails (app not installed
  // or wrong scheme), document stays visible and fallback opens https URL.
  window.location.href = 'ctrip://';
  setTimeout(() => {
    if (!document.hidden) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, 1500);
}
