"use client";

import {
  type CalendarDate,
  getLocalTimeZone,
  parseDate,
  today,
  toZoned,
} from "@internationalized/date";
import { createParser, parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs";
import { type DateRange, filterTracksByDateRange, type TrackWithAddedAt } from "@/lib/spotify";

export type SortOrder = "asc" | "desc";

const parseAsCalendarDate = createParser<CalendarDate>({
  parse(value) {
    try {
      return parseDate(value);
    } catch {
      return null;
    }
  },
  serialize(value) {
    return value.toString();
  },
});

const filterParsers = {
  from: parseAsCalendarDate,
  to: parseAsCalendarDate,
  sort: parseAsStringEnum<SortOrder>(["asc", "desc"]).withDefault("asc"),
  preset: parseAsInteger,
};

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
  const [{ from, to, sort, preset }, setState] = useQueryStates(filterParsers);

  const defaults = getDefaultDateRange();
  const startDate = from ?? defaults.startDate;
  const endDate = to ?? defaults.endDate;

  const nativeDateRange: DateRange = {
    startDate: calendarDateToDate(startDate),
    endDate: calendarDateToDate(endDate, true),
  };

  const filteredTracks = filterTracksByDateRange(allTracks, nativeDateRange).toSorted((a, b) =>
    sort === "asc"
      ? a.addedAt.getTime() - b.addedAt.getTime()
      : b.addedAt.getTime() - a.addedAt.getTime(),
  );

  const isDateRangeValid = startDate.compare(endDate) <= 0;
  const dateError = isDateRangeValid ? null : "開始日は終了日以前に設定してください";

  const setDateRangeValue = (value: { start: CalendarDate; end: CalendarDate } | null) => {
    if (!value) return;
    void setState({ from: value.start, to: value.end, preset: null });
  };

  const applyPreset = (months: number) => {
    const end = today(getLocalTimeZone());
    const start = end.subtract({ months });
    void setState({ from: start, to: end, preset: months });
  };

  const toggleSortOrder = () => {
    void setState({ sort: sort === "asc" ? "desc" : "asc" });
  };

  return {
    dateRange: { startDate, endDate },
    filteredTracks,
    setDateRangeValue,
    applyPreset,
    activePreset: preset,
    isDateRangeValid,
    dateError,
    sortOrder: sort,
    toggleSortOrder,
  };
};
