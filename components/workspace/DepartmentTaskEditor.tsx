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
import type { DepartmentTask } from "@/lib/data/schedule-demo";

const STATUS_OPTIONS: DepartmentTask["status"][] = [
  "未着手",
  "進行中",
  "完了",
];

type DepartmentTaskEditorProps = {
  task: DepartmentTask;
  onChange: (next: DepartmentTask) => void;
};

export function DepartmentTaskEditor({
  task,
  onChange,
}: DepartmentTaskEditorProps) {
  const patch = (partial: Partial<DepartmentTask>) => {
    onChange({ ...task, ...partial });
  };

  const patchDetail = (partial: Partial<DepartmentTask["detail"]>) => {
    onChange({ ...task, detail: { ...task.detail, ...partial } });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div>
        <p className="text-[10px] font-semibold text-primary">タスク編集</p>
        <p className="text-[10px] text-muted-foreground">
          ③のリストと④の詳細が連動します。変更は自動で保存されます。
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="task-title" className="text-[10px]">
          タイトル
        </Label>
        <Input
          id="task-title"
          value={task.title}
          onChange={(e) => patch({ title: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[10px]">ステータス</Label>
        <Select
          value={task.status}
          onValueChange={(v) =>
            patch({ status: v as DepartmentTask["status"] })
          }
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="task-due" className="text-[10px]">
          期限
        </Label>
        <Input
          id="task-due"
          value={task.due}
          onChange={(e) => patch({ due: e.target.value })}
          className="h-8 text-xs"
          placeholder="3/28"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="task-assignee" className="text-[10px]">
          担当
        </Label>
        <Input
          id="task-assignee"
          value={task.detail.assignee}
          onChange={(e) => patchDetail({ assignee: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="task-blocker" className="text-[10px]">
          ブロッカー
        </Label>
        <Input
          id="task-blocker"
          value={task.detail.blocker}
          onChange={(e) => patchDetail({ blocker: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="task-note" className="text-[10px]">
          メモ
        </Label>
        <Input
          id="task-note"
          value={task.detail.note}
          onChange={(e) => patchDetail({ note: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
