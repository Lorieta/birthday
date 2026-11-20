#!/usr/bin/env python3

import json
import shutil
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "scrapbook" / "art"
CONTACT = OUT / "contact-sheet.jpg"
MANIFEST = OUT / "manifest.json"

SHEET_CANDIDATES = [
    ROOT / "PICS" / "Assets" / "Assets_sheets.png",
    ROOT / "PICS" / "Assets" / "Asets_sheets.png",
    ROOT / "Assets" / "Assets_sheets.png",
    ROOT / "Assets" / "Asets_sheets.png",
]

PADDING = 10
CONTACT_CELL = 220
CONTACT_COLUMNS = 5

LAYOUT = [
    ("couple-hug", 8, 12, 340, 272),
    ("couple-kiss", 312, 10, 650, 278),
    ("couple-peace", 636, 10, 982, 278),
    ("strawberry", 928, 22, 1036, 150),
    ("matcha", 1036, 8, 1172, 220),
    ("bow-large", 1180, 8, 1328, 172),
    ("cat-hang", 1330, 76, 1536, 220),
    ("flower", 1166, 134, 1232, 200),
    ("sparkle", 1144, 190, 1202, 252),
    ("girl-shy", 6, 268, 300, 524),
    ("boy-shy", 300, 268, 536, 522),
    ("couple-drinks", 560, 270, 940, 538),
    ("leaf", 842, 548, 916, 666),
    ("camera", 700, 542, 826, 650),
    ("bow-small", 584, 530, 690, 642),
    ("cat-sleep", 380, 508, 562, 646),
    ("heart", 235, 535, 305, 636),
    ("good-luck", 14, 518, 252, 578),
    ("take-care", 14, 582, 245, 642),
    ("you-got-this", 14, 646, 245, 704),
    ("little-moments", 360, 642, 560, 712),
    ("flower-left", 330, 850, 392, 936),
    ("flower-center", 422, 850, 510, 940),
    ("leaf-bottom", 598, 840, 668, 928),
    ("cat-cream", 312, 714, 462, 826),
    ("cat-black", 472, 714, 616, 826),
    ("cat-tabby", 618, 708, 758, 832),
    ("green-heart-strawberry", 746, 716, 878, 848),
    ("bow-bottom", 738, 850, 836, 936),
    ("washi-pink-gingham", 16, 710, 250, 751),
    ("washi-green-gingham", 16, 758, 250, 800),
    ("washi-pink-x", 12, 794, 306, 846),
    ("washi-green-hearts", 12, 840, 306, 896),
    ("washi-pink-stripe", 12, 890, 306, 946),
]


def fail(message: str) -> None:
    raise SystemExit(message)


def load_sheet() -> Image.Image:
    sheet = next((path for path in SHEET_CANDIDATES if path.is_file()), None)
    if sheet is None:
        fail(
            "Missing sticker sheet. Expected PICS/Assets/Assets_sheets.png "
            "or PICS/Assets/Asets_sheets.png."
        )
    return Image.open(sheet).convert("RGBA")


def dilate(mask: np.ndarray, rounds: int = 1) -> np.ndarray:
    for _ in range(rounds):
        padded = np.pad(mask, 1)
        mask = (
            padded[:-2, 1:-1]
            | padded[2:, 1:-1]
            | padded[1:-1, :-2]
            | padded[1:-1, 2:]
            | padded[:-2, :-2]
            | padded[:-2, 2:]
            | padded[2:, :-2]
            | padded[2:, 2:]
        )
    return mask


def barrier_mask(rgba: np.ndarray) -> np.ndarray:
    rgb = rgba[:, :, :3]
    white = (
        (rgb[:, :, 0] >= 230)
        & (rgb[:, :, 1] >= 226)
        & (rgb[:, :, 2] >= 222)
    )
    return dilate(white, 2)


