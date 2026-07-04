"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatSchedulePoint,
  type PhaseSchedulePoint,
} from "@/lib/data/schedule-demo";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

type PhaseScheduleEditorProps = {
  phaseLabel: string;
  point: PhaseSchedulePoint;
  onChange: (next: PhaseSchedulePoint) => void;
};

export function PhaseScheduleEditor({
  phaseLabel,
  point,
  onChange,
}: PhaseScheduleEditorProps) {
  const patch = (partial: Partial<PhaseSchedulePoint>) => {
    onChange({ ...point, ...partial });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div>
        <p className="text-[10px] font-semibold text-primary">実施ポイント（年・月）</p>
        <p className="text-[10px] text-muted-foreground">
          {phaseLabel} がいつあるかを1点で指定します。①のタイムライン上の丸位置も連動します。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="point-year" className="text-[10px]">
            年
          </Label>
          <Input
            id="point-year"
            type="number"
            min={2020}
            max={2035}
            value={point.year}
            onChange={(e) =>
              patch({ year: Number(e.target.value) || point.year })
            }
            className="h-8 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="point-month" className="text-[10px]">
            月
          </Label>
          <Select
            value={String(point.month)}
            onValueChange={(v) => patch({ month: Number(v) })}
          >
            <SelectTrigger id="point-month" className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium">
        表示: {formatSchedulePoint(point)}
      </p>
    </div>
  );
}
