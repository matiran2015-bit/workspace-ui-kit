"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  ListTodo,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DEPARTMENT_TASKS,
  GROUP_EVENTS,
  PRODUCT_PROJECTS,
  applyScheduleToPhase,
  buildTimelineMonths,
  buildTimelineYearLabel,
  filterGroupEventsForProject,
  phaseToSchedulePoint,
  type PhaseSchedulePoint,
  type ScheduleSelection,
} from "@/lib/data/schedule-demo";
import { GroupEventGantt } from "@/components/workspace/GroupEventGantt";
import { PhaseScheduleEditor } from "@/components/workspace/PhaseScheduleEditor";
import { ProductProjectTimeline } from "@/components/workspace/ProductProjectTimeline";

const STATUS_VARIANT = {
  未着手: "outline",
  進行中: "default",
  完了: "secondary",
} as const;

const COLLAPSED_WIDTH = "2.75rem";

function PaneCollapseHeader({
  icon,
  title,
  open,
  onToggle,
  collapseTo,
}: {
  icon: ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  collapseTo: "left" | "right";
}) {
  const CollapseIcon = collapseTo === "left" ? ChevronLeft : ChevronRight;
  const ExpandIcon = collapseTo === "left" ? ChevronRight : ChevronLeft;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <h2 className="truncate text-xs font-semibold">{title}</h2>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? (
          <>
            <CollapseIcon className="size-4" aria-hidden />
            閉じる
          </>
        ) : (
          <>
            <ExpandIcon className="size-4" aria-hidden />
            開く
          </>
        )}
      </Button>
    </div>
  );
}

function CollapsedPaneStrip({
  icon,
  label,
  onOpen,
  edge,
}: {
  icon: ReactNode;
  label: string;
  onOpen: () => void;
  edge: "left" | "right";
}) {
  const ExpandIcon = edge === "left" ? ChevronRight : ChevronLeft;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col items-center gap-2 py-3",
        edge === "left" ? "border-r border-border" : "border-l border-border",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 shrink-0"
        onClick={onOpen}
        aria-label={`${label}を開く`}
      >
        <ExpandIcon className="size-4" aria-hidden />
      </Button>
      {icon}
      <span
        className="text-[10px] font-semibold text-muted-foreground"
        style={{ writingMode: "vertical-rl" }}
      >
        {label}
      </span>
    </div>
  );
}

