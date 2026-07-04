#!/usr/bin/env python3
"""
診療放射線技師国家試験 PDF テキスト抽出スクリプト
使い方: python3 scripts/extract_pdf.py 問題.pdf
出力:   問題.txt（入力PDFと同じフォルダ）
"""

import sys
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("エラー: PyMuPDF がインストールされていません。")
    print("  pip3 install pymupdf")
    sys.exit(1)


def extract_text_from_pdf(pdf_path: Path) -> str:
    """PDFから全ページのテキストを結合して返す"""
    doc = fitz.open(str(pdf_path))
    pages = []
    for page in doc:
        text = page.get_text("text")
        pages.append(text)
    doc.close()
    return "\n".join(pages)


def normalize_text(text: str) -> str:
    """全角数字・記号を半角に統一し、余分な空白を整理"""
    text = text.translate(str.maketrans("０１２３４５６７８９", "0123456789"))
    text = text.translate(str.maketrans(
        "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
        "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ",
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    ))
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text


# 「問N」形式（最も信頼性が高い）
RE_MON = re.compile(r'問\s*題?\s*(\d{1,3})\b')

# 行頭に単独で現れる問題番号（選択肢 1〜5 と区別するため、直後が改行またはスペースのみ）
# 例: "6\n" "10 " など。"1．" や "1." は選択肢なので除外
RE_LINENUM = re.compile(r'^[ \t]*(\d{1,3})[ \t]*\n', re.MULTILINE)


def _extract_by_pattern(text: str, pattern: re.Pattern) -> list[tuple[int, str]]:
    """patternで問題境界を検出し [(番号, 本文)] を返す"""
    matches = list(pattern.finditer(text))
    if not matches:
        return []
    result = []
    for i, m in enumerate(matches):
        num = int(m.group(1))
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        result.append((num, body))
    return result


def split_into_questions(text: str) -> list[tuple[int, str]]:
    """
    テキストを問題番号ごとに分割する。
    戻り値: [(問題番号, 本文テキスト), ...]
    """
    # 優先: 「問N」形式
    questions = _extract_by_pattern(text, RE_MON)
    if questions:
        # 範囲チェック（1〜200の問題番号のみ残す）
        questions = [(n, b) for n, b in questions if 1 <= n <= 200]
        if questions:
            return questions

    # フォールバック: 行頭単独数字（1〜200 かつ 連番らしいものだけ残す）
    candidates = _extract_by_pattern(text, RE_LINENUM)
    candidates = [(n, b) for n, b in candidates if 1 <= n <= 200]

    if not candidates:
        return []

    # 連番フィルタ: 前後の番号との差が10以内のものだけ採用
    nums = [n for n, _ in candidates]
    kept = []
    for i, (n, b) in enumerate(candidates):
        prev_ok = i == 0 or abs(n - nums[i - 1]) <= 10
        next_ok = i == len(candidates) - 1 or abs(n - nums[i + 1]) <= 10
        if prev_ok or next_ok:
            kept.append((n, b))

    return kept


def format_output(questions: list[tuple[int, str]], source_name: str) -> str:
    """問題リストを出力用テキストに整形"""
    lines = [
        f"# {source_name}",
        f"# 抽出問題数: {len(questions)}",
        "=" * 60,
        "",
    ]
    for q_num, body in sorted(questions, key=lambda x: x[0]):
        lines.append(f"【問{q_num}】")
        lines.append(body)
        lines.append("")
        lines.append("-" * 40)
        lines.append("")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("使い方: python3 scripts/extract_pdf.py 問題.pdf")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"エラー: ファイルが見つかりません: {pdf_path}")
        sys.exit(1)
    if pdf_path.suffix.lower() != ".pdf":
        print(f"エラー: PDFファイルを指定してください: {pdf_path}")
        sys.exit(1)

    out_path = pdf_path.with_suffix(".txt")

    print(f"読み込み中: {pdf_path}")
    raw = extract_text_from_pdf(pdf_path)
    text = normalize_text(raw)

    print("問題を分割中...")
    questions = split_into_questions(text)

    if not questions:
        print("警告: 問題番号が自動検出できませんでした。生テキストを出力します。")
        out_path.write_text(text, encoding="utf-8")
    else:
        print(f"検出した問題数: {len(questions)}")
        output = format_output(questions, pdf_path.name)
        out_path.write_text(output, encoding="utf-8")

    print(f"出力完了: {out_path}")


if __name__ == "__main__":
    main()
