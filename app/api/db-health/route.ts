import { getSql } from "@/lib/db";

/** ステップ②確認用：Neon への接続が通るかだけを見る */
export async function GET() {
  try {
    const sql = getSql();
    const rows = await sql`SELECT 1 AS ok`;
    return Response.json({
      ok: true,
      message: "Neon への接続に成功しました",
      result: rows[0],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return Response.json({ ok: false, message }, { status: 500 });
  }
}
