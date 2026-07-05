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
  formatPeriodLabel,
  parseMonthKey,
  toMonthKey,
  type GroupEvent,
  type PhaseSchedulePoint,
} from "@/lib/data/schedule-demo";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

type GroupEventEditorProps = {
  event: GroupEvent;
  productTags: string[];
  onChange: (next: GroupEvent) => void;
};

function monthPointFromKey(key: string): PhaseSchedulePoint {
  return parseMonthKey(key);
}

export function GroupEventEditor({
  event,
  productTags,
  onChange,
}: GroupEventEditorProps) {
  const start = monthPointFromKey(event.startKey);
  const end = monthPointFromKey(event.endKey);

  const patch = (partial: Partial<GroupEvent>) => {
    onChange({ ...event, ...partial });
  };

  const patchDetail = (partial: Partial<GroupEvent["detail"]>) => {
    onChange({ ...event, detail: { ...event.detail, ...partial } });
  };

  const patchStart = (partial: Partial<PhaseSchedulePoint>) => {
    const next = { ...start, ...partial };
    const startKey = toMonthKey(next);
    const endKey =
      parseMonthKey(event.endKey).year * 12 + parseMonthKey(event.endKey).month <
      next.year * 12 + next.month
        ? startKey
        : event.endKey;
    patch({ startKey, endKey });
  };

  const patchEnd = (partial: Partial<PhaseSchedulePoint>) => {
    const next = { ...end, ...partial };
    const endKey = toMonthKey(next);
    patch({ endKey });
  };

  const preview = formatPeriodLabel(event.startKey, event.endKey);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div>
        <p className="text-[10px] font-semibold text-primary">イベント編集</p>
        <p className="text-[10px] text-muted-foreground">
          ②のガント位置と④の詳細が連動します。変更は自動で保存されます。
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="event-title" className="text-[10px]">
          タイトル
        </Label>
        <Input
          id="event-title"
          value={event.title}
          onChange={(e) => patch({ title: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="event-date" className="text-[10px]">
          日付（表示用）
        </Label>
        <Input
          id="event-date"
          value={event.date}
          onChange={(e) => patch({ date: e.target.value })}
          className="h-8 text-xs"
          placeholder="3/18"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[10px]">影響製品タグ</Label>
        <Select
          value={event.productTag}
          onValueChange={(v) => v && patch({ productTag: v })}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag === "both" ? "both（共通）" : `${tag}（プロジェクト ${tag}）`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 text-[10px] font-medium text-muted-foreground">
          開始月
        </div>
        <Input
          type="number"
          min={2020}
          max={2035}
          value={start.year}
          onChange={(e) =>
            patchStart({ year: Number(e.target.value) || start.year })
          }
          className="h-8 text-xs"
        />
        <Select
          value={String(start.month)}
          onValueChange={(v) => patchStart({ month: Number(v) })}
        >
          <SelectTrigger className="h-8 w-full text-xs">
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

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 text-[10px] font-medium text-muted-foreground">
          終了月
        </div>
        <Input
          type="number"
          min={2020}
          max={2035}
          value={end.year}
          onChange={(e) =>
            patchEnd({ year: Number(e.target.value) || end.year })
          }
          className="h-8 text-xs"
        />
        <Select
          value={String(end.month)}
          onValueChange={(v) => patchEnd({ month: Number(v) })}
        >
          <SelectTrigger className="h-8 w-full text-xs">
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="event-impact" className="text-[10px]">
          影響製品（詳細）
        </Label>
        <Input
          id="event-impact"
          value={event.detail.impact}
          onChange={(e) => patchDetail({ impact: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="event-owner" className="text-[10px]">
          担当窓口
        </Label>
        <Input
          id="event-owner"
          value={event.detail.owner}
          onChange={(e) => patchDetail({ owner: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="event-note" className="text-[10px]">
          メモ
        </Label>
        <Input
          id="event-note"
          value={event.detail.note}
          onChange={(e) => patchDetail({ note: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <p className="rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium">
        期間表示: {preview}
      </p>
    </div>
  );
}
