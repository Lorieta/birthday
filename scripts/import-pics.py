#!/usr/bin/env python3

import hashlib
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "PICS"
PHOTOS_OUT = ROOT / "public" / "photos"
VIDEOS_OUT = ROOT / "public" / "videos"
POSTERS_OUT = VIDEOS_OUT / "posters"
MANIFEST = ROOT / "lib" / "pics-manifest.ts"

PHOTO_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4", ".mov"}
MAX_PHOTO_EDGE = 2000
PHOTO_QUALITY = 82


def fail(message: str) -> None:
    raise SystemExit(message)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def short_id(prefix: str, value: str) -> str:
    return f"{prefix}-{hashlib.sha1(value.encode()).hexdigest()[:10]}"


def unique_stem(stem: str, used: set[str]) -> str:
    candidate = stem
    index = 2
    while candidate.lower() in used:
        candidate = f"{stem}-{index}"
        index += 1
    used.add(candidate.lower())
    return candidate


def probe_video(path: Path) -> tuple[int, int, float]:
    output = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height:format=duration",
            "-of",
            "json",
            str(path),
        ],
        text=True,
    )
    payload = json.loads(output)
    stream = payload["streams"][0]
    duration = float(payload.get("format", {}).get("duration", 0))
    return int(stream["width"]), int(stream["height"]), duration


def run_ffmpeg(args: list[str], label: str) -> None:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail(f"{label} failed:\n{result.stderr.strip()}")


def main() -> None:
    if not SOURCE.is_dir():
        fail(f"Missing source folder: {SOURCE}")

    for path in (PHOTOS_OUT, VIDEOS_OUT, POSTERS_OUT):
        if path.exists():
            shutil.rmtree(path)
        path.mkdir(parents=True, exist_ok=True)

    photo_files = sorted(
        path for path in SOURCE.iterdir() if path.suffix.lower() in PHOTO_EXTS
    )
    video_files = sorted(
        path for path in SOURCE.iterdir() if path.suffix.lower() in VIDEO_EXTS
    )

    used_stems: set[str] = set()
    photo_entries: list[dict] = []
    video_entries: list[dict] = []
    seen_videos: set[str] = set()

    for index, path in enumerate(photo_files, start=1):
        image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        image.thumbnail((MAX_PHOTO_EDGE, MAX_PHOTO_EDGE), Image.Resampling.LANCZOS)

        stem = unique_stem(path.stem, used_stems)
        output = PHOTOS_OUT / f"{stem}.webp"
        image.save(output, "WEBP", quality=PHOTO_QUALITY, method=6)

        photo_entries.append(
            {
                "id": short_id("photo", path.name),
                "kind": "image",
                "src": f"/photos/{output.name}",
                "width": image.width,
                "height": image.height,
                "alt": "A scrapbook photo",
            }
        )
        print(f"[photo {index:02d}/{len(photo_files)}] {path.name}")

    for index, path in enumerate(video_files, start=1):
        digest = sha256(path)
        if digest in seen_videos:
            print(f"[video {index:02d}/{len(video_files)}] skipped duplicate {path.name}")
            continue
        seen_videos.add(digest)

        width, height, duration = probe_video(path)
        stem = unique_stem(path.stem, used_stems)
        output = VIDEOS_OUT / f"{stem}.mp4"
        poster = POSTERS_OUT / f"{stem}.jpg"

        shutil.copy2(path, output)

        run_ffmpeg(
            [
                "-ss",
                "0.5",
                "-i",
                str(path),
                "-frames:v",
                "1",
                "-vf",
                "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
                "-q:v",
                "3",
                str(poster),
            ],
            f"Poster {path.name}",
        )

        video_entries.append(
            {
                "id": short_id("video", path.name),
                "kind": "video",
                "src": f"/videos/{output.name}",
                "poster": f"/videos/posters/{poster.name}",
                "width": width,
                "height": height,
                "duration": round(duration, 1),
                "alt": "A scrapbook video",
            }
        )
        print(f"[video {index:02d}/{len(video_files)}] {path.name}")

    manifest = (
        "export interface ImportedMedia {\n"
        '  id: string;\n'
        '  kind: "image" | "video";\n'
        "  src: string;\n"
        "  poster?: string;\n"
        "  width: number;\n"
        "  height: number;\n"
        "  duration?: number;\n"
        "  alt: string;\n"
        "}\n\n"
        "export const importedPhotos: ImportedMedia[] = "
        + json.dumps(photo_entries, indent=2)
        + ";\n\n"
        "export const importedVideos: ImportedMedia[] = "
        + json.dumps(video_entries, indent=2)
        + ";\n"
    )
    MANIFEST.write_text(manifest)

    print(
        f"\nImported {len(photo_entries)} photos and {len(video_entries)} videos.\n"
        f"Manifest: {MANIFEST.relative_to(ROOT)}\n"
        f"Photos: {PHOTOS_OUT.relative_to(ROOT)}\n"
        f"Videos: {VIDEOS_OUT.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
