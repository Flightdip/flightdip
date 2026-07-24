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
