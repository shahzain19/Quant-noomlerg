export interface MacroEvent {
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  importance: "high" | "medium" | "low";
  source: string;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay();
  let offset = weekday - dayOfWeek;
  if (offset < 0) offset += 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, month, day);
}

function lastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number
): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const d = new Date(year, month, lastDay);
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

function nthWeekdayAfter(
  refDate: Date,
  weekday: number,
  n: number
): Date {
  const d = new Date(refDate);
  let count = 0;
  while (true) {
    if (d.getDay() === weekday) {
      count++;
      if (count === n) return d;
    }
    d.setDate(d.getDate() + 1);
  }
}

function lastWeekdayAfter(refDate: Date, weekday: number): Date {
  const d = new Date(refDate);
  const month = d.getMonth();
  const year = d.getFullYear();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const result = new Date(year, month, lastDay);
  while (result.getDay() !== weekday) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

// --- FOMC Meeting Dates ---

const FOMC_DATES: Array<{ start: string; end: string }> = [
  { start: "2024-01-30", end: "2024-01-31" },
  { start: "2024-03-19", end: "2024-03-20" },
  { start: "2024-04-30", end: "2024-05-01" },
  { start: "2024-06-11", end: "2024-06-12" },
  { start: "2024-07-30", end: "2024-07-31" },
  { start: "2024-09-17", end: "2024-09-18" },
  { start: "2024-11-06", end: "2024-11-07" },
  { start: "2024-12-17", end: "2024-12-18" },
  { start: "2025-01-28", end: "2025-01-29" },
  { start: "2025-03-18", end: "2025-03-19" },
  { start: "2025-05-06", end: "2025-05-07" },
  { start: "2025-06-17", end: "2025-06-18" },
  { start: "2025-07-29", end: "2025-07-30" },
  { start: "2025-09-16", end: "2025-09-17" },
  { start: "2025-11-04", end: "2025-11-05" },
  { start: "2025-12-16", end: "2025-12-17" },
  { start: "2026-01-27", end: "2026-01-28" },
  { start: "2026-03-17", end: "2026-03-18" },
  { start: "2026-04-28", end: "2026-04-29" },
  { start: "2026-06-16", end: "2026-06-17" },
  { start: "2026-07-28", end: "2026-07-29" },
  { start: "2026-09-15", end: "2026-09-16" },
  { start: "2026-11-03", end: "2026-11-04" },
  { start: "2026-12-15", end: "2026-12-16" },
];

function buildFOMCEvents(): MacroEvent[] {
  const events: MacroEvent[] = [];

  for (const meeting of FOMC_DATES) {
    const endDate = new Date(meeting.end);
    const decisionDate = toISO(endDate);

    events.push({
      type: "fomc_decision",
      title: "FOMC Interest Rate Decision",
      description: "Federal Open Market Committee announces interest rate decision and monetary policy statement.",
      date: decisionDate,
      time: "14:00",
      importance: "high",
      source: "Federal Reserve",
    });

    const minutesDate = addDays(endDate, 21);
    events.push({
      type: "fomc_minutes",
      title: "FOMC Meeting Minutes",
      description: "Detailed minutes from the Federal Open Market Committee meeting released.",
      date: toISO(minutesDate),
      time: "14:00",
      importance: "medium",
      source: "Federal Reserve",
    });
  }

  return events;
}

// --- CPI Release Dates (2nd Tuesday) ---

function buildCPIEvents(): MacroEvent[] {
  const events: MacroEvent[] = [];

  for (let year = 2024; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const d = nthWeekdayOfMonth(year, month, 2, 2);
      const monthName = d.toLocaleString("en-US", { month: "long" });
      const releaseMonth = month === 0 ? 11 : month - 1;
      const releaseYear = month === 0 ? year - 1 : year;

      events.push({
        type: "cpi",
        title: "Consumer Price Index (CPI)",
        description: `CPI for ${new Date(releaseYear, releaseMonth).toLocaleString("en-US", { month: "long" })} ${releaseYear}. Measures change in prices paid by urban consumers for a market basket of goods and services.`,
        date: toISO(d),
        time: "08:30",
        importance: "high",
        source: "Bureau of Labor Statistics",
      });
    }
  }

  return events;
}

// --- Jobs Report (1st Friday) ---

function buildJobsReportEvents(): MacroEvent[] {
  const events: MacroEvent[] = [];

  for (let year = 2024; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const d = nthWeekdayOfMonth(year, month, 5, 1);
      const reportMonth = month === 0 ? 11 : month - 1;
      const reportYear = month === 0 ? year - 1 : year;

      events.push({
        type: "jobs_report",
        title: "Employment Situation (Jobs Report)",
        description: `Nonfarm payrolls, unemployment rate, and wage data for ${new Date(reportYear, reportMonth).toLocaleString("en-US", { month: "long" })} ${reportYear}.`,
        date: toISO(d),
        time: "08:30",
        importance: "high",
        source: "Bureau of Labor Statistics",
      });
    }
  }

  return events;
}

// --- GDP Releases ---

