"use client";

import {
  type CalendarDate,
  getLocalTimeZone,
  parseDate,
  today,
  toZoned,
} from "@internationalized/date";
import { createParser, parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs";
import {
  type DateRange,
  filterTracksByDateRange,
  type TrackWithAddedAt,
} from "@/shared/lib/spotify";
import type { DateRangeValidation } from "@/features/playlist-wizard/types/date-range-validation";

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

type DateFilter = {
  dateRange: { startDate: CalendarDate; endDate: CalendarDate };
  filteredTracks: readonly TrackWithAddedAt[];
  setDateRangeValue: (value: { start: CalendarDate; end: CalendarDate } | null) => void;
  handleApplyPreset: (months: number) => void;
  activePreset: number | null;
  validation: DateRangeValidation;
  sortOrder: SortOrder;
  handleToggleSortOrder: () => void;
};

const getDefaultDateRange = (): { startDate: CalendarDate; endDate: CalendarDate } => {
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

const parseDateRange = (start: CalendarDate, end: CalendarDate): DateRangeValidation => {
  if (start.compare(end) <= 0) {
    return { kind: "valid" };
  }
  return { kind: "invalid", message: "開始日は終了日以前に設定してください" };
};

export const useDateFilter = (allTracks: readonly TrackWithAddedAt[]): DateFilter => {
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

  const validation = parseDateRange(startDate, endDate);

  const setDateRangeValue = (value: { start: CalendarDate; end: CalendarDate } | null): void => {
    if (!value) return;
    void setState({ from: value.start, to: value.end, preset: null });
  };

  const handleApplyPreset = (months: number): void => {
    const end = today(getLocalTimeZone());
    const start = end.subtract({ months });
    void setState({ from: start, to: end, preset: months });
  };

  const handleToggleSortOrder = (): void => {
    void setState({ sort: sort === "asc" ? "desc" : "asc" });
  };

  return {
    dateRange: { startDate, endDate },
    filteredTracks,
    setDateRangeValue,
    handleApplyPreset,
    activePreset: preset,
    validation,
    sortOrder: sort,
    handleToggleSortOrder,
  };
};
