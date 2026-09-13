#!/usr/bin/env python3
"""Build offline geographic context maps from the committed OSM extracts.

These maps locate a stop and a modelled platform access point. They deliberately
contain no highlighted walking line: mapped streets are context, and neither
OSM topology nor a straight line establishes a usable transfer route.

Run from any directory with: python3 scripts/build-route-maps.py
"""
from __future__ import annotations
import json
import math
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'maps'
RAW = ROOT / 'data' / 'research' / 'raw'
SOURCES = {
    'basel-sbb.iwb': ['area-map-basel-osm.json'],
    'bern.hirschengraben': ['west-bern-osm.json', 'west-bern-welle-map.json'],
    'biel.place-guisan': ['west-biel-osm.json', 'west-biel-station-map.json'],
    'chur.post-i': ['ne-osm-chur.json'],
    'geneve.lyon': ['west-geneve-osm.json'],
    'neuchatel.gare-nord': ['west-neuchatel-osm.json'],
    'nyon.centre-ville': ['root-nyon-osm.json'],
    'winterthur.archstrasse': ['ne-osm-winterthur.json'],
    'zurich-hb.central': ['area-map-zurich-central-osm.json', 'area-map-limmat-water-osm.json'],
    'zurich-hb.sihlpost': ['ne-osm-zurich.json'],
    'zurich-oerlikon.bahnhof-nord': ['ne-osm-oerlikon.json'],
}
WIDTH, HEIGHT = 600, 420


def intersects(a, b, margin=8):
    return not (a[2]+margin < b[0] or a[0]-margin > b[2] or a[3]+margin < b[1] or a[1]-margin > b[3])


