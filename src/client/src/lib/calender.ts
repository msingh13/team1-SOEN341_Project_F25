// src/lib/calendar.ts
export function downloadICS(opts: {
    title: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
  }) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
        d.getUTCHours()
      )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Campus Events//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(opts.start)}`,
      `DTEND:${fmt(opts.end)}`,
      `SUMMARY:${opts.title}`,
      `DESCRIPTION:${(opts.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${opts.location || ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event.ics";
    a.click();
    URL.revokeObjectURL(url);
  }
  