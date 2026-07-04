import csv
import os
from pathlib import Path
from supabase import create_client

SUPABASE_URL = "https://mknqidpqnnfdxaszfomw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnFpZHBxbm5mZHhhc3pmb213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzc0NzAsImV4cCI6MjA5NjE1MzQ3MH0.GjCSu2gOVKnQCAXGMYb_Ts4XVJpX7sKAGIcuzFWFJAQ"
OUTPUT_PATH = Path.home() / "rt-kokushi" / "pdfs" / "image_mapping.csv"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = (
    client.table("questions")
    .select("id, year, exam_num, question_order, question")
    .or_(
        "question.like.%別に示す%,"
        "question.like.%図に示す%,"
        "question.like.%下図%,"
        "question.like.%回路図%,"
        "question.like.%波形%"
    )
    .order("year")
    .order("question_order")
    .execute()
)

rows = response.data
print(f"該当件数: {len(rows)} 件")

with open(OUTPUT_PATH, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["id", "year", "exam_num", "question_order", "question", "image_filename"],
    )
    writer.writeheader()
    for row in rows:
        row["image_filename"] = ""
        writer.writerow(row)

print(f"保存完了: {OUTPUT_PATH}")
