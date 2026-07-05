import { loadScheduleData } from "@/lib/db/schedule-repository";

export async function GET() {
  try {
    const data = await loadScheduleData();
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "データの読み込みに失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
