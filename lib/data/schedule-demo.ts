export type ChartColor = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

export type TimelineMonth = {
  key: string;
  year: number;
  month: number;
  label: string;
};

export type ProjectPhase = {
  id: string;
  label: string;
  /** イベントがある年月（1点） */
  pointKey: string;
  color: ChartColor;
  pointLabel: string;
};

export type ProductProject = {
  id: string;
  name: string;
  accentColor: ChartColor;
  phases: ProjectPhase[];
  detail: {
    phase: string;
    departments: string;
    note: string;
  };
};

export type GroupEvent = {
  id: string;
  date: string;
  title: string;
  productTag: "I" | "H" | "both";
  startKey: string;
  endKey: string;
  color: ChartColor;
  periodLabel: string;
  detail: {
    impact: string;
    owner: string;
    note: string;
  };
};

export type DepartmentTask = {
  id: string;
  title: string;
  status: "未着手" | "進行中" | "完了";
  due: string;
  detail: {
    assignee: string;
    blocker: string;
    note: string;
  };
};

/** 製品プロジェクトの標準フェーズ（この順序で表示） */
export const STANDARD_PROJECT_PHASES = [
  { slug: "proposal", label: "企画提案", color: "chart-1" as ChartColor, pointMonth: 1 },
  { slug: "plan-a", label: "企画書A", color: "chart-2" as ChartColor, pointMonth: 2 },
  { slug: "plan-b", label: "企画書B", color: "chart-3" as ChartColor, pointMonth: 3 },
  { slug: "dmt", label: "DMT", color: "chart-4" as ChartColor, pointMonth: 4 },
  { slug: "pmt", label: "PMT", color: "chart-5" as ChartColor, pointMonth: 5 },
  { slug: "pp", label: "PP", color: "chart-1" as ChartColor, pointMonth: 7 },
  { slug: "mp", label: "MP", color: "chart-2" as ChartColor, pointMonth: 10 },
] as const;

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatPointLabel(year: number, month: number): string {
  return `${year}年${month}月`;
}

function buildProjectPhases(
  projectPrefix: "i" | "h",
  year: number,
  monthOffset: number,
): ProjectPhase[] {
  return STANDARD_PROJECT_PHASES.map((def) => {
    const month = def.pointMonth + monthOffset;
    return {
      id: `${projectPrefix}-${def.slug}`,
      label: def.label,
      pointKey: monthKey(year, month),
      color: def.color,
      pointLabel: formatPointLabel(year, month),
    };
  });
}

/** タイムラインの表示範囲（2026年 1月〜12月） */
export const TIMELINE_MONTHS: TimelineMonth[] = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1;
  return {
    key: monthKey(2026, month),
    year: 2026,
    month,
    label: `${month}月`,
  };
});

export const TIMELINE_YEAR_LABEL = "2026年";

export const PRODUCT_PROJECTS: ProductProject[] = [
  {
    id: "project-i",
    name: "プロジェクト I",
    accentColor: "chart-1",
    phases: buildProjectPhases("i", 2026, 0),
    detail: {
      phase: "企画提案〜MP",
      departments: "開発部・品質保証部",
      note: "標準7項目の順でスケジュールを管理（ダミー）。",
    },
  },
  {
    id: "project-h",
    name: "プロジェクト H",
    accentColor: "chart-4",
    phases: buildProjectPhases("h", 2026, 0),
    detail: {
      phase: "企画提案〜MP",
      departments: "開発部",
      note: "プロジェクト I と同じ7項目・同順。実務では開始月をずらす想定（ダミー）。",
    },
  },
];

export const GROUP_EVENTS: GroupEvent[] = [
  {
    id: "evt-review",
    date: "3/18",
    title: "設計レビュー",
    productTag: "I",
    startKey: monthKey(2026, 3),
    endKey: monthKey(2026, 3),
    color: "chart-1",
    periodLabel: "2026年3月",
    detail: {
      impact: "プロジェクト I",
      owner: "プロジェクトリーダー",
      note: "試作1次の結果を共有し、次フェーズの前提を確定。",
    },
  },
  {
    id: "evt-proto2",
    date: "3/25",
    title: "試作2次",
    productTag: "H",
    startKey: monthKey(2026, 3),
    endKey: monthKey(2026, 4),
    color: "chart-2",
    periodLabel: "2026年3月〜4月",
    detail: {
      impact: "プロジェクト H",
      owner: "開発部",
      note: "配合・耐久の中間評価を実施。",
    },
  },
  {
    id: "evt-mass",
    date: "4/10",
    title: "量産立ち上げ",
    productTag: "both",
    startKey: monthKey(2026, 4),
    endKey: monthKey(2026, 6),
    color: "chart-4",
    periodLabel: "2026年4月〜6月",
    detail: {
      impact: "プロジェクト I / H",
      owner: "生産技術",
      note: "グループ横断の立ち上げゲート。",
    },
  },
  {
    id: "evt-report",
    date: "4/22",
    title: "月次進捗報告",
    productTag: "both",
    startKey: monthKey(2026, 4),
    endKey: monthKey(2026, 4),
    color: "chart-5",
    periodLabel: "2026年4月",
    detail: {
      impact: "全製品プロジェクト",
      owner: "トナーグループ",
      note: "部門タスクの完了状況を一覧で確認。",
    },
  },
];

