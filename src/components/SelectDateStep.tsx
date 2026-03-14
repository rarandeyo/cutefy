import type React from "react";
import { ScrollShadow } from "@heroui/react";
import type { DateRange, TrackWithAddedAt } from "@/lib/spotify";
import { StepNav } from "@/components/StepNav";

type SelectDateStepProps = {
  dateRange: DateRange;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  filteredTracks: TrackWithAddedAt[];
  onBack: () => void;
  onNext: () => void;
};

const formatDateForInput = (date: Date): string => date.toISOString().split("T")[0] ?? "";

export const SelectDateStep: React.FC<SelectDateStepProps> = ({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  filteredTracks,
  onBack,
  onNext,
}) => (
  <div className="flex flex-col gap-6 py-6">
    <div>
      <h2 className="text-xl font-bold">期間を選択して曲を確認</h2>
      <p className="mt-1 text-sm text-text-subdued">プレイリストに含める曲の追加期間を指定</p>
    </div>
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="startDate" className="text-sm font-medium text-text-subdued">
          開始日
        </label>
        <input
          type="date"
          id="startDate"
          value={formatDateForInput(dateRange.startDate)}
          onChange={(e) => onStartDateChange(new Date(e.target.value))}
          className="rounded-lg border border-border bg-card-bg px-4 py-2.5 text-foreground transition-colors focus:border-spotify-green focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="endDate" className="text-sm font-medium text-text-subdued">
          終了日
        </label>
        <input
          type="date"
          id="endDate"
          value={formatDateForInput(dateRange.endDate)}
          onChange={(e) => onEndDateChange(new Date(e.target.value))}
          className="rounded-lg border border-border bg-card-bg px-4 py-2.5 text-foreground transition-colors focus:border-spotify-green focus:outline-none"
        />
      </div>
      <p className="text-sm text-text-subdued md:pb-1">
        <span className="font-semibold text-foreground">{filteredTracks.length}</span> 曲
      </p>
    </div>
    <ScrollShadow
      className="flex flex-col gap-1 rounded-lg border border-border bg-card-bg p-2"
      style={{ maxHeight: "calc(100vh - 420px)" }}
      orientation="vertical"
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
              <img src={track.albumImageUrl} alt={track.albumName} className="h-10 w-10 rounded" />
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
    <StepNav onBack={onBack} onNext={onNext} nextDisabled={filteredTracks.length === 0} />
  </div>
);