function buildGDPEvents(): MacroEvent[] {
  const events: MacroEvent[] = [];

  interface GDPRelease {
    quarter: string;
    year: number;
    releases: Array<{ monthOffset: number; label: string }>;
  }

  const gdpSchedule: GDPRelease[] = [
    {
      quarter: "Q1",
      year: 2024,
      releases: [
        { monthOffset: 3, label: "Advance Estimate" },
        { monthOffset: 4, label: "Second Estimate" },
        { monthOffset: 5, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q2",
      year: 2024,
      releases: [
        { monthOffset: 6, label: "Advance Estimate" },
        { monthOffset: 7, label: "Second Estimate" },
        { monthOffset: 8, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q3",
      year: 2024,
      releases: [
        { monthOffset: 9, label: "Advance Estimate" },
        { monthOffset: 10, label: "Second Estimate" },
        { monthOffset: 11, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q4",
      year: 2024,
      releases: [
        { monthOffset: 12, label: "Advance Estimate" },
        { monthOffset: 13, label: "Second Estimate" },
        { monthOffset: 14, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q1",
      year: 2025,
      releases: [
        { monthOffset: 3, label: "Advance Estimate" },
        { monthOffset: 4, label: "Second Estimate" },
        { monthOffset: 5, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q2",
      year: 2025,
      releases: [
        { monthOffset: 6, label: "Advance Estimate" },
        { monthOffset: 7, label: "Second Estimate" },
        { monthOffset: 8, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q3",
      year: 2025,
      releases: [
        { monthOffset: 9, label: "Advance Estimate" },
        { monthOffset: 10, label: "Second Estimate" },
        { monthOffset: 11, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q4",
      year: 2025,
      releases: [
        { monthOffset: 12, label: "Advance Estimate" },
        { monthOffset: 13, label: "Second Estimate" },
        { monthOffset: 14, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q1",
      year: 2026,
      releases: [
        { monthOffset: 3, label: "Advance Estimate" },
        { monthOffset: 4, label: "Second Estimate" },
        { monthOffset: 5, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q2",
      year: 2026,
      releases: [
        { monthOffset: 6, label: "Advance Estimate" },
        { monthOffset: 7, label: "Second Estimate" },
        { monthOffset: 8, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q3",
      year: 2026,
      releases: [
        { monthOffset: 9, label: "Advance Estimate" },
        { monthOffset: 10, label: "Second Estimate" },
        { monthOffset: 11, label: "Third Estimate (Final)" },
      ],
    },
    {
      quarter: "Q4",
      year: 2026,
      releases: [
        { monthOffset: 12, label: "Advance Estimate" },
        { monthOffset: 13, label: "Second Estimate" },
        { monthOffset: 14, label: "Third Estimate (Final)" },
      ],
    },
  ];

  for (const gdp of gdpSchedule) {
    for (const rel of gdp.releases) {
      const quarterEndMonth = gdp.quarter === "Q1" ? 2 : gdp.quarter === "Q2" ? 5 : gdp.quarter === "Q3" ? 8 : 11;
      const releaseDate = new Date(gdp.year, quarterEndMonth + rel.monthOffset, 1);

      const d = lastWeekdayOfMonth(
        releaseDate.getFullYear(),
        releaseDate.getMonth(),
        5
      );

      events.push({
        type: "gdp",
        title: `Gross Domestic Product (GDP) - ${gdp.year} ${gdp.quarter}`,
        description: `${rel.label} for ${gdp.year} ${gdp.quarter} GDP. Bureau of Economic Analysis estimates of economic growth.`,
        date: toISO(d),
        time: "08:30",
        importance: "high",
        source: "Bureau of Economic Analysis",
      });
    }
  }

  return events;
}

// --- PCE Release (last Friday of month) ---

function buildPCEEvents(): MacroEvent[] {
  const events: MacroEvent[] = [];

  for (let year = 2024; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      const d = lastWeekdayOfMonth(year, month, 5);
      const releaseMonth = month === 0 ? 11 : month - 1;
      const releaseYear = month === 0 ? year - 1 : year;

      events.push({
        type: "pce",
        title: "Personal Consumption Expenditures (PCE) Price Index",
        description: `PCE Price Index and Core PCE for ${new Date(releaseYear, releaseMonth).toLocaleString("en-US", { month: "long" })} ${releaseYear}. The Fed's preferred inflation measure.`,
        date: toISO(d),
        time: "08:30",
        importance: "high",
        source: "Bureau of Economic Analysis",
      });
    }
  }

  return events;
}

export function generateMacroCalendar(
  startDate?: string,
  endDate?: string
): MacroEvent[] {
  const allEvents = [
    ...buildFOMCEvents(),
    ...buildCPIEvents(),
    ...buildJobsReportEvents(),
    ...buildGDPEvents(),
    ...buildPCEEvents(),
  ];

  const start = startDate ? new Date(startDate) : new Date("2024-01-01");
  const end = endDate ? new Date(endDate) : new Date("2026-12-31");

  const filtered = allEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= start && eventDate <= end;
  });

  return filtered.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
}
