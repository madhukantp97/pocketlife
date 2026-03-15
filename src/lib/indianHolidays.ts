/**
 * Indian Public Holidays System (2025–2075)
 * 
 * Fixed holidays repeat every year. Variable (lunar-based) holidays are sourced from:
 *   - Hindu festivals: Infoplease, Testbook, EpicAstrology, GrahaGuru
 *   - Islamic festivals: Infoplease (algorithmic approximation beyond 2030)
 *   - Good Friday: Computed via Gregorian Easter algorithm
 * 
 * Note: Lunar-based dates may vary ±1–2 days by region & panchang.
 * Metonic cycle (≈19 years) is used for Hindu festivals beyond known data.
 */

export interface IndianHoliday {
  name: string;
  month: number; // 0-indexed (0=Jan, 11=Dec)
  day: number;
  type: 'national' | 'religious' | 'regional';
  description?: string;
}

// ────────────────────────────────────────────
// 1. FIXED HOLIDAYS (same date every year)
// ────────────────────────────────────────────
const FIXED_HOLIDAYS: IndianHoliday[] = [
  { name: "New Year's Day", month: 0, day: 1, type: 'regional', description: 'New Year celebration.' },
  { name: 'Lohri', month: 0, day: 13, type: 'regional', description: 'Harvest festival celebrated mainly in Punjab.' },
  { name: 'Makar Sankranti / Pongal', month: 0, day: 14, type: 'religious', description: "Harvest festival marking the sun's transit into Capricorn." },
  { name: 'Republic Day', month: 0, day: 26, type: 'national', description: 'Celebrates the adoption of the Indian Constitution in 1950.' },
  { name: 'Baisakhi', month: 3, day: 14, type: 'regional', description: 'Sikh New Year and harvest festival.' },
  { name: 'Ambedkar Jayanti', month: 3, day: 14, type: 'national', description: 'Birthday of Dr. B.R. Ambedkar, architect of the Constitution.' },
  { name: 'Labour Day', month: 4, day: 1, type: 'national', description: "International Workers' Day." },
  { name: 'Independence Day', month: 7, day: 15, type: 'national', description: "Marks India's independence from British rule in 1947." },
  { name: "Teachers' Day", month: 8, day: 5, type: 'national', description: 'Birthday of Dr. Sarvepalli Radhakrishnan.' },
  { name: 'Gandhi Jayanti', month: 9, day: 2, type: 'national', description: 'Birthday of Mahatma Gandhi, Father of the Nation.' },
  { name: "Children's Day", month: 10, day: 14, type: 'national', description: 'Birthday of Jawaharlal Nehru, first PM of India.' },
  { name: 'Christmas', month: 11, day: 25, type: 'religious', description: 'Celebrates the birth of Jesus Christ.' },
];

// ────────────────────────────────────────────
// 2. VARIABLE HOLIDAY DATE TABLES [month0, day]
// ────────────────────────────────────────────

// Holi (Dhulandi) — Sources: Infoplease (2025-2030), EpicAstrology (2031-2048)
const HOLI: Record<number, [number, number]> = {
  2025: [2, 14], 2026: [2, 4], 2027: [2, 22], 2028: [2, 10], 2029: [1, 28], 2030: [2, 19],
  2031: [2, 9], 2032: [2, 27], 2033: [2, 16], 2034: [2, 5], 2035: [2, 24], 2036: [2, 12],
  2037: [2, 2], 2038: [2, 21], 2039: [2, 11], 2040: [2, 29], 2041: [2, 18], 2042: [2, 7],
  2043: [2, 26], 2044: [2, 14], 2045: [2, 3], 2046: [2, 22], 2047: [2, 12], 2048: [2, 1],
};

// Diwali — Sources: Testbook (2025-2043)
const DIWALI: Record<number, [number, number]> = {
  2025: [9, 21], 2026: [10, 8], 2027: [9, 29], 2028: [9, 17], 2029: [10, 5], 2030: [9, 26],
  2031: [10, 14], 2032: [10, 2], 2033: [9, 22], 2034: [10, 10], 2035: [9, 30],
  2036: [9, 19], 2037: [10, 7], 2038: [9, 27], 2039: [9, 17], 2040: [10, 4],
  2041: [9, 25], 2042: [10, 12], 2043: [10, 1],
};

