#!/usr/bin/env python3
"""Export the browser recording as a compact H.264 MP4 and poster. Requires ffmpeg."""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
recording = json.loads((root / 'out/demo/recording.json').read_text())
video = root / 'public/demo.mp4'
# Crop to the actual CSS viewport (also handles older recordings with a larger canvas).
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', str(recording['trimStartS']), '-i', recording['rawVideo'],
    '-t', str(recording['contentDurationS']),
    '-vf', 'crop=390:844:0:0,scale=780:1688:flags=lanczos,fps=25',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(video),
], check=True)
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(max(0, recording['contentDurationS'] - 4)),
    '-i', str(video), '-frames:v', '1', '-q:v', '2', str(root / 'public/demo-poster.jpg'),
], check=True)
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_entries',
    'format=duration,size:stream=codec_name,width,height,pix_fmt', '-of', 'json', str(video),
]))
(root / 'out/demo/export.json').write_text(json.dumps(probe, indent=2) + '\n')
print(json.dumps(probe))
