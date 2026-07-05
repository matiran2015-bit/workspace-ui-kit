"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductProject } from "@/lib/data/schedule-demo";

type ProductProjectEditorProps = {
  project: ProductProject;
  onChange: (next: ProductProject) => void;
};

export function ProductProjectEditor({
  project,
  onChange,
}: ProductProjectEditorProps) {
  const patchDetail = (partial: Partial<ProductProject["detail"]>) => {
    onChange({ ...project, detail: { ...project.detail, ...partial } });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div>
        <p className="text-[10px] font-semibold text-primary">プロジェクト編集</p>
        <p className="text-[10px] text-muted-foreground">
          ①のタブ名と④の詳細が連動します。7フェーズ構成は標準のままです。
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="project-name" className="text-[10px]">
          プロジェクト名
        </Label>
        <Input
          id="project-name"
          value={project.name}
          onChange={(e) => onChange({ ...project, name: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="project-phase" className="text-[10px]">
          フェーズ概要
        </Label>
        <Input
          id="project-phase"
          value={project.detail.phase}
          onChange={(e) => patchDetail({ phase: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="project-dept" className="text-[10px]">
          関係部門
        </Label>
        <Input
          id="project-dept"
          value={project.detail.departments}
          onChange={(e) => patchDetail({ departments: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="project-note" className="text-[10px]">
          メモ
        </Label>
        <Input
          id="project-note"
          value={project.detail.note}
          onChange={(e) => patchDetail({ note: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
