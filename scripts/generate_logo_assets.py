"""ロゴ画像(IMG_2102.jpg)からfavicon/apple-touch-icon/OGP画像/ヘッダー用透過ロゴを生成する。
一度実行すれば public/ 配下に成果物が残るため、以後は再実行不要。
"""
from PIL import Image

SRC = 'IMG_2102.jpg'
OUT_DIR = 'public'

im = Image.open(SRC).convert('RGB')
w, h = im.size

# --- 非黒領域（ロゴ本体）のバウンディングボックスを検出してタイトにクロップ ---
gray = im.convert('L')
threshold = 12
bbox = gray.point(lambda p: 255 if p > threshold else 0).getbbox()
pad = 20
left = max(bbox[0] - pad, 0)
top = max(bbox[1] - pad, 0)
right = min(bbox[2] + pad, w)
bottom = min(bbox[3] + pad, h)
cropped = im.crop((left, top, right, bottom))
cw, ch = cropped.size
print('cropped size:', cw, ch)

def to_transparent(src_rgb):
    rgba = src_rgb.convert('RGBA')
    pixels = rgba.load()
    sw, sh = rgba.size
    for y in range(sh):
        for x in range(sw):
            r, g, b, _ = pixels[x, y]
            alpha = max(r, g, b)  # 明るさ(=白さ)をそのままアルファに
            pixels[x, y] = (255, 255, 255, alpha)
    return rgba

# --- 透過ロゴ（ヘッダー用：「MediOut」ワードマークのみ、タグライン無し） ---
# 元画像を行ごとにスキャンし、ワードマーク行とタグライン行の間の空白行で分離する
gray_full = im.convert('L')
threshold2 = 12
row_has_content = [
    max(gray_full.getpixel((x, y)) for x in range(0, w, 4)) > threshold2
    for y in range(h)
]
transitions = [y for y in range(1, h) if row_has_content[y] != row_has_content[y - 1]]
# 最初の連続した非黒領域（ワードマーク行）の開始/終了（縦方向のみ、余白なし）
band_top, band_bottom = transitions[0], transitions[1]
# その帯の中で横方向のバウンディングボックスを検出
band = im.crop((0, band_top, w, band_bottom))
band_gray = band.convert('L').point(lambda p: 255 if p > threshold2 else 0)
wl, _, wr, _ = band_gray.getbbox()
word_pad = 16
wordmark = im.crop((
    max(wl - word_pad, 0),
    max(band_top - word_pad, 0),
    min(wr + word_pad, w),
    min(band_bottom + word_pad, h),
))
header_transparent = to_transparent(wordmark)
header_transparent.save(f'{OUT_DIR}/logo-header.png')
print('saved logo-header.png', header_transparent.size)

# --- 正方形パディング版（黒背景維持）: favicon / apple-touch-icon / OGP のベース ---
square_size = max(cw, ch)
square = Image.new('RGB', (square_size, square_size), (0, 0, 0))
square.paste(cropped, ((square_size - cw) // 2, (square_size - ch) // 2))

# favicon.ico (16/32/48)
favicon_sizes = [(16, 16), (32, 32), (48, 48)]
square.save(f'{OUT_DIR}/favicon.ico', sizes=favicon_sizes)
print('saved favicon.ico')

# apple-touch-icon.png (180x180)
apple_icon = square.resize((180, 180), Image.LANCZOS)
apple_icon.save(f'{OUT_DIR}/apple-touch-icon.png')
print('saved apple-touch-icon.png')

# --- OGP画像 (1200x630) ---
og_w, og_h = 1200, 630
og = Image.new('RGB', (og_w, og_h), (0, 0, 0))
# ロゴが横長なので、幅基準で収まるようスケーリング(左右に余白を持たせる)
target_w = int(og_w * 0.72)
scale = target_w / cw
target_h = int(ch * scale)
if target_h > og_h * 0.8:
    scale = (og_h * 0.8) / ch
    target_w = int(cw * scale)
    target_h = int(og_h * 0.8)
resized_logo = cropped.resize((target_w, target_h), Image.LANCZOS)
og.paste(resized_logo, ((og_w - target_w) // 2, (og_h - target_h) // 2))
og.save(f'{OUT_DIR}/og-image.png')
print('saved og-image.png', og.size)
