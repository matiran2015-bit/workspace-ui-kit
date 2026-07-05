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
  type ChartColor,
  type PhaseDefinition,
  type PhaseSchedulePoint,
} from "@/lib/data/schedule-demo";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const COLOR_OPTIONS: { value: ChartColor; label: string }[] = [
  { value: "chart-1", label: "色1" },
  { value: "chart-2", label: "色2" },
  { value: "chart-3", label: "色3" },
  { value: "chart-4", label: "色4" },
  { value: "chart-5", label: "色5" },
];

export type PhaseEditorValue = {
  definition: PhaseDefinition;
  point: PhaseSchedulePoint;
};

type PhaseScheduleEditorProps = {
  value: PhaseEditorValue;
  onChange: (next: PhaseEditorValue) => void;
};

export function PhaseScheduleEditor({ value, onChange }: PhaseScheduleEditorProps) {
  const patchPoint = (partial: Partial<PhaseSchedulePoint>) => {
    onChange({ ...value, point: { ...value.point, ...partial } });
  };

  const patchDefinition = (partial: Partial<PhaseDefinition>) => {
    onChange({
      ...value,
      definition: { ...value.definition, ...partial },
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div>
        <p className="text-[10px] font-semibold text-primary">フェーズ編集</p>
        <p className="text-[10px] text-muted-foreground">
          ①の表示名（企画書A、PMT 等）と実施ポイント（年・月）を編集します。変更は自動で保存されます。
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="phase-label" className="text-[10px]">
          フェーズ名
        </Label>
        <Input
          id="phase-label"
          value={value.definition.label}
          onChange={(e) => patchDefinition({ label: e.target.value })}
          className="h-8 text-xs"
          placeholder="企画書A"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[10px]">表示色</Label>
        <Select
          value={value.definition.color}
          onValueChange={(v) => v && patchDefinition({ color: v as ChartColor })}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            value={value.point.year}
            onChange={(e) =>
              patchPoint({ year: Number(e.target.value) || value.point.year })
            }
            className="h-8 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="point-month" className="text-[10px]">
            月
          </Label>
          <Select
            value={String(value.point.month)}
            onValueChange={(v) => patchPoint({ month: Number(v) })}
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
        表示: {value.definition.label} — {formatSchedulePoint(value.point)}
      </p>
    </div>
  );
}
