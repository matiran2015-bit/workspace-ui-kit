import { deleteProductProject } from "@/lib/db/schedule-repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteProductProject(id);
    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "削除に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
