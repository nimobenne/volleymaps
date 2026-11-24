"""Draws the VolleyMaps app mark and writes every icon asset from one source.

The mark is the same volleyball as components/Logo.tsx — a ring plus three panel
seams — drawn here in pixel space with a heavier stroke so it survives being
shown at 16px in a browser tab.

Outputs (all committed, none generated at runtime):
  app/favicon.ico    16/32/48/256, what browsers put in the tab
  app/icon.png       256, Next.js App Router picks this up as <link rel="icon">
  app/apple-icon.png 180, iOS home screen / PWA. Square and opaque: iOS applies
                     its own corner mask, so baking rounding in double-rounds it.
  public/icon-512.png 512, maskable PWA install icon

Run after changing the mark:  python scripts/make-icons.py
Needs Pillow (dev-only, not a runtime dependency):  pip install Pillow
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

S = 1024                      # supersampled, downsampled at the end for antialiasing
BG = (28, 25, 23, 255)        # #1c1917, the app's charcoal
AMBER = (245, 166, 35, 255)   # oklch(0.82 0.17 75), the brand primary
C, R, W = S // 2, 340, 56     # ball centre, radius, stroke weight

# Rims of three big off-centre circles. Clipped to the ball, they read as the
# panel seams on a volleyball; unclipped they'd just be arcs floating in the tile.
SEAMS = [(C - 730, C - 250, 620), (C + 250, C + 760, 620), (C + 470, C - 620, 620)]


def disc(radius, center=(C, C)):
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse(
        [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius],
        fill=255,
    )
    return mask


def render(rounded):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if rounded:
        draw.rounded_rectangle([0, 0, S - 1, S - 1], radius=224, fill=BG)
    else:
        draw.rectangle([0, 0, S - 1, S - 1], fill=BG)

    draw.ellipse([C - R, C - R, C + R, C + R], outline=AMBER, width=W)

    seams = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    seam_draw = ImageDraw.Draw(seams)
    for cx, cy, rr in SEAMS:
        seam_draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=AMBER, width=W)

    inside_ball = Image.composite(seams.split()[3], Image.new("L", (S, S), 0), disc(R - W // 2))
    img.paste(seams, (0, 0), inside_ball)
    return img


rounded = render(rounded=True)
square = render(rounded=False)

(ROOT / "public").mkdir(exist_ok=True)

rounded.resize((256, 256), Image.LANCZOS).save(
    ROOT / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)]
)
rounded.resize((256, 256), Image.LANCZOS).save(ROOT / "app" / "icon.png")
square.resize((180, 180), Image.LANCZOS).save(ROOT / "app" / "apple-icon.png")
square.resize((512, 512), Image.LANCZOS).save(ROOT / "public" / "icon-512.png")

print("wrote app/favicon.ico, app/icon.png, app/apple-icon.png, public/icon-512.png")