// Maha Shivaratri — Sources: Infoplease (2015-2030)
const SHIVARATRI: Record<number, [number, number]> = {
  2015: [1, 17], 2016: [2, 7], 2017: [1, 24], 2018: [1, 13], 2019: [2, 5], 2020: [1, 21],
  2021: [2, 11], 2022: [1, 28], 2023: [1, 18], 2024: [2, 8],
  2025: [1, 25], 2026: [1, 15], 2027: [2, 6], 2028: [1, 23], 2029: [1, 11], 2030: [2, 2],
};

// Rama Navami — Sources: Infoplease (2015-2030)
const RAMA_NAVAMI: Record<number, [number, number]> = {
  2015: [2, 28], 2016: [3, 15], 2017: [3, 5], 2018: [2, 25], 2019: [3, 13], 2020: [3, 2],
  2021: [3, 21], 2022: [3, 10], 2023: [2, 30], 2024: [3, 16],
  2025: [3, 5], 2026: [2, 26], 2027: [3, 15], 2028: [3, 3], 2029: [3, 23], 2030: [3, 12],
};

// Navratri (Sharad, start date) — Sources: Infoplease (2015-2030)
const NAVRATRI: Record<number, [number, number]> = {
  2015: [9, 13], 2016: [9, 1], 2017: [8, 21], 2018: [9, 9], 2019: [8, 29], 2020: [9, 17],
  2021: [9, 6], 2022: [8, 26], 2023: [9, 15], 2024: [9, 3],
  2025: [8, 22], 2026: [9, 10], 2027: [8, 30], 2028: [8, 19], 2029: [9, 8], 2030: [8, 27],
};

// Raksha Bandhan — GrahaGuru 2026, approximate for other years via Metonic
const RAKSHA_BANDHAN: Record<number, [number, number]> = {
  2015: [7, 29], 2016: [7, 18], 2017: [7, 7], 2018: [7, 26], 2019: [7, 15], 2020: [7, 3],
  2021: [7, 22], 2022: [7, 11], 2023: [7, 30], 2024: [7, 19],
  2025: [7, 9], 2026: [7, 28], 2027: [7, 17], 2028: [7, 6], 2029: [7, 25], 2030: [7, 14],
};

// Janmashtami — GrahaGuru 2026, approximate for other years
const JANMASHTAMI: Record<number, [number, number]> = {
  2015: [8, 5], 2016: [7, 25], 2017: [7, 14], 2018: [8, 2], 2019: [7, 24], 2020: [7, 11],
  2021: [7, 30], 2022: [7, 19], 2023: [8, 6], 2024: [7, 26],
  2025: [7, 16], 2026: [8, 4], 2027: [7, 24], 2028: [7, 13], 2029: [8, 1], 2030: [7, 21],
};

// Ganesh Chaturthi — GrahaGuru 2026
const GANESH_CHATURTHI: Record<number, [number, number]> = {
  2015: [8, 17], 2016: [8, 5], 2017: [7, 25], 2018: [8, 13], 2019: [8, 2], 2020: [7, 22],
  2021: [8, 10], 2022: [7, 31], 2023: [8, 19], 2024: [8, 7],
  2025: [7, 27], 2026: [8, 16], 2027: [8, 6], 2028: [7, 25], 2029: [8, 13], 2030: [8, 3],
};

// Guru Nanak Jayanti — approximate
const GURU_NANAK: Record<number, [number, number]> = {
  2025: [10, 5], 2026: [10, 24], 2027: [10, 14], 2028: [10, 2], 2029: [10, 21], 2030: [10, 10],
};

// ────────────────────────────────────────────
// 3. ISLAMIC HOLIDAYS (known 2025-2030, computed beyond)
// ────────────────────────────────────────────
// Islamic year ≈ 354.36667 days → shifts ~10.876 days earlier per Gregorian year

interface IslamicBase { name: string; type: 'religious'; description: string; bases: Record<number, [number, number]> }

const ISLAMIC_HOLIDAYS: IslamicBase[] = [
  {
    name: 'Eid ul-Fitr', type: 'religious',
    description: 'Marks the end of Ramadan.',
    bases: {
      2025: [2, 31], 2026: [2, 20], 2027: [2, 10], 2028: [1, 27], 2029: [1, 15], 2030: [1, 5],
    },
  },
  {
    name: 'Eid ul-Adha (Bakrid)', type: 'religious',
    description: 'Islamic festival of sacrifice.',
    bases: {
      2025: [5, 7], 2026: [4, 27], 2027: [4, 17], 2028: [4, 5], 2029: [3, 24], 2030: [3, 14],
    },
  },
  {
    name: 'Muharram', type: 'religious',
    description: 'Islamic New Year, day of mourning.',
    bases: {
      2025: [5, 26], 2026: [5, 16], 2027: [5, 6], 2028: [4, 25], 2029: [4, 14], 2030: [4, 3],
    },
  },
  {
    name: 'Milad-un-Nabi', type: 'religious',
    description: 'Birthday of Prophet Muhammad.',
    bases: {
      2025: [8, 5], 2026: [7, 26], 2027: [7, 15], 2028: [7, 3], 2029: [6, 24], 2030: [6, 13],
    },
  },
];