def keep_largest_component(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    labels = np.zeros(mask.shape, dtype=np.int32)
    areas = [0]
    label = 0

    for start_y, start_x in np.argwhere(mask):
        if labels[start_y, start_x]:
            continue

        label += 1
        labels[start_y, start_x] = label
        queue: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        area = 0

        while queue:
            y, x = queue.popleft()
            area += 1
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if mask[next_y, next_x] and not labels[next_y, next_x]:
                        labels[next_y, next_x] = label
                        queue.append((next_y, next_x))

        areas.append(area)

    if label == 0:
        return mask

    largest = int(np.argmax(areas[1:])) + 1
    return labels == largest


def foreground_mask(rgba: np.ndarray) -> np.ndarray:
    barrier = barrier_mask(rgba)
    height, width = barrier.shape
    visited = np.zeros_like(barrier, dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        for y in (0, height - 1):
            if not barrier[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if not barrier[y, x] and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if (
                0 <= next_y < height
                and 0 <= next_x < width
                and not barrier[next_y, next_x]
                and not visited[next_y, next_x]
            ):
                visited[next_y, next_x] = True
                queue.append((next_y, next_x))

    return keep_largest_component(~visited)


def remove_background(crop: Image.Image) -> Image.Image:
    rgba = np.asarray(crop.convert("RGBA"), dtype=np.uint8).copy()
    alpha = np.where(foreground_mask(rgba), 255, 0).astype(np.uint8)
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def trim(image: Image.Image, padding: int = 8) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    points = np.argwhere(alpha > 0)
    if not len(points):
        return image

    min_y, min_x = points.min(axis=0)
    max_y, max_x = points.max(axis=0)
    cropped = image.crop((int(min_x), int(min_y), int(max_x) + 1, int(max_y) + 1))
    padded = Image.new(
        "RGBA",
        (cropped.width + padding * 2, cropped.height + padding * 2),
        (0, 0, 0, 0),
    )
    padded.alpha_composite(cropped, (padding, padding))
    return padded


def make_contact_sheet(entries: list[dict], images: dict[str, Image.Image]) -> None:
    cell = CONTACT_CELL
    columns = CONTACT_COLUMNS
    rows = max(1, (len(entries) + columns - 1) // columns)
    sheet = Image.new("RGB", (columns * cell, rows * cell), "#f7efe7")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=14)

    for index, entry in enumerate(entries):
        image = images[entry["name"]]
        thumb = image.copy()
        thumb.thumbnail((cell - 20, cell - 46), Image.Resampling.LANCZOS)
        column = index % columns
        row = index // columns
        x = column * cell + (cell - thumb.width) // 2
        y = row * cell + 8 + (cell - 36 - thumb.height) // 2
        sheet.paste(thumb, (x, y), thumb)
        draw.text(
            (column * cell + 8, row * cell + cell - 30),
            entry["name"],
            fill="#6b453c",
            font=font,
        )

    sheet.save(CONTACT, "JPEG", quality=90)


def main() -> None:
    image = load_sheet()

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    entries = []
    images = {}

    for name, left, top, right, bottom in LAYOUT:
        left = max(0, left - PADDING)
        top = max(0, top - PADDING)
        right = min(image.width, right + PADDING)
        bottom = min(image.height, bottom + PADDING)

        sticker = trim(remove_background(image.crop((left, top, right, bottom))))
        filename = f"{name}.webp"
        sticker.save(OUT / filename, "WEBP", quality=95, method=6)

        images[name] = sticker
        entries.append(
            {
                "name": name,
                "file": filename,
                "width": sticker.width,
                "height": sticker.height,
                "source": {
                    "left": left,
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                },
            }
        )
        print(f"{name:24s} {sticker.width:4d}x{sticker.height:<4d} {filename}")

    make_contact_sheet(entries, images)
    MANIFEST.write_text(json.dumps(entries, indent=2) + "\n")

    print(
        f"\nExtracted {len(entries)} assets.\n"
        f"Art: {OUT.relative_to(ROOT)}\n"
        f"Contact sheet: {CONTACT.relative_to(ROOT)}\n"
        f"Manifest: {MANIFEST.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
