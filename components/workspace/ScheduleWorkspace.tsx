"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  ListTodo,
  Plus,
  Trash2,
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
  buildProductProjectFromMeta,
  buildTimelineMonths,
  buildTimelineYearLabel,
  filterGroupEventsForProject,
  formatPeriodLabel,
  phaseToSchedulePoint,
  projectTagFromId,
  type DepartmentTask,
  type GroupEvent,
  type PhaseDefinition,
  type PhaseSchedulePoint,
  type ProductProject,
  type ScheduleSelection,
} from "@/lib/data/schedule-demo";
import { DepartmentTaskEditor } from "@/components/workspace/DepartmentTaskEditor";
import { DeleteConfirmDialog } from "@/components/workspace/DeleteConfirmDialog";
import { GroupEventEditor } from "@/components/workspace/GroupEventEditor";
import { GroupEventGantt } from "@/components/workspace/GroupEventGantt";
import {
  PhaseScheduleEditor,
  type PhaseEditorValue,
} from "@/components/workspace/PhaseScheduleEditor";
import { ProductProjectEditor } from "@/components/workspace/ProductProjectEditor";
import { ProductProjectTimeline } from "@/components/workspace/ProductProjectTimeline";

const STATUS_VARIANT = {
  未着手: "outline",
  進行中: "default",
  完了: "secondary",
} as const;

const COLLAPSED_WIDTH = "2.75rem";

type DeleteTarget =
  | { kind: "project"; id: string; name: string }
  | { kind: "group"; id: string; name: string }
  | { kind: "task"; id: string; name: string };

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

