export interface CountryResult {
  country: string;
  countryEn: string;
  code: string;
  flag: string;
  price: number;
  airline?: string;
  duration?: string;
  trend?: "up" | "down" | "stable";
  stops?: 0 | 1;
  airportCode?: string;
  airportName?: string;
  googleFlightsUrl?: string;
  returnPrice?: number | null;
}

export interface DateResult {
  date: string;
  day: string;
  price: number;
  airline: string;
  seatsLeft: number;
  trend: "up" | "down" | "stable";
  stops: 0 | 1;
}

export const countries = [
  { name: "ญี่ปุ่น", nameEn: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "เกาหลีใต้", nameEn: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "สิงคโปร์", nameEn: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "ไต้หวัน", nameEn: "Taiwan", code: "TW", flag: "🇹🇼" },
  { name: "ฮ่องกง", nameEn: "Hong Kong", code: "HK", flag: "🇭🇰" },
  { name: "มาเลเซีย", nameEn: "Malaysia", code: "MY", flag: "🇲🇾" },
  { name: "เวียดนาม", nameEn: "Vietnam", code: "VN", flag: "🇻🇳" },
  { name: "อินโดนีเซีย", nameEn: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "ฟิลิปปินส์", nameEn: "Philippines", code: "PH", flag: "🇵🇭" },
  { name: "จีน", nameEn: "China", code: "CN", flag: "🇨🇳" },
  { name: "อินเดีย", nameEn: "India", code: "IN", flag: "🇮🇳" },
  { name: "ยุโรป", nameEn: "Europe", code: "EU", flag: "🇪🇺" },
  { name: "สหรัฐอเมริกา", nameEn: "USA", code: "US", flag: "🇺🇸" },
  { name: "ออสเตรเลีย", nameEn: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "นิวซีแลนด์", nameEn: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "สหรัฐอาหรับเอมิเรตส์", nameEn: "UAE", code: "AE", flag: "🇦🇪" },
  { name: "ตุรกี", nameEn: "Turkey", code: "TR", flag: "🇹🇷" },
  { name: "ศรีลังกา", nameEn: "Sri Lanka", code: "LK", flag: "🇱🇰" },
  { name: "เนปาล", nameEn: "Nepal", code: "NP", flag: "🇳🇵" },
  { name: "มัลดีฟส์", nameEn: "Maldives", code: "MV", flag: "🇲🇻" },
];

export const thaiMonths = [
  { value: "2026-06", label: "มิถุนายน 2026", short: "มิ.ย.", year: 2026 },
  { value: "2026-07", label: "กรกฎาคม 2026", short: "ก.ค.", year: 2026 },
  { value: "2026-08", label: "สิงหาคม 2026", short: "ส.ค.", year: 2026 },
  { value: "2026-09", label: "กันยายน 2026", short: "ก.ย.", year: 2026 },
  { value: "2026-10", label: "ตุลาคม 2026", short: "ต.ค.", year: 2026 },
  { value: "2026-11", label: "พฤศจิกายน 2026", short: "พ.ย.", year: 2026 },
  { value: "2026-12", label: "ธันวาคม 2026", short: "ธ.ค.", year: 2026 },
  { value: "2027-01", label: "มกราคม 2027", short: "ม.ค.", year: 2027 },
  { value: "2027-02", label: "กุมภาพันธ์ 2027", short: "ก.พ.", year: 2027 },
  { value: "2027-03", label: "มีนาคม 2027", short: "มี.ค.", year: 2027 },
  { value: "2027-04", label: "เมษายน 2027", short: "เม.ย.", year: 2027 },
  { value: "2027-05", label: "พฤษภาคม 2027", short: "พ.ค.", year: 2027 },
];

const airports: Record<string, { code: string; name: string }> = {
  JP: { code: "NRT", name: "สนามบินนาริตะ" },
  KR: { code: "ICN", name: "สนามบินอินชอน" },
  SG: { code: "SIN", name: "สนามบินชางงี" },
  TW: { code: "TPE", name: "สนามบินเถาหยวน" },
  HK: { code: "HKG", name: "สนามบินฮ่องกง" },
  MY: { code: "KUL", name: "สนามบินกัวลาลัมเปอร์" },
  VN: { code: "SGN", name: "สนามบินเติ้นเซินเญิ้ต" },
  ID: { code: "CGK", name: "สนามบินซูการ์โน-ฮัตตา" },
  PH: { code: "MNL", name: "สนามบินอากีโน" },
  CN: { code: "PEK", name: "สนามบินปักกิ่ง" },
  IN: { code: "DEL", name: "สนามบินอินทิรา คานธี" },
  EU: { code: "LHR", name: "สนามบินฮีทโธรว์" },
  US: { code: "LAX", name: "สนามบินลอสแองเจลิส" },
  AU: { code: "SYD", name: "สนามบินซิดนีย์" },
  NZ: { code: "AKL", name: "สนามบินโอ๊คแลนด์" },
  AE: { code: "DXB", name: "สนามบินดูไบ" },
  TR: { code: "IST", name: "สนามบินอิสตันบูล" },
  LK: { code: "CMB", name: "สนามบินบันดาราไนเก" },
  NP: { code: "KTM", name: "สนามบินตรีภูวัน" },
  MV: { code: "MLE", name: "สนามบินเวลานา" },
};

