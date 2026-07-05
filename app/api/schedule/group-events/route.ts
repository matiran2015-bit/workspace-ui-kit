import { createGroupEvent } from "@/lib/db/schedule-repository";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      productTag?: string;
    };
    const productTag = body.productTag?.trim() || "both";
    const event = await createGroupEvent(productTag);
    return Response.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "イベントの追加に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
