import fitz  # PyMuPDF
import os
from pathlib import Path

PDF_DIR = Path.home() / "rt-kokushi" / "pdfs"
OUTPUT_DIR = PDF_DIR / "images"
OUTPUT_DIR.mkdir(exist_ok=True)

DPI = 150
MATRIX = fitz.Matrix(DPI / 72, DPI / 72)

EXAMS = ["73", "74", "75", "76", "77"]
SESSIONS = ["AM", "PM"]

def extract_pdf(pdf_path: Path, output_prefix: str):
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc, start=1):
        out_path = OUTPUT_DIR / f"{output_prefix}_p{i}.png"
        pix = page.get_pixmap(matrix=MATRIX)
        pix.save(out_path)
    print(f"  {pdf_path.name}: {len(doc)} pages -> {output_prefix}_p*.png")
    doc.close()

for exam in EXAMS:
    for session in SESSIONS:
        # 問題PDF
        pdf = PDF_DIR / f"{exam}{session}.pdf"
        if pdf.exists():
            extract_pdf(pdf, f"{exam}_{session}")
        else:
            print(f"  SKIP (not found): {pdf.name}")

        # 別冊PDF
        image_pdf = PDF_DIR / f"{exam}{session}image.pdf"
        if image_pdf.exists():
            extract_pdf(image_pdf, f"{exam}_{session}_image")
        else:
            print(f"  SKIP (not found): {image_pdf.name}")

print(f"\nDone. Images saved to: {OUTPUT_DIR}")
