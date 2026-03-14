import { useState } from "react";
import { type DateRange, filterTracksByDateRange, type TrackWithAddedAt } from "@/lib/spotify";

const getDefaultDateRange = (): DateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  return { startDate, endDate };
};

export const useDateFilter = (allTracks: TrackWithAddedAt[]) => {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  const filteredTracks = filterTracksByDateRange(allTracks, dateRange);

  const setStartDate = (date: Date) =>
    setDateRange((prev) => ({ ...prev, startDate: date }));

  const setEndDate = (date: Date) =>
    setDateRange((prev) => ({ ...prev, endDate: date }));

  return { dateRange, filteredTracks, setStartDate, setEndDate };
};