const ISLAMIC_SHIFT_PER_YEAR = 10.876; // days earlier per Gregorian year

function computeIslamicDate(bases: Record<number, [number, number]>, year: number): [number, number] | null {
  if (bases[year]) return bases[year];

  // Find nearest known base year
  const knownYears = Object.keys(bases).map(Number).sort((a, b) => a - b);
  const nearest = knownYears.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );

  const [bm, bd] = bases[nearest];
  const baseDate = new Date(nearest, bm, bd);
  const shift = (year - nearest) * ISLAMIC_SHIFT_PER_YEAR;
  const targetMs = baseDate.getTime() - shift * 86400000;
  const target = new Date(targetMs);

  // Ensure we're in the correct year (±1 adjustment)
  if (target.getFullYear() !== year) {
    // If shifted to previous year, it means holiday occurs late in that year
    // or early next year — try adjusting by ±354 days
    const adjusted = new Date(targetMs + (year > target.getFullYear() ? 354.367 : -354.367) * 86400000);
    if (adjusted.getFullYear() === year) {
      return [adjusted.getMonth(), adjusted.getDate()];
    }
    return null; // Holiday doesn't occur in this year
  }

  return [target.getMonth(), target.getDate()];
}

// ────────────────────────────────────────────
// 4. GOOD FRIDAY (computed from Gregorian Easter)
// ────────────────────────────────────────────
function computeEaster(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month - 1, day]; // 0-indexed month
}

function getGoodFriday(year: number): [number, number] {
  const [em, ed] = computeEaster(year);
  const easter = new Date(year, em, ed);
  const goodFriday = new Date(easter.getTime() - 2 * 86400000);
  return [goodFriday.getMonth(), goodFriday.getDate()];
}

// ────────────────────────────────────────────
// 5. METONIC CYCLE HELPER (≈19-year repeat)
// ────────────────────────────────────────────
function metonicLookup(table: Record<number, [number, number]>, year: number): [number, number] | undefined {
  if (table[year]) return table[year];
  // Try Metonic offsets: ±19, ±38, ±57
  for (const offset of [19, 38, 57]) {
    if (table[year - offset]) return table[year - offset];
    if (table[year + offset]) return table[year + offset];
  }
  return undefined;
}

