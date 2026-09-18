"""
Generates the extension toolbar icons (16/32/48/128 px).

Draws a simple three-segment gauge (green / yellow / red) to visually match
the popup's circular gradient gauge. Run with `python3 icons/generate_icons.py`
whenever the icon design needs to change; the generated PNGs are committed
since the extension has no build step.
"""

from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]

GREEN = (34, 197, 94, 255)
YELLOW = (234, 179, 8, 255)
RED = (239, 68, 68, 255)
TRACK = (229, 231, 235, 255)


def make_icon(size: int) -> Image.Image:
    scale = 4  # supersample for smoother arcs, then downsize
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = s * 0.10
    box = [margin, margin, s - margin, s - margin]
    width = max(int(s * 0.16), 2)

    # background track (full ring, faint)
    draw.arc(box, start=0, end=360, fill=TRACK, width=width)

    # three-segment gauge, starting at top (-90deg), clockwise
    draw.arc(box, start=-90, end=30, fill=GREEN, width=width)
    draw.arc(box, start=30, end=150, fill=YELLOW, width=width)
    draw.arc(box, start=150, end=270, fill=RED, width=width)

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    for size in SIZES:
        icon = make_icon(size)
        icon.save(f"icons/icon{size}.png")
        print(f"wrote icons/icon{size}.png")
