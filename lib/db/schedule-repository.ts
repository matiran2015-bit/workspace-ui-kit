import {
  DEPARTMENT_TASKS,
  GROUP_EVENTS,
  PRODUCT_PROJECTS,
  STANDARD_PROJECT_PHASES,
  applyScheduleToPhase,
  buildProductProjectFromMeta,
  formatPeriodLabel,
  phaseToSchedulePoint,
  projectSlugFromId,
  projectTagFromId,
  type ChartColor,
  type DepartmentTask,
  type GroupEvent,
  type PhaseDefinition,
  type PhaseSchedulePoint,
  type ProductProject,
} from "@/lib/data/schedule-demo";
import { getSql } from "@/lib/db";

type PhaseScheduleRow = {
  phase_id: string;
  year: number;
  month: number;
};

type PhaseDefinitionRow = {
  phase_id: string;
  label: string;
  color: string;
};

type GroupEventRow = {
  id: string;
  title: string;
  date: string;
  product_tag: string;
  start_key: string;
  end_key: string;
  color: string;
  impact: string;
  owner: string;
  note: string;
};

type DepartmentTaskRow = {
  id: string;
  title: string;
  status: string;
  due: string;
  assignee: string;
  blocker: string;
  note: string;
};

type ProductProjectRow = {
  id: string;
  name: string;
  slug: string;
  accent_color: string;
  phase_summary: string;
  departments: string;
  note: string;
  sort_order: number;
};

export type ScheduleData = {
  productProjects: ProductProject[];
  phaseSchedules: Record<string, PhaseSchedulePoint>;
  phaseDefinitions: Record<string, PhaseDefinition>;
  groupEvents: GroupEvent[];
  departmentTasks: DepartmentTask[];
};

const ACCENT_COLORS: ChartColor[] = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
];

function rowToGroupEvent(row: GroupEventRow): GroupEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    productTag: row.product_tag,
    startKey: row.start_key,
    endKey: row.end_key,
    color: row.color as GroupEvent["color"],
    periodLabel: formatPeriodLabel(row.start_key, row.end_key),
    detail: {
      impact: row.impact,
      owner: row.owner,
      note: row.note,
    },
  };
}

function rowToDepartmentTask(row: DepartmentTaskRow): DepartmentTask {
  return {
    id: row.id,
    title: row.title,
    status: row.status as DepartmentTask["status"],
    due: row.due,
    detail: {
      assignee: row.assignee,
      blocker: row.blocker,
      note: row.note,
    },
  };
}

function rowToProductProjectMeta(row: ProductProjectRow) {
  return {
    id: row.id,
    name: row.name,
    accentColor: row.accent_color as ChartColor,
    detail: {
      phase: row.phase_summary,
      departments: row.departments,
      note: row.note,
    },
  };
}

function buildProjectsFromRows(
  rows: ProductProjectRow[],
  phaseSchedules: Record<string, PhaseSchedulePoint>,
  phaseDefinitions: Record<string, PhaseDefinition>,
): ProductProject[] {
  return rows.map((row) =>
    buildProductProjectFromMeta(
      rowToProductProjectMeta(row),
      phaseSchedules,
      phaseDefinitions,
    ),
  );
}