function projectMeta(project: ProductProject) {
  return {
    id: project.id,
    name: project.name,
    accentColor: project.accentColor,
    detail: project.detail,
  };
}

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
  const [phaseDefinitions, setPhaseDefinitions] = useState<
    Record<string, PhaseDefinition>
  >({});
  const [productProjects, setProductProjects] =
    useState<ProductProject[]>(PRODUCT_PROJECTS);
  const [groupEvents, setGroupEvents] = useState<GroupEvent[]>(GROUP_EVENTS);
  const [departmentTasks, setDepartmentTasks] =
    useState<DepartmentTask[]>(DEPARTMENT_TASKS);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/schedule");
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "読み込みに失敗しました");
        }
        const data = (await res.json()) as {
          productProjects: ProductProject[];
          phaseSchedules: Record<string, PhaseSchedulePoint>;
          phaseDefinitions: Record<string, PhaseDefinition>;
          groupEvents: GroupEvent[];
          departmentTasks: DepartmentTask[];
        };
        if (cancelled) return;
        setProductProjects(data.productProjects);
        setPhaseSchedules(data.phaseSchedules);
        setPhaseDefinitions(data.phaseDefinitions);
        setGroupEvents(data.groupEvents);
        setDepartmentTasks(data.departmentTasks);
        setLoadState("ready");
      } catch (error) {
        if (cancelled) return;
        setLoadState("error");
        setSaveError(
          error instanceof Error ? error.message : "読み込みに失敗しました",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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
      productProjects.map((project) =>
        buildProductProjectFromMeta(
          projectMeta(project),
          phaseSchedules,
          phaseDefinitions,
        ),
      ),
    [productProjects, phaseSchedules, phaseDefinitions],
  );

  const productTags = useMemo(
    () => [
      ...productProjects.map((p) => projectTagFromId(p.id)),
      "both",
    ],
    [productProjects],
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
    () => filterGroupEventsForProject(groupEvents, activeProjectId),
    [groupEvents, activeProjectId],
  );

  const switchProjectTab = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    setSelection({
      pane: "product",
      id: projectId,
    });
  }, []);

  const selectedPhaseContext = useMemo(() => {
    if (selection.pane !== "product" || !selection.phaseId) return null;
    const project = effectiveProjects.find((p) => p.id === selection.id);
    if (!project) return null;
    const basePhase = project.phases.find((p) => p.id === selection.phaseId);
    if (!basePhase) return null;
    const defaults = phaseToSchedulePoint(basePhase);
    const point = getPhasePoint(basePhase.id, defaults);
    const effective = applyScheduleToPhase(basePhase, point);
    return { project, basePhase, point, effective };
  }, [selection, getPhasePoint, effectiveProjects]);

  const updatePhase = useCallback(
    async (phaseId: string, next: PhaseEditorValue) => {
      setPhaseSchedules((prev) => ({ ...prev, [phaseId]: next.point }));
      setPhaseDefinitions((prev) => ({
        ...prev,
        [phaseId]: next.definition,
      }));
      setSaveError(null);
      try {
        const res = await fetch("/api/schedule/phases", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phaseId,
            year: next.point.year,
            month: next.point.month,
            label: next.definition.label,
            color: next.definition.color,
          }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "保存に失敗しました");
        }
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "保存に失敗しました",
        );
      }
    },
    [],
  );

  const updateGroupEvent = useCallback(async (next: GroupEvent) => {
    const withPeriod = {
      ...next,
      periodLabel: formatPeriodLabel(next.startKey, next.endKey),
    };
    setGroupEvents((prev) =>
      prev.map((event) => (event.id === withPeriod.id ? withPeriod : event)),
    );
    setSaveError(null);
    try {
      const res = await fetch(`/api/schedule/group-events/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withPeriod),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "保存に失敗しました");
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "保存に失敗しました",
      );
    }
  }, []);

  const updateDepartmentTask = useCallback(async (next: DepartmentTask) => {
    setDepartmentTasks((prev) =>
      prev.map((task) => (task.id === next.id ? next : task)),
    );
    setSaveError(null);
    try {
      const res = await fetch(`/api/schedule/department-tasks/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "保存に失敗しました");
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "保存に失敗しました",
      );
    }
  }, []);

  const updateProductProject = useCallback(async (next: ProductProject) => {
    setProductProjects((prev) =>
      prev.map((p) => (p.id === next.id ? { ...p, ...projectMeta(next) } : p)),
    );
    setSaveError(null);
    try {
      const res = await fetch("/api/schedule/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "保存に失敗しました");
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "保存に失敗しました",
      );
    }
  }, []);

  const addProductProject = useCallback(async () => {
    setSaveError(null);
    try {
      const res = await fetch("/api/schedule/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "追加に失敗しました");
      }
      const { project } = (await res.json()) as { project: ProductProject };
      setProductProjects((prev) => [...prev, project]);
      for (const phase of project.phases) {
        const point = phaseToSchedulePoint(phase);
        setPhaseSchedules((prev) => ({ ...prev, [phase.id]: point }));
        setPhaseDefinitions((prev) => ({
          ...prev,
          [phase.id]: { label: phase.label, color: phase.color },
        }));
      }
      setActiveProjectId(project.id);
      setSelection({
        pane: "product",
        id: project.id,
        phaseId: project.phases[0]?.id,
      });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "追加に失敗しました",
      );
    }
  }, []);

  const addGroupEvent = useCallback(async () => {
    setSaveError(null);
    try {
      const res = await fetch("/api/schedule/group-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTag: projectTagFromId(activeProjectId) }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "追加に失敗しました");
      }
      const { event } = (await res.json()) as { event: GroupEvent };
      setGroupEvents((prev) => [...prev, event]);
      setSelection({ pane: "group", id: event.id });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "追加に失敗しました",
      );
    }
  }, [activeProjectId]);

  const addDepartmentTask = useCallback(async () => {
    setSaveError(null);
    try {
      const res = await fetch("/api/schedule/department-tasks", {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "追加に失敗しました");
      }
      const { task } = (await res.json()) as { task: DepartmentTask };
      setDepartmentTasks((prev) => [...prev, task]);
      setSelection({ pane: "task", id: task.id });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "追加に失敗しました",
      );
    }
  }, []);

  const removePhaseState = useCallback((phaseIds: string[]) => {
    setPhaseSchedules((prev) => {
      const next = { ...prev };
      for (const phaseId of phaseIds) delete next[phaseId];
      return next;
    });
    setPhaseDefinitions((prev) => {
      const next = { ...prev };
      for (const phaseId of phaseIds) delete next[phaseId];
      return next;
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaveError(null);
    try {
      if (deleteTarget.kind === "project") {
        if (productProjects.length <= 1) {
          throw new Error("最後の1件は削除できません");
        }
        const project = productProjects.find((p) => p.id === deleteTarget.id);
        const res = await fetch(`/api/schedule/projects/${deleteTarget.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "削除に失敗しました");
        }
        const phaseIds = project?.phases.map((phase) => phase.id) ?? [];
        removePhaseState(phaseIds);
        const remaining = productProjects.filter(
          (p) => p.id !== deleteTarget.id,
        );
        setProductProjects(remaining);
        const nextId = remaining[0]?.id;
        if (nextId) {
          switchProjectTab(nextId);
        }
      } else if (deleteTarget.kind === "group") {
        const res = await fetch(
          `/api/schedule/group-events/${deleteTarget.id}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "削除に失敗しました");
        }
        const remaining = groupEvents.filter((e) => e.id !== deleteTarget.id);
        setGroupEvents(remaining);
        if (selection.pane === "group" && selection.id === deleteTarget.id) {
          const nextEvent = remaining[0];
          setSelection(
            nextEvent
              ? { pane: "group", id: nextEvent.id }
              : { pane: "product", id: activeProjectId },
          );
        }
      } else {
        const res = await fetch(
          `/api/schedule/department-tasks/${deleteTarget.id}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "削除に失敗しました");
        }
        const remaining = departmentTasks.filter(
          (t) => t.id !== deleteTarget.id,
        );
        setDepartmentTasks(remaining);
        if (selection.pane === "task" && selection.id === deleteTarget.id) {
          const nextTask = remaining[0];
          setSelection(
            nextTask
              ? { pane: "task", id: nextTask.id }
              : { pane: "product", id: activeProjectId },
          );
        }
      }
      setDeleteTarget(null);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "削除に失敗しました",
      );
    }
  }, [
    deleteTarget,
    productProjects,
    groupEvents,
    departmentTasks,
    selection,
    activeProjectId,
    removePhaseState,
    switchProjectTab,
  ]);

  const selectedGroupEvent = useMemo(
    () =>
      selection.pane === "group"
        ? groupEvents.find((event) => event.id === selection.id)
        : undefined,
    [selection, groupEvents],
  );

  const selectedDepartmentTask = useMemo(
    () =>
      selection.pane === "task"
        ? departmentTasks.find((task) => task.id === selection.id)
        : undefined,
    [selection, departmentTasks],
  );

  const detail = useMemo(() => {
    if (selection.pane === "product") {
      const item = effectiveProjects.find((p) => p.id === selection.id);
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
        showProjectEditor: true as const,
        productProject: item,
      };
    }
    if (selection.pane === "group") {
      const item = groupEvents.find((e) => e.id === selection.id);
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
        showGroupEditor: true as const,
        groupEvent: item,
      };
    }
    const item = departmentTasks.find((t) => t.id === selection.id);
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
      showGroupEditor: false as const,
      showTaskEditor: true as const,
      departmentTask: item,
    };
  }, [selection, selectedPhaseContext, groupEvents, departmentTasks, effectiveProjects]);

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
          {loadState === "loading"
            ? "読み込み中…"
            : loadState === "error"
              ? "DBエラー"
              : "DB接続済み"}
        </Badge>
      </header>

      {saveError ? (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-1.5 text-[11px] text-destructive">
          {saveError}
        </div>
      ) : null}

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
            className="mb-3 flex w-fit max-w-full flex-wrap items-center gap-2"
            role="tablist"
            aria-label="製品プロジェクトの選択"
          >
            <div className="flex flex-wrap gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
              {productProjects.map((p) => (
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => void addProductProject()}
            >
              <Plus className="size-3.5" aria-hidden />
              プロジェクト追加
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
              disabled={productProjects.length <= 1 || !activeProject}
              onClick={() =>
                activeProject &&
                setDeleteTarget({
                  kind: "project",
                  id: activeProject.id,
                  name: activeProject.name,
                })
              }
            >
              <Trash2 className="size-3.5" aria-hidden />
              プロジェクト削除
            </Button>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-7 w-full gap-1 text-xs"
            onClick={() => void addGroupEvent()}
          >
            <Plus className="size-3.5" aria-hidden />
            イベント追加
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-7 w-full gap-1 text-xs text-destructive hover:text-destructive"
            disabled={!selectedGroupEvent}
            onClick={() =>
              selectedGroupEvent &&
              setDeleteTarget({
                kind: "group",
                id: selectedGroupEvent.id,
                name: selectedGroupEvent.title,
              })
            }
          >
            <Trash2 className="size-3.5" aria-hidden />
            イベント削除
          </Button>
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
              {departmentTasks.map((task, index) => (
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-7 w-full gap-1 text-xs"
              onClick={() => void addDepartmentTask()}
            >
              <Plus className="size-3.5" aria-hidden />
              タスク追加
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-7 w-full gap-1 text-xs text-destructive hover:text-destructive"
              disabled={!selectedDepartmentTask}
              onClick={() =>
                selectedDepartmentTask &&
                setDeleteTarget({
                  kind: "task",
                  id: selectedDepartmentTask.id,
                  name: selectedDepartmentTask.title,
                })
              }
            >
              <Trash2 className="size-3.5" aria-hidden />
              タスク削除
            </Button>
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
                        value={{
                          definition:
                            phaseDefinitions[
                              selectedPhaseContext.basePhase.id
                            ] ?? {
                              label: selectedPhaseContext.effective.label,
                              color: selectedPhaseContext.effective.color,
                            },
                          point: selectedPhaseContext.point,
                        }}
                        onChange={(next) =>
                          updatePhase(selectedPhaseContext.basePhase.id, next)
                        }
                      />
                    ) : null}
                    {"showProjectEditor" in detail &&
                    detail.showProjectEditor &&
                    "productProject" in detail &&
                    detail.productProject ? (
                      <ProductProjectEditor
                        project={detail.productProject}
                        onChange={updateProductProject}
                      />
                    ) : null}
                    {"showGroupEditor" in detail && detail.showGroupEditor &&
                    "groupEvent" in detail &&
                    detail.groupEvent ? (
                      <GroupEventEditor
                        event={detail.groupEvent}
                        productTags={productTags}
                        onChange={updateGroupEvent}
                      />
                    ) : null}
                    {"showTaskEditor" in detail &&
                    detail.showTaskEditor &&
                    "departmentTask" in detail &&
                    detail.departmentTask ? (
                      <DepartmentTaskEditor
                        task={detail.departmentTask}
                        onChange={updateDepartmentTask}
                      />
                    ) : null}
                    {!("showGroupEditor" in detail && detail.showGroupEditor) &&
                    !("showTaskEditor" in detail && detail.showTaskEditor) &&
                    !("showProjectEditor" in detail && detail.showProjectEditor)
                      ? detail.rows.map((row) => (
                          <div key={row.k} className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {row.k}
                            </span>
                            <span className="text-xs leading-relaxed">
                              {row.v}
                            </span>
                          </div>
                        ))
                      : null}
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

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.kind === "project"
            ? "プロジェクトを削除"
            : deleteTarget?.kind === "group"
              ? "イベントを削除"
              : "タスクを削除"
        }
        itemName={deleteTarget?.name ?? ""}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
