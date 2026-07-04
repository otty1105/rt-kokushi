import csv
import sys
from pathlib import Path
from supabase import create_client

SUPABASE_URL = "https://mknqidpqnnfdxaszfomw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnFpZHBxbm5mZHhhc3pmb213Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU3NzQ3MCwiZXhwIjoyMDk2MTUzNDcwfQ.t6etpqF6gBviGNlgLn8cIK2YU0SnEVMP11ExIzyNu3E"
BUCKET = "question-images"
CSV_PATH = Path.home() / "rt-kokushi" / "pdfs" / "image_mapping.csv"
IMAGES_DIR = Path.home() / "rt-kokushi" / "pdfs" / "images"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# CSVを読み込み、image_filenameが入力済みの行だけ対象にする
with open(CSV_PATH, encoding="utf-8-sig") as f:
    rows = [r for r in csv.DictReader(f) if r["image_filename"].strip()]

if not rows:
    print("image_filenameが入力されている行がありません。CSVを確認してください。")
    sys.exit(0)

# idが空の行はquestions テーブルから逆引きして補完する
for r in rows:
    if not r["id"].strip():
        res = (
            client.table("questions")
            .select("id")
            .eq("year", int(r["year"]))
            .eq("exam_num", int(r["exam_num"]))
            .eq("question_order", int(r["question_order"]))
            .single()
            .execute()
        )
        r["id"] = res.data["id"] if res.data else ""

print(f"処理対象: {len(rows)} 件")
for r in rows:
    filenames = [fn.strip() for fn in r["image_filename"].split(",") if fn.strip()]
    status = "" if r["id"] else " [ID未解決・スキップ予定]"
    print(f"  id={r['id']}  {filenames}{status}")

ans = input("\nアップロードを実行しますか？ [y/N]: ").strip().lower()
if ans != "y":
    print("キャンセルしました。")
    sys.exit(0)

ok, ng = 0, 0
for r in rows:
    filenames = [fn.strip() for fn in r["image_filename"].split(",") if fn.strip()]
    record_id = r["id"].strip()

    if not record_id:
        print(f"[SKIP] IDが解決できませんでした: {filenames}")
        ng += 1
        continue

    # 全ファイルの存在確認
    missing = [fn for fn in filenames if not (IMAGES_DIR / fn).exists()]
    if missing:
        for fn in missing:
            print(f"[SKIP] ファイルが見つかりません: {IMAGES_DIR / fn}")
        ng += 1
        continue

    # 全画像をStorageにアップロードしてURLを取得
    public_urls = []
    upload_failed = False
    for filename in filenames:
        image_path = IMAGES_DIR / filename
        with open(image_path, "rb") as f:
            try:
                client.storage.from_(BUCKET).upload(
                    path=filename,
                    file=f,
                    file_options={"content-type": "image/png", "upsert": "true"},
                )
            except Exception as e:
                print(f"[ERROR] アップロード失敗: {filename}  {e}")
                upload_failed = True
                break
        public_urls.append(client.storage.from_(BUCKET).get_public_url(filename))

    if upload_failed:
        ng += 1
        continue

    # questions テーブルの image_url を最初の画像URLで更新
    client.table("questions").update({"image_url": public_urls[0]}).eq("id", record_id).execute()

    # question_images テーブルの既存データを削除してから全画像を挿入
    client.table("question_images").delete().eq("question_id", record_id).execute()
    insert_rows = [
        {"question_id": record_id, "image_url": url, "display_order": idx + 1}
        for idx, url in enumerate(public_urls)
    ]
    client.table("question_images").insert(insert_rows).execute()

    print(f"[OK] id={record_id}  {filenames}  ({len(filenames)}枚)")
    ok += 1

print(f"\n完了: 成功 {ok} 件 / スキップ {ng} 件")
