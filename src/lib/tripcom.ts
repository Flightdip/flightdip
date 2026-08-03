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
// On iOS: opens via window.open so iOS Universal Links can intercept and open the app
//   automatically if Trip.com has them configured. No custom scheme — avoids Safari's
//   "cannot open" error dialog from unknown schemes.
// On desktop: opens in a new tab as normal.
export function openTripComLink(url: string): void {
  if (typeof window === 'undefined') return;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);

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

  // iOS and desktop: open in new tab. iOS Universal Links will intercept the
  // https URL and open the Trip.com app if it's installed and configured.
  window.open(url, '_blank', 'noopener,noreferrer');
}
