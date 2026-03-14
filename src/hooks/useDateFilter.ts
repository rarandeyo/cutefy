import { useState } from "react";
import { type CalendarDate, getLocalTimeZone, today, toZoned } from "@internationalized/date";
import { type DateRange, filterTracksByDateRange, type TrackWithAddedAt } from "@/lib/spotify";

export type SortOrder = "asc" | "desc";

const getDefaultDateRange = () => {
  const end = today(getLocalTimeZone());
  const start = end.subtract({ months: 1 });
  return { startDate: start, endDate: end };
};

const calendarDateToDate = (date: CalendarDate, endOfDay = false): Date => {
  const zoned = toZoned(date, getLocalTimeZone());
  const d = zoned.toDate();
  if (endOfDay) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  return d;
};

export const useDateFilter = (allTracks: TrackWithAddedAt[]) => {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [activePreset, setActivePreset] = useState<number | null>(1);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const nativeDateRange: DateRange = {
    startDate: calendarDateToDate(dateRange.startDate),
    endDate: calendarDateToDate(dateRange.endDate, true),
  };

  const filtered = filterTracksByDateRange(allTracks, nativeDateRange);
  const filteredTracks = filtered.toSorted((a, b) =>
    sortOrder === "asc"
      ? a.addedAt.getTime() - b.addedAt.getTime()
      : b.addedAt.getTime() - a.addedAt.getTime(),
  );

  const isDateRangeValid = dateRange.startDate.compare(dateRange.endDate) <= 0;
  const dateError = isDateRangeValid ? null : "開始日は終了日以前に設定してください";

  const setDateRangeValue = (value: { start: CalendarDate; end: CalendarDate } | null) => {
    if (value) {
      setDateRange({ startDate: value.start, endDate: value.end });
      setActivePreset(null);
    }
  };

  const applyPreset = (months: number) => {
    const end = today(getLocalTimeZone());
    const start = end.subtract({ months });
    setDateRange({ startDate: start, endDate: end });
    setActivePreset(months);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return {
    dateRange,
    filteredTracks,
    setDateRangeValue,
    applyPreset,
    activePreset,
    isDateRangeValid,
    dateError,
    sortOrder,
    toggleSortOrder,
  };
};