const airlines = [
  "Thai Airways",
  "Bangkok Airways",
  "Thai AirAsia",
  "Thai Lion Air",
  "Nok Air",
  "THAI Smile",
  "Scoot",
  "AirAsia",
  "Jetstar",
  "Singapore Airlines",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateCountryResults(
  month: string,
  departDate?: string,
  returnDate?: string
): CountryResult[] {
  const seed = month
    ? month.charCodeAt(0) + month.charCodeAt(5)
    : (departDate?.charCodeAt(0) ?? 1) * 3;

  const basePrices: Record<string, number> = {
    JP: 12000,
    KR: 10500,
    SG: 5500,
    TW: 8000,
    HK: 7500,
    MY: 3500,
    VN: 4500,
    ID: 5000,
    PH: 5200,
    CN: 9000,
    IN: 11000,
    EU: 28000,
    US: 32000,
    AU: 18000,
    NZ: 22000,
    AE: 14000,
    TR: 20000,
    LK: 8500,
    NP: 9500,
    MV: 13000,
  };

  const durations: Record<string, string> = {
    JP: "5ช. 30น.",
    KR: "5ช. 10น.",
    SG: "2ช. 20น.",
    TW: "3ช. 45น.",
    HK: "2ช. 50น.",
    MY: "1ช. 45น.",
    VN: "1ช. 50น.",
    ID: "3ช. 10น.",
    PH: "3ช. 30น.",
    CN: "4ช. 15น.",
    IN: "4ช. 30น.",
    EU: "12ช. 0น.",
    US: "17ช. 0น.",
    AU: "9ช. 0น.",
    NZ: "11ช. 30น.",
    AE: "7ช. 0น.",
    TR: "10ช. 30น.",
    LK: "3ช. 20น.",
    NP: "4ช. 0น.",
    MV: "4ช. 15น.",
  };

  const trends: Array<"up" | "down" | "stable"> = ["up", "down", "stable"];

  return countries.map((c, i) => {
    const base = basePrices[c.code] ?? 10000;
    const variation = seededRandom(seed + i) * 0.3 - 0.1;
    const price = Math.round((base * (1 + variation)) / 100) * 100;
    const airlineIdx = Math.floor(seededRandom(seed + i + 50) * airlines.length);
    const trendIdx = Math.floor(seededRandom(seed + i + 100) * 3);

    const airport = airports[c.code] ?? { code: c.code, name: c.name };
    const directChance = ["EU", "US", "AU", "NZ"].includes(c.code) ? 0.15 : 0.5;
    const stops = (seededRandom(seed + i + 150) < directChance ? 0 : 1) as 0 | 1;

    return {
      country: c.name,
      countryEn: c.nameEn,
      code: c.code,
      flag: c.flag,
      price,
      airline: airlines[airlineIdx],
      duration: durations[c.code] ?? "6ช. 0น.",
      trend: trends[trendIdx],
      stops,
      airportCode: airport.code,
      airportName: airport.name,
    };
  }).sort((a, b) => a.price - b.price);
}

export function generateDateResults(
  countryCode: string,
  year: number,
  month: number
): DateResult[] {
  const basePrices: Record<string, number> = {
    JP: 12000,
    KR: 10500,
    SG: 5500,
    TW: 8000,
    HK: 7500,
    MY: 3500,
    VN: 4500,
    ID: 5000,
    PH: 5200,
    CN: 9000,
    IN: 11000,
    EU: 28000,
    US: 32000,
    AU: 18000,
    NZ: 22000,
    AE: 14000,
    TR: 20000,
    LK: 8500,
    NP: 9500,
    MV: 13000,
  };

  const thaiDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const daysInMonth = new Date(year, month, 0).getDate();
  const base = basePrices[countryCode] ?? 10000;
  const seed = countryCode.charCodeAt(0) * year + month;

  const results: DateResult[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.15 : 1.0;
    const variation = seededRandom(seed + day) * 0.4 - 0.15;
    const price = Math.round((base * weekendMultiplier * (1 + variation)) / 100) * 100;
    const airlineIdx = Math.floor(seededRandom(seed + day + 50) * airlines.length);
    const seatsLeft = Math.floor(seededRandom(seed + day + 100) * 12) + 1;
    const trends: Array<"up" | "down" | "stable"> = ["up", "down", "stable"];
    const trendIdx = Math.floor(seededRandom(seed + day + 150) * 3);

    const dd = String(day).padStart(2, "0");
    const mm = String(month).padStart(2, "0");

    const stops = (seededRandom(seed + day + 200) < 0.4 ? 0 : 1) as 0 | 1;

    results.push({
      date: `${dd}/${mm}/${year}`,
      day: thaiDays[dayOfWeek],
      price,
      airline: airlines[airlineIdx],
      seatsLeft,
      trend: trends[trendIdx],
      stops,
    });
  }

  return results.sort((a, b) => a.price - b.price);
}
