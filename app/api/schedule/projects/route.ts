import {
  createProductProject,
  saveProductProject,
} from "@/lib/db/schedule-repository";
import type { ProductProject } from "@/lib/data/schedule-demo";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
    };
    const project = await createProductProject(body.name);
    return Response.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "プロジェクトの追加に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as ProductProject;
    if (!body.id || !body.name) {
      return Response.json({ error: "id と name が必要です" }, { status: 400 });
    }
    await saveProductProject(body);
    return Response.json({ ok: true, project: body });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
