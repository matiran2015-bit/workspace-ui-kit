import { neon } from "@neondatabase/serverless";

/** Neon（Postgres）への接続。DATABASE_URL 環境変数が必要。 */
export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL が設定されていません。.env.local に Vercel からコピーした接続文字列を入れてください。",
    );
  }
  return neon(databaseUrl);
}
