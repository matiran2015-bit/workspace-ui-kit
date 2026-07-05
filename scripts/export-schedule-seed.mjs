import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const projectRows = await sql`
  SELECT id, name, slug, accent_color, phase_summary, departments, note, sort_order
  FROM product_projects ORDER BY sort_order, id
`;
const phaseRows = await sql`SELECT phase_id, year, month FROM phase_schedules`;
const definitionRows = await sql`SELECT phase_id, label, color FROM phase_definitions`;
const eventRows = await sql`
  SELECT id, title, date, product_tag, start_key, end_key, color, impact, owner, note
  FROM group_events ORDER BY start_key, id
`;
const taskRows = await sql`
  SELECT id, title, status, due, assignee, blocker, note
  FROM department_tasks ORDER BY due, id
`;

const phaseSchedules = Object.fromEntries(
  phaseRows.map((r) => [r.phase_id, { year: r.year, month: r.month }]),
);
const phaseDefinitions = Object.fromEntries(
  definitionRows.map((r) => [r.phase_id, { label: r.label, color: r.color }]),
);

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatPointLabel(year, month) {
  return `${year}年${month}月`;
}

const STANDARD_SLUGS = [
  "proposal",
  "plan-a",
  "plan-b",
  "dmt",
  "pmt",
  "pp",
  "mp",
];

const productProjects = projectRows.map((row) => {
  const phases = STANDARD_SLUGS.map((slug) => {
    const phaseId = `${row.slug}-${slug}`;
    const def = phaseDefinitions[phaseId] ?? { label: slug, color: "chart-1" };
    const point = phaseSchedules[phaseId] ?? { year: 2026, month: 1 };
    return {
      id: phaseId,
      label: def.label,
      pointKey: monthKey(point.year, point.month),
      color: def.color,
      pointLabel: formatPointLabel(point.year, point.month),
    };
  });
  return {
    id: row.id,
    name: row.name,
    accentColor: row.accent_color,
    phases,
    detail: {
      phase: row.phase_summary,
      departments: row.departments,
      note: row.note,
    },
  };
});

function formatPeriodLabel(startKey, endKey) {
  const [sy, sm] = startKey.split("-").map(Number);
  const [ey, em] = endKey.split("-").map(Number);
  if (startKey === endKey) return formatPointLabel(sy, sm);
  if (sy === ey) return `${sy}年${sm}月〜${em}月`;
  return `${formatPointLabel(sy, sm)}〜${formatPointLabel(ey, em)}`;
}

const groupEvents = eventRows.map((row) => ({
  id: row.id,
  date: row.date,
  title: row.title,
  productTag: row.product_tag,
  startKey: row.start_key,
  endKey: row.end_key,
  color: row.color,
  periodLabel: formatPeriodLabel(row.start_key, row.end_key),
  detail: {
    impact: row.impact,
    owner: row.owner,
    note: row.note,
  },
}));

const departmentTasks = taskRows.map((row) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  due: row.due,
  detail: {
    assignee: row.assignee,
    blocker: row.blocker,
    note: row.note,
  },
}));

const outPath = resolve(root, "scripts/.schedule-seed-export.json");
writeFileSync(
  outPath,
  JSON.stringify({ productProjects, groupEvents, departmentTasks }, null, 2),
  "utf8",
);
console.log(`Exported to ${outPath}`);
console.log(
  `projects=${productProjects.length} events=${groupEvents.length} tasks=${departmentTasks.length}`,
);
