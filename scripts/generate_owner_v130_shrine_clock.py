#!/usr/bin/env python3
"""Rebuild only the photographed dial's hand-covered pixels; never modify shrine geometry.

Input is the exact 768x576 owner-approved handoff WebP (Git blob 244e8c1...).
The other owner-provided animated files are references, not runtime playback.
This one-time deterministic preparation creates the small static offline WebP;
the actual moving hands and selected light are implemented in HTML/SVG/JS.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design/owner-v130-shrine-clock/ImamAliClock-APP-768w.webp"
OUTPUT = ROOT / "app/src/main/assets/images/pmm_shrine_clock_clean.webp"

raw = np.asarray(Image.open(SOURCE).convert("RGB"))
assert raw.shape == (576, 768, 3), raw.shape
out = raw.copy()
cx, cy = 404, 256

# The original physical hands extend beyond the inner ring into a small left arc.
# Replace only this obscured corridor with a mirror sample of the undamaged
# symmetrical Roman-clock band; frame, tile work and shrine are never painted.
mask_pil = Image.new("L", (768, 576), 0)
draw = ImageDraw.Draw(mask_pil)
draw.polygon([(330, 224), (343, 228), (360, 234), (380, 243),
              (403, 249), (402, 264), (385, 260), (365, 253),
              (344, 248), (325, 242)], fill=255)
draw.line([(338, 252), (391, 258)], fill=255, width=7)
mask = np.asarray(mask_pil)
ys, xs = np.nonzero(mask)
for y, x in zip(ys, xs):
    r2 = (x - cx) ** 2 + (y - cy) ** 2
    if 44 ** 2 <= r2 <= 77 ** 2:
        source_x = 2 * cx - x
        if 0 <= source_x < 768:
            out[y, x] = raw[y, source_x]

# Restore central pale stone from clean photographed samples only.  The center
# is covered in the original by hour, minute and thin curved hands. Keep the
# original inner ring and its Roman numeral band surrounding this region.
rng = np.random.default_rng(421)
for y in range(210, 305):
    samples = []
    for x in range(409, 448):
        if (x - cx) ** 2 + (y - cy) ** 2 > 37 ** 2:
            continue
        px = raw[y, x].astype(int)
        if px.mean() > 165 and px.max() - px.min() < 30:
            samples.append(px)
    base = np.median(samples, axis=0) if samples else np.array([208, 211, 211])
    for x in range(355, 453):
        dist = ((x - cx) ** 2 + (y - cy) ** 2) ** .5
        if dist >= 44:
            continue
        alpha = min(1.0, max(0.0, (44 - dist) / 3.3))
        color = np.clip(base + (cx - x) * .05 + rng.normal(0, 1.4), 0, 255)
        out[y, x] = np.clip(raw[y, x] * (1 - alpha) + color * alpha, 0, 255).astype(np.uint8)

# An exact outside-dial pixel check guarantees the architecture is unchanged
# before the final WebP compression. No permanent animation is baked in.
yy, xx = np.ogrid[:576, :768]
architecture = (xx - cx) ** 2 + (yy - cy) ** 2 > 79 ** 2
assert np.array_equal(out[architecture], raw[architecture]), "Outside clock modified"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(out, "RGB").save(OUTPUT, format="WEBP", quality=93, method=6)
assert OUTPUT.stat().st_size < 400_000, "Trial image should remain lightweight"
print("PASS: cleaned hand-only dial, original architecture preserved; WebP bytes:", OUTPUT.stat().st_size)
