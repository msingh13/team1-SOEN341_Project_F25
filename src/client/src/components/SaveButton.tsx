// Save = download .ics to the user's calendar (no server)
// Requires: title, start, optional end/location/description

import { downloadICS } from "../lib/calender";

interface Props {
  eventId: string | number;
  title: string;
  startISO: string;
  endISO?: string;
  location?: string;
  description?: string;
}

export default function SaveButton({
  eventId,
  title,
  startISO,
  endISO,
  location,
  description,
}: Props) {
  const onClick = () => {
    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : new Date(start.getTime() + 60 * 60 * 1000);
    downloadICS({
      title,
      description: description || "",
      location: location || "",
      start,
      end,
      id: eventId,
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost"
      title="Add to calendar"
    >
      Save (Calendar)
    </button>
  );
}
