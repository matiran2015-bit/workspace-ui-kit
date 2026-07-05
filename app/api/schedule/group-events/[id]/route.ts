import { saveGroupEvent } from "@/lib/db/schedule-repository";
import type { GroupEvent } from "@/lib/data/schedule-demo";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as GroupEvent;

    if (body.id !== id) {
      return Response.json({ error: "id が一致しません" }, { status: 400 });
    }

    await saveGroupEvent(body);
    return Response.json({ ok: true, event: body });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
