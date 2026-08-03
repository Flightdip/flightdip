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

// Opens a Trip.com URL on Android via Intent URL (opens app if installed, browser fallback if not).
//
// ONLY call this for Android. For iOS and desktop, let the natural <a href> click handle
// navigation without calling this function — programmatic window.open() and window.location.href
// do NOT trigger iOS Universal Links (known Safari limitation), but user-initiated <a> clicks do.
export function openTripComLink(url: string): void {
  if (typeof window === 'undefined') return;
  const intentUrl =
    'intent://' + url.replace(/^https?:\/\//, '') +
    '#Intent;scheme=https;package=ctrip.english;S.browser_fallback_url=' +
    encodeURIComponent(url) + ';end';
  window.location.href = intentUrl;
}