export const DEPARTMENT_TASKS: DepartmentTask[] = [
  {
    id: "task-blend",
    title: "配合試験",
    status: "進行中",
    due: "3/28",
    detail: {
      assignee: "開発部 A",
      blocker: "なし",
      note: "試作2次に向けた配合条件の最終調整。",
    },
  },
  {
    id: "task-durability",
    title: "耐久試験",
    status: "未着手",
    due: "4/05",
    detail: {
      assignee: "品質保証部 B",
      blocker: "試料手配待ち",
      note: "設計レビュー承認後に開始。",
    },
  },
  {
    id: "task-report",
    title: "評価レポート提出",
    status: "完了",
    due: "3/15",
    detail: {
      assignee: "開発部 C",
      blocker: "なし",
      note: "試作1次の結果をまとめ済み。",
    },
  },
  {
    id: "task-spec",
    title: "仕様書ドラフト更新",
    status: "進行中",
    due: "3/30",
    detail: {
      assignee: "開発部 D",
      blocker: "レビュー指摘の反映",
      note: "プロジェクト I の設計固めに連動。",
    },
  },
  {
    id: "task-sample",
    title: "サンプル送付",
    status: "未着手",
    due: "4/12",
    detail: {
      assignee: "開発部 E",
      blocker: "量産立ち上げ日程の確定待ち",
      note: "顧客評価用サンプルの梱包・発送。",
    },
  },
  {
    id: "task-qa",
    title: "工程内検査計画",
    status: "進行中",
    due: "4/01",
    detail: {
      assignee: "品質保証部 F",
      blocker: "なし",
      note: "量産立ち上げ前の検査ポイント定義。",
    },
  },
];

export type ScheduleSelection =
  | { pane: "product"; id: string; phaseId?: string }
  | { pane: "group"; id: string }
  | { pane: "task"; id: string };

/** ④で編集するフェーズの実施ポイント（年月） */
export type PhaseSchedulePoint = {
  year: number;
  month: number;
};

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-");
  return { year: Number(y), month: Number(m) };
}

export function phaseToSchedulePoint(phase: ProjectPhase): PhaseSchedulePoint {
  const { year, month } = parseMonthKey(phase.pointKey);
  return { year, month };
}

export function formatSchedulePoint(point: PhaseSchedulePoint): string {
  return formatPointLabel(point.year, point.month);
}

export function applyScheduleToPhase(
  phase: ProjectPhase,
  point: PhaseSchedulePoint,
): ProjectPhase {
  const pointKey = monthKey(point.year, point.month);
  return {
    ...phase,
    pointKey,
    pointLabel: formatSchedulePoint(point),
  };
}

function monthOrdinal(year: number, month: number): number {
  return year * 12 + month;
}

/** 全フェーズの期間からタイムラインの月列を生成 */
export function buildTimelineMonths(projects: ProductProject[]): TimelineMonth[] {
  const ranges = projects.flatMap((project) =>
    project.phases.map((phase) => ({
      startKey: phase.pointKey,
      endKey: phase.pointKey,
    })),
  );
  return buildTimelineMonthsFromRanges(ranges);
}

/** 開始・終了キーからタイムラインの月列を生成 */
export function buildTimelineMonthsFromRanges(
  ranges: { startKey: string; endKey: string }[],
): TimelineMonth[] {
  let minOrd = monthOrdinal(2026, 1);
  let maxOrd = monthOrdinal(2026, 12);

  for (const range of ranges) {
    const start = parseMonthKey(range.startKey);
    const end = parseMonthKey(range.endKey);
    minOrd = Math.min(minOrd, monthOrdinal(start.year, start.month));
    maxOrd = Math.max(maxOrd, monthOrdinal(end.year, end.month));
  }

  const months: TimelineMonth[] = [];
  for (let ord = minOrd; ord <= maxOrd; ord++) {
    const year = Math.floor((ord - 1) / 12);
    const month = ((ord - 1) % 12) + 1;
    months.push({
      key: monthKey(year, month),
      year,
      month,
      label: `${month}月`,
    });
  }
  return months;
}

export function buildGroupTimelineMonths(events: GroupEvent[]): TimelineMonth[] {
  return buildTimelineMonthsFromRanges(
    events.map((event) => ({
      startKey: event.startKey,
      endKey: event.endKey,
    })),
  );
}

/** ①で選択中の製品プロジェクトに関連するグループイベントを抽出 */
export function filterGroupEventsForProject(
  events: GroupEvent[],
  projectId: string,
): GroupEvent[] {
  const tag = projectId === "project-h" ? "H" : "I";
  return events.filter(
    (event) => event.productTag === tag || event.productTag === "both",
  );
}

export function buildTimelineYearLabel(months: TimelineMonth[]): string {
  if (months.length === 0) return "—";
  const first = months[0];
  const last = months[months.length - 1];
  if (first.year === last.year) return `${first.year}年`;
  return `${first.year}年〜${last.year}年`;
}

export function monthIndexInTimeline(key: string, timeline: TimelineMonth[]): number {
  return timeline.findIndex((m) => m.key === key);
}

/** ポイントの横位置（列の中央、%） */
export function phasePointLeft(phase: ProjectPhase, timeline: TimelineMonth[]): string {
  const idx = monthIndexInTimeline(phase.pointKey, timeline);
  const total = timeline.length;
  if (idx < 0 || total === 0) return "0%";
  const cellWidth = 100 / total;
  return `${(idx + 0.5) * cellWidth}%`;
}

/** 期間バーの位置と幅（%） */
export function rangeBarStyle(
  startKey: string,
  endKey: string,
  timeline: TimelineMonth[],
): { left: string; width: string } {
  const start = monthIndexInTimeline(startKey, timeline);
  const end = monthIndexInTimeline(endKey, timeline);
  const total = timeline.length;
  if (start < 0 || end < 0 || total === 0) return { left: "0%", width: "0%" };
  const leftPercent = (start / total) * 100;
  const widthPercent = ((end - start + 1) / total) * 100;
  return { left: `${leftPercent}%`, width: `${widthPercent}%` };
}