def build(hack, route, elements):
    start = hack['alight']
    end = route.get('landing') or hack['station']
    station = hack['station']
    lat0 = (start['lat'] + end['lat']) / 2
    lon0 = (start['lon'] + end['lon']) / 2
    xfactor = 111_320 * math.cos(math.radians(lat0))
    def meters(p):
        return ((p['lon']-lon0)*xfactor, (p['lat']-lat0)*111_320)
    points = [meters(p) for p in [start, end, station]]
    # Include both markers and the station, with enough surrounding streets to orient.
    xmin, xmax = min(p[0] for p in points), max(p[0] for p in points)
    ymin, ymax = min(p[1] for p in points), max(p[1] for p in points)
    span = max(380, xmax-xmin+170, (ymax-ymin+160)*WIDTH/HEIGHT)
    cx, cy = (xmin+xmax)/2, (ymin+ymax)/2
    scale = WIDTH/span
    def project(p):
        x, y = meters(p)
        return (round(WIDTH/2+(x-cx)*scale, 1), round(HEIGHT/2-(y-cy)*scale, 1))
    nodes = {e['id']: e for e in elements.values() if e['type'] == 'node'}
    features = []
    for e in elements.values():
        if e['type'] != 'way':
            continue
        raw = e.get('geometry') or [nodes[n] for n in e.get('nodes', []) if n in nodes]
        if len(raw) < 2:
            continue
        xy = [project(p) for p in raw if p]
        if not xy or max(p[0] for p in xy) < 0 or min(p[0] for p in xy) > WIDTH or max(p[1] for p in xy) < 0 or min(p[1] for p in xy) > HEIGHT:
            continue
        path = 'M' + ' '.join(f'{x:g},{y:g}' for x,y in xy)
        closed = bool(e.get('nodes')) and e['nodes'][0] == e['nodes'][-1]
        if closed:
            path += 'Z'
        features.append((e.get('tags', {}), path, xy, closed))

    # Water frequently spans a multipolygon relation instead of one closed way.
    # Join only complete mapped rings; never close a missing river bank with an
    # invented line. Full Limmat relation 1598599 is committed for Central.
    ways = {e['id']: e for e in elements.values() if e['type'] == 'way'}
    for e in elements.values():
        tags=e.get('tags', {})
        if e['type'] != 'relation' or tags.get('type') != 'multipolygon' or not (tags.get('natural') == 'water' or tags.get('water')):
            continue
        rings=[]
        for role in ['outer', 'inner']:
            pending=[list(ways[m['ref']]['nodes']) for m in e.get('members', []) if m.get('type') == 'way' and m.get('role', 'outer') == role and m['ref'] in ways]
            while pending:
                ring=pending.pop()
                while ring[0] != ring[-1]:
                    match=None
                    for i, other in enumerate(pending):
                        if ring[-1] == other[0]:
                            match=(i, other[1:]); break
                        if ring[-1] == other[-1]:
                            match=(i, list(reversed(other[:-1]))); break
                    if match is None:
                        break
                    index, addition=match
                    pending.pop(index)
                    ring.extend(addition)
                if ring[0] == ring[-1] and all(n in nodes for n in ring):
                    rings.append([project(nodes[n]) for n in ring])
        if not rings:
            continue
        xy=[p for ring in rings for p in ring]
        if max(p[0] for p in xy) < 0 or min(p[0] for p in xy) > WIDTH or max(p[1] for p in xy) < 0 or min(p[1] for p in xy) > HEIGHT:
            continue
        d=' '.join('M'+' '.join(f'{x:g},{y:g}' for x,y in ring)+'Z' for ring in rings)
        features.append((tags, d, xy, True))

    result = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title desc">',
              f'<title id="title">{escape(start["name"])} to {escape(station["name"])}: area map</title>',
              '<desc id="desc">A marks the alighting stop. B marks the platform access point when known; otherwise S marks the station centre. Streets and railways are geographic context. No walking route is drawn. Follow the written directions. North is up.</desc>',
              '<metadata>Map data © OpenStreetMap contributors, ODbL. Extracts checked 2026-09-13. Generated from committed research snapshots by scripts/build-route-maps.py.</metadata>',
              '<defs><clipPath id="frame"><rect width="600" height="420"/></clipPath><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#183549" flood-opacity=".18"/></filter></defs>',
              '<rect width="600" height="420" fill="#f5f5f0"/><g clip-path="url(#frame)" stroke-linecap="round" stroke-linejoin="round">']
    def path(d, **attrs):
        style = ' '.join(f'{k.replace("_", "-")}="{v}"' for k,v in attrs.items())
        result.append(f'<path d="{d}" {style}/>')
    # Area features and building footprints.
    for tags, d, xy, closed in sorted(features, key=lambda f: 0 if (f[0].get('natural') == 'water' or f[0].get('water')) else 1):
        if not closed:
            continue
        if tags.get('natural') == 'water' or tags.get('water') or tags.get('waterway') == 'riverbank':
            path(d, fill='#b9d8e8', stroke='#9dbfd1', stroke_width=1, fill_rule='evenodd')
        elif tags.get('leisure') in ['park','garden'] or tags.get('landuse') in ['grass','forest','recreation_ground']:
            path(d, fill='#d4e5cd', stroke='none')
        elif tags.get('building') and tags.get('building') != 'no':
            path(d, fill='#e4e7e5', stroke='#d6dddd', stroke_width=.8)
        elif tags.get('man_made') == 'bridge':
            path(d, fill='#ffffff', stroke='#bdcdd5', stroke_width=1)
        elif tags.get('highway') == 'pedestrian' and tags.get('area') == 'yes':
            path(d, fill='#ffffff', stroke='#d9dfe0', stroke_width=1)
    # Roads first; narrow mapped pedestrian links remain neutral map detail.
    road_widths = {'motorway': 13, 'trunk':13, 'primary':12, 'secondary':11, 'tertiary':10, 'residential':9, 'unclassified':9, 'living_street':9, 'service':6, 'pedestrian':7}
    roads=[]
    for tags,d,xy,closed in features:
        highway=tags.get('highway')
        if highway in road_widths and not(tags.get('area')=='yes'):
            # Underground roads should not obscure the station surface layout.
            if tags.get('tunnel') == 'yes' or tags.get('location') == 'underground':
                continue
            roads.append((tags,d,xy,road_widths[highway]))
    for tags,d,xy,w in roads:
        path(d, fill='none', stroke='#bbc8ce', stroke_width=w+2)
    for tags,d,xy,w in roads:
        path(d, fill='none', stroke='#ffffff', stroke_width=w)
    for tags,d,xy,closed in features:
        if tags.get('highway') in ['footway','path','corridor','steps','cycleway']:
            if tags.get('access') in ['no','private'] and tags.get('foot') not in ['yes','designated','permissive']:
                continue
            if tags.get('indoor') == 'yes' or tags.get('highway') == 'corridor' or tags.get('location') == 'underground' or str(tags.get('level','0')).startswith('-'):
                continue
            path(d, fill='none', stroke='#ffffff', stroke_width=3.2)
            if tags.get('highway')=='steps':
                path(d, fill='none', stroke='#839ba6', stroke_width=3.2, stroke_dasharray='1 3')
        if tags.get('railway') in ['rail','light_rail','tram','narrow_gauge']:
            underground = tags.get('tunnel') == 'yes' or tags.get('location') == 'underground'
            path(d, fill='none', stroke='#c8d3d9' if underground else '#8299a6', stroke_width=1.25, **({'stroke_dasharray':'3 4'} if underground else {}))
    for tags,d,xy,closed in features:
        if tags.get('railway') == 'platform' or (tags.get('public_transport') == 'platform' and tags.get('train') == 'yes'):
            path(d, fill='#d6e0e5' if closed else 'none', stroke='#8298a4', stroke_width=1.4 if closed else 4)
    # Reserve marker and label rectangles before placing street names.
    markers = [(project(start), 'A', start['name'].split(', ',1)[-1], '#e24f32'),
               (project(end), 'B' if route.get('landing') else 'S', 'Platform access' if route.get('landing') else 'Station centre', '#183849')]
    occupied=[(548, 350, 592, 418), (10, 377, 170, 420)]
    directions_text = json.dumps(hack.get('instructions', []), ensure_ascii=False) + json.dumps(route.get('path', []), ensure_ascii=False)
    markerlabels=[]
    for (x,y), letter, name, color in markers:
        occupied.append((x-28,y-28,x+28,y+28))
    for (x,y), letter, name, color in markers:
        width=min(330, max(110,len(name)*10.6+28))
        choices=[(x+36,y-20),(x-width-36,y-20),(x-width/2,y+38),(x-width/2,y-78)]
        if hack['id'] == 'zurich-hb.central' and letter == 'A':
            # Keep the Bahnhofbrücke visible between the stop and station.
            choices=[(x-width/2,y+38),(x-width/2,y-78),(x-width-36,y-20),(x+36,y-20)]
        selected=None
        for bx,by in choices:
            box=(bx,by,bx+width,by+40)
            if bx>=12 and by>=12 and bx+width<=WIDTH-12 and by+40<=HEIGHT-45 and not any(intersects(box,b,3) for b in occupied):
                selected=box
                break
        if selected is None:
            selected=(max(12,min(WIDTH-width-12,x-width/2)),max(12,min(HEIGHT-88,y+38)),0,0)
            selected=(selected[0],selected[1],selected[0]+width,selected[1]+40)
        occupied.append(selected)
        markerlabels.append((selected, name))
    # A small station name anchors the context even when B is on a distant platform.
    sx,sy=project(station)
    station_name=station['name']
    station_w=len(station_name)*11.2+14
    station_label=None
    for x,y in [(sx-station_w/2,sy-35),(sx-station_w/2,sy+26),(sx-station_w/2,sy-64),(sx-station_w/2,sy+50),(sx+30,sy-12),(sx-station_w-30,sy-12)]:
        b=(x,y,x+station_w,y+29)
        if x>=12 and y>=12 and x+station_w<=WIDTH-12 and y+29<=HEIGHT-45 and not any(intersects(b,p) for p in occupied):
            station_label=(x+station_w/2,y+22,station_name)
            occupied.append(b)
            break
    # Use only visible, well-separated labels; never infer a street name.
    candidates=[]
    for tags,d,xy,w in roads:
        name=tags.get('name')
        if not name or len(name)>34:
            continue
        for (x1,y1),(x2,y2) in zip(xy,xy[1:]):
            length=math.hypot(x2-x1,y2-y1)
            x,y=(x1+x2)/2,(y1+y2)/2
            if length<45 or not(50<x<WIDTH-50 and 40<y<HEIGHT-45):
                continue
            angle=math.degrees(math.atan2(y2-y1,x2-x1))
            if angle>90: angle-=180
            if angle< -90: angle+=180
            width=len(name)*9.6
            priority = 3 if name.casefold() in directions_text.casefold() else 1
            if length<width*(.42 if priority>1 else .65): continue
            rx=abs(math.cos(math.radians(angle)))*width/2+12
            ry=abs(math.sin(math.radians(angle)))*width/2+12
            candidates.append((length*priority,name,x,y,angle,(x-rx,y-ry,x+rx,y+ry)))
    labelled=set()
    for length,name,x,y,angle,b in sorted(candidates,reverse=True):
        if name in labelled or len(labelled)>=2 or any(intersects(b,p) for p in occupied):
            continue
        result.append(f'<text transform="translate({x:.1f} {y:.1f}) rotate({angle:.1f})" text-anchor="middle" dominant-baseline="central" font-family="Helvetica,Arial,sans-serif" font-size="19" font-weight="500" fill="#536d7a" stroke="#ffffff" stroke-width="3" paint-order="stroke">{escape(name)}</text>')
        occupied.append(b)
        labelled.add(name)
    if station_label:
        x,y,name=station_label
        result.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" font-weight="700" fill="#244351" stroke="#f5f5f0" stroke-width="4" paint-order="stroke">{escape(name)}</text>')
    # Endpoint pins remain distinct; no line joins them.
    for (x,y),letter,name,color in markers:
        result.append(f'<g transform="translate({x} {y})" filter="url(#shadow)"><circle r="25" fill="{color}" stroke="#fff" stroke-width="5"/><text x="0" y="8" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="24" font-weight="700" fill="#fff">{letter}</text></g>')
    for (x,y,x2,y2),name in markerlabels:
        result.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{x2-x:.1f}" height="40" rx="7" fill="#fff" stroke="#d1dcdf"/><text x="{x+12:.1f}" y="{y+27:.1f}" font-family="Helvetica,Arial,sans-serif" font-size="21" font-weight="600" fill="#213d4c">{escape(name)}</text>')
    # Scale and north arrow make the map's real geometry explicit.
    scale_m=50 if span<650 else 100
    scale_px=scale_m*scale
    result.append(f'<rect x="10" y="{HEIGHT-39}" width="{scale_px+22:.1f}" height="30" rx="5" fill="#ffffff" fill-opacity=".92"/><path d="M20 {HEIGHT-17} v-5 M20 {HEIGHT-18} h{scale_px:.1f} M{20+scale_px:.1f} {HEIGHT-17} v-5" stroke="#526d7b" stroke-width="2" fill="none"/><text x="{20+scale_px/2:.1f}" y="{HEIGHT-26}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="15" fill="#526d7b">{scale_m} m</text>')
    result.append('<g transform="translate(568 370)"><rect x="-16" y="-15" width="32" height="49" rx="7" fill="#ffffff" fill-opacity=".94"/><path d="M0 -7 L-5 6 L0 3 L5 6 Z" fill="#526d7b"/><text x="0" y="24" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="16" font-weight="700" fill="#526d7b">N</text></g>')
    result.append('</g></svg>\n')
    return ''.join(result)


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    count=0
    missing=[]
    expected=set()
    for file in sorted((ROOT/'data'/'hacks').glob('*.json')):
        hack=json.loads(file.read_text())
        if hack['status'] not in ['desk-verified','field-verified']:
            continue
        source_names=SOURCES.get(hack['id'],[])
        if not source_names or any(not(RAW/name).exists() for name in source_names):
            missing.append(hack['id'])
            continue
        elements={}
        for name in source_names:
            for e in json.loads((RAW/name).read_text())['elements']:
                elements[(e['type'],e['id'])]=e
        for route in hack['routes']:
            if route['helps']=='never':
                continue
            target=OUT/f'{hack["id"]}.{route["key"]}.svg'
            expected.add(target)
            target.write_text(build(hack,route,elements))
            count+=1
    # This directory contains generated SVG maps only.
    for target in OUT.glob('*.svg'):
        if target not in expected:
            target.unlink()
    (ROOT/'data'/'map-manifest.json').write_text(json.dumps(sorted(p.name for p in expected), ensure_ascii=False, indent=2)+'\n')
    print(f'Built {count} area maps. Missing source: {", ".join(missing) or "none"}.')
    if missing:
        raise SystemExit(1)

if __name__=='__main__':
    main()
