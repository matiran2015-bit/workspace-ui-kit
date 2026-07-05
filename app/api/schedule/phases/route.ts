import { savePhaseSchedule } from "@/lib/db/schedule-repository";
import type { PhaseSchedulePoint } from "@/lib/data/schedule-demo";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      phaseId?: string;
      year?: number;
      month?: number;
    };

    if (!body.phaseId || body.year == null || body.month == null) {
      return Response.json(
        { error: "phaseId, year, month が必要です" },
        { status: 400 },
      );
    }

    const point: PhaseSchedulePoint = {
      year: Number(body.year),
      month: Number(body.month),
    };

    if (point.month < 1 || point.month > 12) {
      return Response.json({ error: "month は 1〜12 です" }, { status: 400 });
    }

    await savePhaseSchedule(body.phaseId, point);
    return Response.json({ ok: true, phaseId: body.phaseId, point });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
