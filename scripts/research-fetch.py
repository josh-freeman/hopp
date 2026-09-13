#!/usr/bin/env python3
"""Cached research requests, paced across collaborating processes. Usage: python3 scripts/research-fetch.py URL OUTPUT_PATH"""
import fcntl, json, pathlib, sys, time, urllib.request
url, dest = sys.argv[1:3]
output = pathlib.Path(dest)
if output.exists():
    print(f'cached {output}')
    sys.exit(0)
lock_path = pathlib.Path('/private/tmp/hopp-research-network.lock')
with lock_path.open('a+') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    lock.seek(0)
    try: previous = float(lock.read().strip() or 0)
    except ValueError: previous = 0
    time.sleep(max(0, previous + 8.5 - time.time()))
    lock.seek(0); lock.truncate(); lock.write(str(time.time())); lock.flush()
    request = urllib.request.Request(url, headers={'User-Agent': 'Hopp-research/0.1 (public station access research)'})
    try:
        with urllib.request.urlopen(request, timeout=35) as response: body = response.read()
    except Exception as error:
        print(f'request failed: {error}', file=sys.stderr); sys.exit(1)
    data = json.loads(body)
    if isinstance(data, dict) and data.get('errors'):
        print(json.dumps(data['errors']), file=sys.stderr); sys.exit(1)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(body)
    print(f'saved {output} ({len(body)} bytes)')
