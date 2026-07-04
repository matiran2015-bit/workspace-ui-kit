"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  rangeBarStyle,
  type ChartColor,
  type GroupEvent,
  type TimelineMonth,
} from "@/lib/data/schedule-demo";

const CHART_BAR: Record<ChartColor, string> = {
  "chart-1": "bg-chart-1 text-primary-foreground border-chart-1/70",
  "chart-2": "bg-chart-2 text-primary-foreground border-chart-2/70",
  "chart-3": "bg-chart-3 text-primary-foreground border-chart-3/70",
  "chart-4": "bg-chart-4 text-primary-foreground border-chart-4/70",
  "chart-5": "bg-chart-5 text-primary-foreground border-chart-5/70",
};

function productTagLabel(tag: GroupEvent["productTag"]) {
  if (tag === "both") return "I / H";
  return tag;
}

type GroupEventGanttProps = {
  events: GroupEvent[];
  timelineMonths: TimelineMonth[];
  timelineYearLabel: string;
  projectName: string;
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
};

function EventBar({
  event,
  timelineMonths,
  isSelected,
  onSelect,
}: {
  event: GroupEvent;
  timelineMonths: TimelineMonth[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { left, width } = rangeBarStyle(
    event.startKey,
    event.endKey,
    timelineMonths,
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${event.title}（${event.periodLabel}）`}
      className={cn(
        "absolute top-1/2 flex h-7 min-w-[2rem] -translate-y-1/2 items-center justify-center rounded-md border px-1.5 text-[9px] font-bold shadow-sm transition-all hover:brightness-110",
        CHART_BAR[event.color],
        isSelected && "z-10 ring-2 ring-foreground/35 ring-offset-2 ring-offset-background",
      )}
      style={{ left, width }}
    >
      <span className="truncate drop-shadow-sm">{event.date}</span>
    </button>
  );
}

export function GroupEventGantt({
  events,
  timelineMonths,
  timelineYearLabel,
  projectName,
  selectedEventId,
  onSelectEvent,
}: GroupEventGanttProps) {
  const colCount = timelineMonths.length;
  const labelWidth = "9.5rem";

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
        {projectName
          ? `${projectName} に関連するグループイベントはありません。`
          : "表示するイベントがありません。"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
          {timelineYearLabel}
        </span>
        {projectName ? (
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium">
            {projectName} に連動
          </span>
        ) : null}
        <span className="text-[10px] text-muted-foreground">
          ①と同じ月軸 — 横棒をクリック → ④で詳細
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-gradient-to-b from-muted/30 to-background p-3">
        <div
          className="grid min-w-[640px] gap-y-1"
          style={{
            gridTemplateColumns: `${labelWidth} repeat(${colCount}, minmax(2.5rem, 1fr))`,
          }}
        >
          <div aria-hidden />
          {timelineMonths.map((m) => (
            <div
              key={m.key}
              className="flex flex-col items-center justify-center rounded-t-md border border-b-0 border-border/70 bg-muted/50 py-0.5"
            >
              {m.month === 1 ? (
                <span className="text-[9px] font-bold text-primary">{m.year}年</span>
              ) : null}
              <span className="text-[10px] font-bold">{m.label}</span>
            </div>
          ))}

          {events.map((event) => (
            <div key={event.id} className="contents">
              <button
                type="button"
                onClick={() => onSelectEvent(event.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:bg-background/80",
                  selectedEventId === event.id &&
                    "border-border bg-background ring-1 ring-primary/30",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight">
                  {event.title}
                </span>
                <Badge variant="outline" className="shrink-0 text-[9px]">
                  {productTagLabel(event.productTag)}
                </Badge>
              </button>

              <div
                className="relative col-span-1 min-h-10 rounded-md border border-border/60 bg-background/70"
                style={{ gridColumn: `2 / span ${colCount}` }}
              >
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
                >
                  {timelineMonths.map((m) => (
                    <div
                      key={m.key}
                      className="border-l border-dashed border-border/30 first:border-l-0"
                    />
                  ))}
                </div>
                <EventBar
                  event={event}
                  timelineMonths={timelineMonths}
                  isSelected={selectedEventId === event.id}
                  onSelect={() => onSelectEvent(event.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
