import type React from "react";
import type { CalendarDate } from "@internationalized/date";
import {
  Alert,
  Button,
  DateField,
  DateRangePicker,
  Label,
  RangeCalendar,
  ScrollShadow,
} from "@heroui/react";
import { ArrowDownUp } from "lucide-react";
import type { TrackWithAddedAt } from "@/shared/lib/spotify";
import type { SortOrder } from "@/hooks/use-date-filter";

type SelectDateStepProps = {
  dateRange: { startDate: CalendarDate; endDate: CalendarDate };
  onDateRangeChange: (value: { start: CalendarDate; end: CalendarDate } | null) => void;
  onApplyPreset: (months: number) => void;
  activePreset: number | null;
  dateError: string | null;
  filteredTracks: readonly TrackWithAddedAt[];
  sortOrder: SortOrder;
  onToggleSortOrder: () => void;
};

const PRESETS = [
  { label: "1ヶ月", months: 1 },
  { label: "3ヶ月", months: 3 },
  { label: "半年", months: 6 },
  { label: "1年", months: 12 },
] as const;

export const SelectDateStep: React.FC<SelectDateStepProps> = ({
  dateRange,
  onDateRangeChange,
  onApplyPreset,
  activePreset,
  dateError,
  filteredTracks,
  sortOrder,
  onToggleSortOrder,
}) => (
  <div className="flex h-full flex-col gap-6 py-6">
    <h2 className="text-xl font-bold">プレイリストに含める期間を選択</h2>
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.months}
          variant={activePreset === preset.months ? "primary" : "ghost"}
          size="sm"
          className={
            activePreset === preset.months ? "" : "bg-white/10 text-foreground hover:bg-white/20"
          }
          onPress={() => onApplyPreset(preset.months)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
    <DateRangePicker
      value={{ start: dateRange.startDate, end: dateRange.endDate }}
      onChange={onDateRangeChange}
    >
      <Label className="pl-2">期間</Label>
      <DateField.Group className="relative">
        <DateField.InputContainer>
          <DateField.Input slot="start">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateRangePicker.RangeSeparator />
          <DateField.Input slot="end">
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
        </DateField.InputContainer>
        <DateField.Suffix>
          <DateRangePicker.TriggerIndicator />
        </DateField.Suffix>
        <DateRangePicker.Trigger className="absolute inset-0 z-10 cursor-pointer opacity-0">
          <span className="sr-only">カレンダーを開く</span>
        </DateRangePicker.Trigger>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label="期間を選択">
          <RangeCalendar.Header>
            <RangeCalendar.YearPickerTrigger>
              <RangeCalendar.YearPickerTriggerHeading />
              <RangeCalendar.YearPickerTriggerIndicator />
            </RangeCalendar.YearPickerTrigger>
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
    {dateError && (
      <Alert status="danger" className="rounded-lg">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description className="text-sm">{dateError}</Alert.Description>
        </Alert.Content>
      </Alert>
    )}
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between pb-2">
        <p className="pl-2 text-sm text-text-subdued">
          <span className="font-semibold text-spotify-green">{filteredTracks.length}</span> 曲
        </p>
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          className="h-7 min-w-7 text-text-subdued hover:text-foreground"
          onPress={onToggleSortOrder}
          aria-label={sortOrder === "desc" ? "古い順に並び替え" : "新しい順に並び替え"}
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollShadow
        className="min-h-0 flex-1 flex-col gap-1 rounded-lg border border-border bg-card-bg p-2"
        orientation="vertical"
        size={5}
      >
        {filteredTracks.length === 0 ? (
          <p className="py-12 text-center text-text-subdued">指定期間内の曲がありません</p>
        ) : (
          filteredTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-card-bg-hover"
            >
              {track.albumImageUrl && (
                <img
                  src={track.albumImageUrl}
                  alt={track.albumName}
                  className="h-10 w-10 rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{track.name}</p>
                <p className="truncate text-xs text-text-subdued">{track.artists}</p>
              </div>
              <p className="shrink-0 text-xs tabular-nums text-text-subdued">
                {track.addedAt.toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </ScrollShadow>
    </div>
  </div>
);
