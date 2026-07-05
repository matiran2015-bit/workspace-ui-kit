import {
  savePhaseDefinition,
  savePhaseSchedule,
} from "@/lib/db/schedule-repository";
import type { ChartColor, PhaseSchedulePoint } from "@/lib/data/schedule-demo";

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      phaseId?: string;
      year?: number;
      month?: number;
      label?: string;
      color?: ChartColor;
    };

    if (!body.phaseId) {
      return Response.json({ error: "phaseId が必要です" }, { status: 400 });
    }

    if (body.year != null && body.month != null) {
      const point: PhaseSchedulePoint = {
        year: Number(body.year),
        month: Number(body.month),
      };

      if (point.month < 1 || point.month > 12) {
        return Response.json({ error: "month は 1〜12 です" }, { status: 400 });
      }

      await savePhaseSchedule(body.phaseId, point);
    }

    if (body.label != null && body.color != null) {
      await savePhaseDefinition(body.phaseId, {
        label: body.label,
        color: body.color,
      });
    }

    return Response.json({ ok: true, phaseId: body.phaseId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