// ────────────────────────────────────────────
// 6. BUILD HOLIDAYS FOR A GIVEN YEAR
// ────────────────────────────────────────────
function buildVariableHolidays(year: number): IndianHoliday[] {
  const holidays: IndianHoliday[] = [];

  // Helper to push if date found
  const add = (name: string, table: Record<number, [number, number]>, type: IndianHoliday['type'], description: string) => {
    const d = metonicLookup(table, year);
    if (d) holidays.push({ name, month: d[0], day: d[1], type, description });
  };

  // Hindu festivals
  add('Maha Shivaratri', SHIVARATRI, 'religious', 'Night dedicated to Lord Shiva.');
  add('Holi', HOLI, 'religious', 'Festival of colours celebrating the arrival of spring.');
  add('Ram Navami', RAMA_NAVAMI, 'religious', 'Celebrates the birth of Lord Rama.');

  // Mahavir Jayanti ≈ Ram Navami + 5 days (approximate)
  const rnDate = metonicLookup(RAMA_NAVAMI, year);
  if (rnDate) {
    const rn = new Date(year, rnDate[0], rnDate[1] + 5);
    holidays.push({ name: 'Mahavir Jayanti', month: rn.getMonth(), day: rn.getDate(), type: 'religious', description: 'Birthday of Lord Mahavira, founder of Jainism.' });
  }

  // Buddha Purnima ≈ 6 weeks after Holi (approximate)
  const holiDate = metonicLookup(HOLI, year);
  if (holiDate) {
    const bp = new Date(year, holiDate[0], holiDate[1] + 60);
    holidays.push({ name: 'Buddha Purnima', month: bp.getMonth(), day: bp.getDate(), type: 'religious', description: 'Celebrates the birth of Gautama Buddha.' });
  }

  add('Raksha Bandhan', RAKSHA_BANDHAN, 'religious', 'Celebrates the bond between brothers and sisters.');
  add('Janmashtami', JANMASHTAMI, 'religious', 'Celebrates the birth of Lord Krishna.');
  add('Ganesh Chaturthi', GANESH_CHATURTHI, 'religious', 'Birthday of Lord Ganesha.');

  // Navratri & Dussehra
  const navDate = metonicLookup(NAVRATRI, year);
  if (navDate) {
    holidays.push({ name: 'Navratri Begins', month: navDate[0], day: navDate[1], type: 'religious', description: 'Nine nights dedicated to Goddess Durga.' });
    const dussehra = new Date(year, navDate[0], navDate[1] + 9);
    holidays.push({ name: 'Dussehra / Vijayadashami', month: dussehra.getMonth(), day: dussehra.getDate(), type: 'religious', description: 'Victory of good over evil; burning of Ravana effigies.' });
  }

  // Diwali & related
  const diwaliDate = metonicLookup(DIWALI, year);
  if (diwaliDate) {
    holidays.push({ name: 'Diwali', month: diwaliDate[0], day: diwaliDate[1], type: 'religious', description: "Festival of lights, one of India's biggest celebrations." });
    const gp = new Date(year, diwaliDate[0], diwaliDate[1] + 1);
    holidays.push({ name: 'Govardhan Puja', month: gp.getMonth(), day: gp.getDate(), type: 'religious', description: 'Day after Diwali, worship of Govardhan Hill.' });
    const bd = new Date(year, diwaliDate[0], diwaliDate[1] + 2);
    holidays.push({ name: 'Bhai Dooj', month: bd.getMonth(), day: bd.getDate(), type: 'religious', description: 'Celebrates the bond between brothers and sisters.' });
  }

  add('Guru Nanak Jayanti', GURU_NANAK, 'religious', 'Birthday of Guru Nanak, founder of Sikhism.');

  // Good Friday (computed)
  const [gfm, gfd] = getGoodFriday(year);
  holidays.push({ name: 'Good Friday', month: gfm, day: gfd, type: 'religious', description: 'Commemorates the crucifixion of Jesus Christ.' });

  // Islamic holidays (algorithmically computed)
  for (const ih of ISLAMIC_HOLIDAYS) {
    const d = computeIslamicDate(ih.bases, year);
    if (d) {
      holidays.push({ name: ih.name, month: d[0], day: d[1], type: ih.type, description: ih.description });
    }
  }

  return holidays;
}

// ────────────────────────────────────────────
// 7. CACHE & PUBLIC API
// ────────────────────────────────────────────
const yearCache = new Map<number, IndianHoliday[]>();

function getAllHolidaysForYear(year: number): IndianHoliday[] {
  if (yearCache.has(year)) return yearCache.get(year)!;

  const all = [...FIXED_HOLIDAYS, ...buildVariableHolidays(year)];
  yearCache.set(year, all);
  return all;
}

/** Get all holidays falling on a specific date */
export function getHolidaysForDate(date: Date): IndianHoliday[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return getAllHolidaysForYear(year).filter(h => h.month === month && h.day === day);
}

/** Check if a date is a holiday (for calendar modifiers) */
export function isHoliday(date: Date): boolean {
  return getHolidaysForDate(date).length > 0;
}

/** Get a set of "YYYY-MM-DD" strings for a given year (for calendar highlighting) */
export function getHolidayDatesSet(year?: number): Set<string> {
  const y = year ?? new Date().getFullYear();
  const set = new Set<string>();
  getAllHolidaysForYear(y).forEach(h => {
    const m = String(h.month + 1).padStart(2, '0');
    const d = String(h.day).padStart(2, '0');
    set.add(`${y}-${m}-${d}`);
  });
  return set;
}

/** Get upcoming holidays within N days from today */
export function getUpcomingHolidays(days: number = 30): (IndianHoliday & { date: Date })[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);

  // May span two years
  const years = new Set([today.getFullYear(), cutoff.getFullYear()]);
  const results: (IndianHoliday & { date: Date })[] = [];

  years.forEach(y => {
    getAllHolidaysForYear(y).forEach(h => {
      const date = new Date(y, h.month, h.day);
      if (date >= today && date <= cutoff) {
        results.push({ ...h, date });
      }
    });
  });

  // Deduplicate by name+date
  const seen = new Set<string>();
  return results
    .filter(h => {
      const key = `${h.name}-${h.date.getTime()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
