import { createDepartmentTask } from "@/lib/db/schedule-repository";

export async function POST() {
  try {
    const task = await createDepartmentTask();
    return Response.json({ ok: true, task }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "タスクの追加に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
