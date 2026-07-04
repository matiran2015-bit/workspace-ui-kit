"use client";

import { cn } from "@/lib/utils";
import {
  type ChartColor,
  type ProductProject,
  type ProjectPhase,
  type TimelineMonth,
} from "@/lib/data/schedule-demo";

const CHART_MARKER: Record<ChartColor, string> = {
  "chart-1": "bg-chart-1 border-chart-1 ring-chart-1/30",
  "chart-2": "bg-chart-2 border-chart-2 ring-chart-2/30",
  "chart-3": "bg-chart-3 border-chart-3 ring-chart-3/30",
  "chart-4": "bg-chart-4 border-chart-4 ring-chart-4/30",
  "chart-5": "bg-chart-5 border-chart-5 ring-chart-5/30",
};

const CHART_DOT: Record<ChartColor, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
};

type ProductProjectTimelineProps = {
  project: ProductProject;
  timelineMonths: TimelineMonth[];
  timelineYearLabel: string;
  selectedPhaseId?: string;
  onSelectPhase: (phaseId: string) => void;
};

function PhasePoint({
  phase,
  isSelected,
  onSelect,
  isLast,
}: {
  phase: ProjectPhase;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${phase.label}（${phase.pointLabel}）`}
      className={cn(
        "relative grid w-full grid-cols-[4.5rem_1.25rem_minmax(0,1fr)] items-start gap-2 rounded-lg border border-transparent px-2 py-2.5 text-left transition-colors hover:bg-background/80",
        isSelected && "border-border bg-background ring-1 ring-primary/30",
      )}
    >
      <span className="pt-0.5 text-[10px] font-semibold text-muted-foreground">
        {phase.pointLabel}
      </span>
      <span className="relative flex justify-center">
        {!isLast ? (
          <span
            className="absolute top-4 h-[calc(100%+0.75rem)] w-px bg-border"
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            "relative z-10 size-4 shrink-0 rounded-full border-2 border-background shadow-md ring-2",
            CHART_MARKER[phase.color],
          )}
          aria-hidden
        />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "truncate text-xs font-semibold",
            isSelected ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {phase.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          クリック → ④で年月入力
        </span>
      </span>
    </button>
  );
}

export function ProductProjectTimeline({
  project,
  timelineYearLabel,
  selectedPhaseId,
  onSelectPhase,
}: ProductProjectTimelineProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
          {timelineYearLabel}
        </span>
        <span
          className={cn("size-2.5 rounded-full", CHART_DOT[project.accentColor])}
          aria-hidden
        />
        <span className="text-[10px] text-muted-foreground">
          {project.name} — 縦型タイムライン
        </span>
      </div>

      <div className="rounded-xl border border-border bg-gradient-to-b from-muted/30 to-background p-3">
        <div className="flex flex-col gap-1">
          {project.phases.map((phase, index) => (
            <PhasePoint
              key={phase.id}
              phase={phase}
              isSelected={selectedPhaseId === phase.id}
              isLast={index === project.phases.length - 1}
              onSelect={() => onSelectPhase(phase.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