function HorizontalCollapsiblePane({
  open,
  onToggle,
  collapseTo,
  icon,
  title,
  shortLabel,
  className,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  collapseTo: "left" | "right";
  icon: ReactNode;
  title: string;
  shortLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const edge = collapseTo;

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 overflow-hidden transition-[flex-basis,width] duration-200",
        open && "min-h-0 flex-1",
        !open && "shrink-0",
        !open && collapseTo === "right" && "ml-auto",
        className,
      )}
      style={open ? undefined : { width: COLLAPSED_WIDTH, flexBasis: COLLAPSED_WIDTH }}
    >
      {!open ? (
        <CollapsedPaneStrip
          icon={icon}
          label={shortLabel}
          onOpen={onToggle}
          edge={edge}
        />
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-4 py-2">
            <PaneCollapseHeader
              icon={icon}
              title={title}
              open={open}
              onToggle={onToggle}
              collapseTo={collapseTo}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">{children}</div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_PHASE_BY_PROJECT: Record<string, string> = {
  "project-i": "i-proposal",
  "project-h": "h-proposal",
};

export function ScheduleWorkspace() {
  const [activeProjectId, setActiveProjectId] = useState("project-i");
  const [lastPhaseByProject, setLastPhaseByProject] = useState(
    DEFAULT_PHASE_BY_PROJECT,
  );

  const [selection, setSelection] = useState<ScheduleSelection>({
    pane: "product",
    id: "project-i",
    phaseId: "i-proposal",
  });

  const [phaseSchedules, setPhaseSchedules] = useState<
    Record<string, PhaseSchedulePoint>
  >({});

  const [pane1Open, setPane1Open] = useState(true);
  const [pane2Open, setPane2Open] = useState(true);
  const [pane3Open, setPane3Open] = useState(true);
  const [pane4Open, setPane4Open] = useState(true);

  const getPhasePoint = useCallback(
    (phaseId: string, defaults: PhaseSchedulePoint) =>
      phaseSchedules[phaseId] ?? defaults,
    [phaseSchedules],
  );

  const effectiveProjects = useMemo(
    () =>
      PRODUCT_PROJECTS.map((project) => ({
        ...project,
        phases: project.phases.map((phase) => {
          const defaults = phaseToSchedulePoint(phase);
          const point = getPhasePoint(phase.id, defaults);
          return applyScheduleToPhase(phase, point);
        }),
      })),
    [getPhasePoint],
  );

  const activeProject = useMemo(
    () =>
      effectiveProjects.find((p) => p.id === activeProjectId) ??
      effectiveProjects[0],
    [effectiveProjects, activeProjectId],
  );

  const timelineMonths = useMemo(
    () => (activeProject ? buildTimelineMonths([activeProject]) : []),
    [activeProject],
  );

  const timelineYearLabel = useMemo(
    () => buildTimelineYearLabel(timelineMonths),
    [timelineMonths],
  );

  const activeGroupEvents = useMemo(
    () => filterGroupEventsForProject(GROUP_EVENTS, activeProjectId),
    [activeProjectId],
  );

  const switchProjectTab = useCallback(
    (projectId: string) => {
      setActiveProjectId(projectId);
      const phaseId =
        lastPhaseByProject[projectId] ??
        PRODUCT_PROJECTS.find((p) => p.id === projectId)?.phases[0]?.id;
      setSelection({
        pane: "product",
        id: projectId,
        phaseId,
      });
    },
    [lastPhaseByProject],
  );

  const selectedPhaseContext = useMemo(() => {
    if (selection.pane !== "product" || !selection.phaseId) return null;
    const project = PRODUCT_PROJECTS.find((p) => p.id === selection.id);
    if (!project) return null;
    const basePhase = project.phases.find((p) => p.id === selection.phaseId);
    if (!basePhase) return null;
    const defaults = phaseToSchedulePoint(basePhase);
    const point = getPhasePoint(basePhase.id, defaults);
    const effective = applyScheduleToPhase(basePhase, point);
    return { project, basePhase, point, effective };
  }, [selection, getPhasePoint]);

  const updatePhaseSchedule = useCallback(
    (phaseId: string, next: PhaseSchedulePoint) => {
      setPhaseSchedules((prev) => ({ ...prev, [phaseId]: next }));
    },
    [],
  );

  const detail = useMemo(() => {
    if (selection.pane === "product") {
      const item = PRODUCT_PROJECTS.find((p) => p.id === selection.id);
      if (!item) return null;
      if (selectedPhaseContext) {
        const { effective, project } = selectedPhaseContext;
        return {
          label: `製品プロジェクト › ${project.name} › ${effective.label}`,
          title: effective.label,
          rows: [
            { k: "製品", v: project.name },
            { k: "フェーズ概要", v: project.detail.phase },
            { k: "関係部門", v: project.detail.departments },
            { k: "メモ", v: project.detail.note },
          ],
          showPhaseEditor: true as const,
        };
      }
      return {
        label: `製品プロジェクト › ${item.name}`,
        title: item.name,
        rows: [
          { k: "フェーズ", v: item.detail.phase },
          { k: "関係部門", v: item.detail.departments },
          { k: "メモ", v: item.detail.note },
        ],
        showPhaseEditor: false as const,
      };
    }
    if (selection.pane === "group") {
      const item = GROUP_EVENTS.find((e) => e.id === selection.id);
      if (!item) return null;
      return {
        label: `トナーグループ › ${item.title}（${item.date}）`,
        title: item.title,
        rows: [
          { k: "期間", v: item.periodLabel },
          { k: "日付", v: item.date },
          { k: "影響製品", v: item.detail.impact },
          { k: "担当窓口", v: item.detail.owner },
          { k: "メモ", v: item.detail.note },
        ],
        showPhaseEditor: false as const,
      };
    }
    const item = DEPARTMENT_TASKS.find((t) => t.id === selection.id);
    if (!item) return null;
    return {
      label: `自部門タスク › ${item.title}`,
      title: item.title,
      rows: [
        { k: "期限", v: item.due },
        { k: "ステータス", v: item.status },
        { k: "担当", v: item.detail.assignee },
        { k: "ブロッカー", v: item.detail.blocker },
        { k: "メモ", v: item.detail.note },
      ],
      showPhaseEditor: false as const,
    };
  }, [selection, selectedPhaseContext]);

  const isSelected = (pane: ScheduleSelection["pane"], id: string) =>
    selection.pane === pane && selection.id === id;

  const mainColumns = [
    pane1Open ? "minmax(0,1fr)" : COLLAPSED_WIDTH,
    pane2Open ? "minmax(0,1fr)" : COLLAPSED_WIDTH,
    pane3Open || pane4Open ? "minmax(18rem,0.85fr)" : COLLAPSED_WIDTH,
  ].join(" ");

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <CalendarRange className="size-5 text-primary" aria-hidden />
        <h1 className="text-sm font-semibold">製品プロジェクト・スケジュール俯瞰</h1>
        <Badge variant="outline" className="ml-auto text-[10px]">
          開発部（ダミー）
        </Badge>
      </header>

      <main
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateColumns: mainColumns }}
      >
        <HorizontalCollapsiblePane
          open={pane1Open}
          onToggle={() => setPane1Open((o) => !o)}
          collapseTo="left"
          icon={<Layers className="size-4 text-primary" aria-hidden />}
          title="① 製品プロジェクト"
          shortLabel="① 製品"
          className="border-r border-border bg-card"
        >
          <div
            className="mb-3 flex w-fit gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5"
            role="tablist"
            aria-label="製品プロジェクトの選択"
          >
            {PRODUCT_PROJECTS.map((p) => (
              <Button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={activeProjectId === p.id}
                variant={activeProjectId === p.id ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => switchProjectTab(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </div>

          {activeProject ? (
            <ProductProjectTimeline
              project={activeProject}
              timelineMonths={timelineMonths}
              timelineYearLabel={timelineYearLabel}
              selectedPhaseId={
                selection.pane === "product" && selection.id === activeProjectId
                  ? selection.phaseId
                  : undefined
              }
              onSelectPhase={(phaseId) => {
                setLastPhaseByProject((prev) => ({
                  ...prev,
                  [activeProjectId]: phaseId,
                }));
                setSelection({
                  pane: "product",
                  id: activeProjectId,
                  phaseId,
                });
              }}
            />
          ) : null}
        </HorizontalCollapsiblePane>

        <HorizontalCollapsiblePane
          open={pane2Open}
          onToggle={() => setPane2Open((o) => !o)}
          collapseTo="left"
          icon={<Users className="size-4 text-primary" aria-hidden />}
          title="② トナーグループ スケジュール"
          shortLabel="② グループ"
          className="border-r border-border bg-muted/30"
        >
          <GroupEventGantt
            events={activeGroupEvents}
            timelineMonths={timelineMonths}
            timelineYearLabel={timelineYearLabel}
            projectName={activeProject?.name ?? ""}
            selectedEventId={
              selection.pane === "group" ? selection.id : undefined
            }
            onSelectEvent={(id) => setSelection({ pane: "group", id })}
          />
        </HorizontalCollapsiblePane>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <HorizontalCollapsiblePane
            open={pane3Open}
            onToggle={() => setPane3Open((o) => !o)}
            collapseTo="right"
            icon={<ListTodo className="size-4 text-primary" aria-hidden />}
            title="③ 自部門タスク"
            shortLabel="③ タスク"
            className="border-b border-border bg-background"
          >
            <ul className="flex flex-col gap-0 rounded-lg border border-border">
              {DEPARTMENT_TASKS.map((task, index) => (
                <li key={task.id}>
                  {index > 0 ? <Separator className="my-0" /> : null}
                  <button
                    type="button"
                    onClick={() => setSelection({ pane: "task", id: task.id })}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs hover:bg-muted/50",
                      isSelected("task", task.id) &&
                        "bg-muted ring-1 ring-inset ring-primary/30",
                    )}
                  >
                    <span className="font-medium">{task.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {task.due}
                      </span>
                      <Badge
                        variant={STATUS_VARIANT[task.status]}
                        className="text-[10px]"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </HorizontalCollapsiblePane>

          <HorizontalCollapsiblePane
            open={pane4Open}
            onToggle={() => setPane4Open((o) => !o)}
            collapseTo="right"
            icon={<FileText className="size-4 text-primary" aria-hidden />}
            title="④ 選択項目の詳細"
            shortLabel="④ 詳細"
            className="bg-card"
          >
            <Card className="border-border bg-background shadow-none">
              {detail ? (
                <>
                  <CardHeader className="gap-1 px-4 py-3">
                    <p className="truncate text-[11px] font-medium text-primary">
                      {detail.label}
                    </p>
                    <CardTitle className="text-sm">{detail.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-0">
                    {detail.showPhaseEditor && selectedPhaseContext ? (
                      <PhaseScheduleEditor
                        phaseLabel={selectedPhaseContext.effective.label}
                        point={selectedPhaseContext.point}
                        onChange={(next) =>
                          updatePhaseSchedule(
                            selectedPhaseContext.basePhase.id,
                            next,
                          )
                        }
                      />
                    ) : null}
                    {detail.rows.map((row) => (
                      <div key={row.k} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {row.k}
                        </span>
                        <span className="text-xs leading-relaxed">{row.v}</span>
                      </div>
                    ))}
                  </CardContent>
                </>
              ) : (
                <CardContent className="px-4 py-6 text-xs text-muted-foreground">
                  ①②③のいずれかを選ぶと、詳細が表示されます。
                </CardContent>
              )}
            </Card>
          </HorizontalCollapsiblePane>
        </div>
      </main>
    </div>
  );
}