export async function ensureScheduleSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS product_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      accent_color TEXT NOT NULL,
      phase_summary TEXT NOT NULL DEFAULT '企画提案〜MP',
      departments TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS phase_schedules (
      phase_id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS phase_definitions (
      phase_id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS group_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      product_tag TEXT NOT NULL,
      start_key TEXT NOT NULL,
      end_key TEXT NOT NULL,
      color TEXT NOT NULL,
      impact TEXT NOT NULL,
      owner TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS department_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      due TEXT NOT NULL,
      assignee TEXT NOT NULL,
      blocker TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT ''
    )
  `;
}

async function seedProductProjects() {
  const sql = getSql();
  const projectCount =
    await sql`SELECT COUNT(*)::int AS count FROM product_projects`;
  if (projectCount[0]?.count !== 0) return;

  for (const [index, project] of PRODUCT_PROJECTS.entries()) {
    const slug = projectSlugFromId(project.id);
    await sql`
      INSERT INTO product_projects (
        id, name, slug, accent_color, phase_summary, departments, note, sort_order
      ) VALUES (
        ${project.id},
        ${project.name},
        ${slug},
        ${project.accentColor},
        ${project.detail.phase},
        ${project.detail.departments},
        ${project.detail.note},
        ${index}
      )
    `;
  }
}

async function seedPhaseSchedules() {
  const sql = getSql();
  const phaseCount =
    await sql`SELECT COUNT(*)::int AS count FROM phase_schedules`;
  if (phaseCount[0]?.count !== 0) return;

  for (const project of PRODUCT_PROJECTS) {
    for (const phase of project.phases) {
      const point = phaseToSchedulePoint(phase);
      await sql`
        INSERT INTO phase_schedules (phase_id, year, month)
        VALUES (${phase.id}, ${point.year}, ${point.month})
      `;
    }
  }
}

async function seedPhaseDefinitions() {
  const sql = getSql();
  const defCount =
    await sql`SELECT COUNT(*)::int AS count FROM phase_definitions`;
  if (defCount[0]?.count !== 0) return;

  for (const project of PRODUCT_PROJECTS) {
    for (const phase of project.phases) {
      await sql`
        INSERT INTO phase_definitions (phase_id, label, color)
        VALUES (${phase.id}, ${phase.label}, ${phase.color})
      `;
    }
  }
}

async function ensurePhaseDefinitions() {
  const sql = getSql();
  const projectRows = (await sql`
    SELECT id, slug FROM product_projects
  `) as { id: string; slug: string }[];

  for (const row of projectRows) {
    const seedProject = PRODUCT_PROJECTS.find((project) => project.id === row.id);
    const defs = seedProject
      ? seedProject.phases.map((phase) => ({
          phaseId: phase.id,
          label: phase.label,
          color: phase.color,
        }))
      : STANDARD_PROJECT_PHASES.map((def) => ({
          phaseId: `${row.slug}-${def.slug}`,
          label: def.label,
          color: def.color,
        }));

    for (const def of defs) {
      await sql`
        INSERT INTO phase_definitions (phase_id, label, color)
        VALUES (${def.phaseId}, ${def.label}, ${def.color})
        ON CONFLICT (phase_id) DO NOTHING
      `;
    }
  }
}

async function seedIfEmpty() {
  await seedProductProjects();
  await seedPhaseSchedules();
  await seedPhaseDefinitions();
  await ensurePhaseDefinitions();

  const sql = getSql();

  const eventCount = await sql`SELECT COUNT(*)::int AS count FROM group_events`;
  if (eventCount[0]?.count === 0) {
    for (const event of GROUP_EVENTS) {
      await sql`
        INSERT INTO group_events (
          id, title, date, product_tag, start_key, end_key, color, impact, owner, note
        ) VALUES (
          ${event.id},
          ${event.title},
          ${event.date},
          ${event.productTag},
          ${event.startKey},
          ${event.endKey},
          ${event.color},
          ${event.detail.impact},
          ${event.detail.owner},
          ${event.detail.note}
        )
      `;
    }
  }

  const taskCount =
    await sql`SELECT COUNT(*)::int AS count FROM department_tasks`;
  if (taskCount[0]?.count === 0) {
    for (const task of DEPARTMENT_TASKS) {
      await sql`
        INSERT INTO department_tasks (
          id, title, status, due, assignee, blocker, note
        ) VALUES (
          ${task.id},
          ${task.title},
          ${task.status},
          ${task.due},
          ${task.detail.assignee},
          ${task.detail.blocker},
          ${task.detail.note}
        )
      `;
    }
  }
}

export async function loadScheduleData(): Promise<ScheduleData> {
  await ensureScheduleSchema();
  await seedIfEmpty();
  await ensurePhaseDefinitions();

  const sql = getSql();

  const projectRows = (await sql`
    SELECT id, name, slug, accent_color, phase_summary, departments, note, sort_order
    FROM product_projects
    ORDER BY sort_order, id
  `) as ProductProjectRow[];

  const phaseRows = (await sql`
    SELECT phase_id, year, month FROM phase_schedules
  `) as PhaseScheduleRow[];
  const phaseSchedules: Record<string, PhaseSchedulePoint> = {};
  for (const row of phaseRows) {
    phaseSchedules[row.phase_id] = { year: row.year, month: row.month };
  }

  const definitionRows = (await sql`
    SELECT phase_id, label, color FROM phase_definitions
  `) as PhaseDefinitionRow[];
  const phaseDefinitions: Record<string, PhaseDefinition> = {};
  for (const row of definitionRows) {
    phaseDefinitions[row.phase_id] = {
      label: row.label,
      color: row.color as ChartColor,
    };
  }

  const eventRows = (await sql`
    SELECT id, title, date, product_tag, start_key, end_key, color, impact, owner, note
    FROM group_events
    ORDER BY start_key, id
  `) as GroupEventRow[];

  const taskRows = (await sql`
    SELECT id, title, status, due, assignee, blocker, note
    FROM department_tasks
    ORDER BY due, id
  `) as DepartmentTaskRow[];

  return {
    productProjects: buildProjectsFromRows(
      projectRows,
      phaseSchedules,
      phaseDefinitions,
    ),
    phaseSchedules,
    phaseDefinitions,
    groupEvents: eventRows.map(rowToGroupEvent),
    departmentTasks: taskRows.map(rowToDepartmentTask),
  };
}

export async function savePhaseDefinition(
  phaseId: string,
  definition: PhaseDefinition,
) {
  const sql = getSql();
  await sql`
    INSERT INTO phase_definitions (phase_id, label, color)
    VALUES (${phaseId}, ${definition.label}, ${definition.color})
    ON CONFLICT (phase_id) DO UPDATE SET
      label = EXCLUDED.label,
      color = EXCLUDED.color
  `;
}

export async function savePhaseSchedule(
  phaseId: string,
  point: PhaseSchedulePoint,
) {
  const sql = getSql();
  await sql`
    INSERT INTO phase_schedules (phase_id, year, month)
    VALUES (${phaseId}, ${point.year}, ${point.month})
    ON CONFLICT (phase_id) DO UPDATE SET
      year = EXCLUDED.year,
      month = EXCLUDED.month
  `;
}

export async function saveGroupEvent(event: GroupEvent) {
  const sql = getSql();
  await sql`
    INSERT INTO group_events (
      id, title, date, product_tag, start_key, end_key, color, impact, owner, note
    ) VALUES (
      ${event.id},
      ${event.title},
      ${event.date},
      ${event.productTag},
      ${event.startKey},
      ${event.endKey},
      ${event.color},
      ${event.detail.impact},
      ${event.detail.owner},
      ${event.detail.note}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      product_tag = EXCLUDED.product_tag,
      start_key = EXCLUDED.start_key,
      end_key = EXCLUDED.end_key,
      color = EXCLUDED.color,
      impact = EXCLUDED.impact,
      owner = EXCLUDED.owner,
      note = EXCLUDED.note
  `;
}

export async function saveDepartmentTask(task: DepartmentTask) {
  const sql = getSql();
  await sql`
    INSERT INTO department_tasks (
      id, title, status, due, assignee, blocker, note
    ) VALUES (
      ${task.id},
      ${task.title},
      ${task.status},
      ${task.due},
      ${task.detail.assignee},
      ${task.detail.blocker},
      ${task.detail.note}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      due = EXCLUDED.due,
      assignee = EXCLUDED.assignee,
      blocker = EXCLUDED.blocker,
      note = EXCLUDED.note
  `;
}

export async function saveProductProject(project: ProductProject) {
  const sql = getSql();
  const slug = projectSlugFromId(project.id);
  await sql`
    INSERT INTO product_projects (
      id, name, slug, accent_color, phase_summary, departments, note, sort_order
    ) VALUES (
      ${project.id},
      ${project.name},
      ${slug},
      ${project.accentColor},
      ${project.detail.phase},
      ${project.detail.departments},
      ${project.detail.note},
      ${999}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      accent_color = EXCLUDED.accent_color,
      phase_summary = EXCLUDED.phase_summary,
      departments = EXCLUDED.departments,
      note = EXCLUDED.note
  `;
}

async function nextProjectSlug(): Promise<string> {
  const sql = getSql();
  const rows = (await sql`
    SELECT slug FROM product_projects ORDER BY slug
  `) as { slug: string }[];
  const used = new Set(rows.map((r) => r.slug));

  for (const code of "cdefghijklmnopqrstuvwxyz") {
    if (!used.has(code)) return code;
  }

  return `p${Date.now().toString(36).slice(-4)}`;
}

export async function createProductProject(name?: string): Promise<ProductProject> {
  await ensureScheduleSchema();
  const sql = getSql();
  const slug = await nextProjectSlug();
  const id = `project-${slug}`;
  const projectName = name?.trim() || `プロジェクト ${slug.toUpperCase()}`;
  const countRow =
    await sql`SELECT COUNT(*)::int AS c FROM product_projects`;
  const accentColor =
    ACCENT_COLORS[(countRow[0]?.c ?? 0) % ACCENT_COLORS.length];

  const sortOrder =
    (await sql`SELECT COALESCE(MAX(sort_order), -1)::int + 1 AS next FROM product_projects`)[0]
      ?.next ?? 0;

  await sql`
    INSERT INTO product_projects (
      id, name, slug, accent_color, phase_summary, departments, note, sort_order
    ) VALUES (
      ${id},
      ${projectName},
      ${slug},
      ${accentColor},
      ${"企画提案〜MP"},
      ${"開発部"},
      ${""},
      ${sortOrder}
    )
  `;

  for (const def of STANDARD_PROJECT_PHASES) {
    const phaseId = `${slug}-${def.slug}`;
    await sql`
      INSERT INTO phase_schedules (phase_id, year, month)
      VALUES (${phaseId}, ${2026}, ${def.pointMonth})
    `;
    await sql`
      INSERT INTO phase_definitions (phase_id, label, color)
      VALUES (${phaseId}, ${def.label}, ${def.color})
    `;
  }

  const phaseSchedules: Record<string, PhaseSchedulePoint> = {};
  const phaseDefinitions: Record<string, PhaseDefinition> = {};
  for (const def of STANDARD_PROJECT_PHASES) {
    const phaseId = `${slug}-${def.slug}`;
    phaseSchedules[phaseId] = { year: 2026, month: def.pointMonth };
    phaseDefinitions[phaseId] = { label: def.label, color: def.color };
  }

  return buildProductProjectFromMeta(
    {
      id,
      name: projectName,
      accentColor,
      detail: { phase: "企画提案〜MP", departments: "開発部", note: "" },
    },
    phaseSchedules,
    phaseDefinitions,
  );
}

export async function createGroupEvent(
  productTag: string,
): Promise<GroupEvent> {
  await ensureScheduleSchema();
  const id = `evt-${Date.now().toString(36)}`;
  const event: GroupEvent = {
    id,
    title: "新規イベント",
    date: "—",
    productTag,
    startKey: "2026-04",
    endKey: "2026-04",
    color: "chart-3",
    periodLabel: formatPeriodLabel("2026-04", "2026-04"),
    detail: {
      impact: productTag === "both" ? "全製品プロジェクト" : `プロジェクト ${productTag}`,
      owner: "",
      note: "",
    },
  };
  await saveGroupEvent(event);
  return event;
}

export async function createDepartmentTask(): Promise<DepartmentTask> {
  await ensureScheduleSchema();
  const id = `task-${Date.now().toString(36)}`;
  const task: DepartmentTask = {
    id,
    title: "新規タスク",
    status: "未着手",
    due: "—",
    detail: { assignee: "", blocker: "なし", note: "" },
  };
  await saveDepartmentTask(task);
  return task;
}

export function defaultProductTagForProject(projectId: string): string {
  return projectTagFromId(projectId);
}

export async function deleteProductProject(projectId: string): Promise<void> {
  const sql = getSql();
  const rows = (await sql`
    SELECT slug FROM product_projects WHERE id = ${projectId}
  `) as { slug: string }[];

  if (rows.length === 0) {
    throw new Error("プロジェクトが見つかりません");
  }

  const slug = rows[0].slug;
  const phasePrefix = `${slug}-`;

  await sql`
    DELETE FROM phase_schedules
    WHERE phase_id LIKE ${`${phasePrefix}%`}
  `;
  await sql`
    DELETE FROM phase_definitions
    WHERE phase_id LIKE ${`${phasePrefix}%`}
  `;
  await sql`DELETE FROM product_projects WHERE id = ${projectId}`;
}

export async function deleteGroupEvent(eventId: string): Promise<void> {
  const sql = getSql();
  const result = await sql`
    DELETE FROM group_events WHERE id = ${eventId} RETURNING id
  `;
  if (result.length === 0) {
    throw new Error("イベントが見つかりません");
  }
}

export async function deleteDepartmentTask(taskId: string): Promise<void> {
  const sql = getSql();
  const result = await sql`
    DELETE FROM department_tasks WHERE id = ${taskId} RETURNING id
  `;
  if (result.length === 0) {
    throw new Error("タスクが見つかりません");
  }
}
