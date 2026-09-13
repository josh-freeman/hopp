#!/usr/bin/env python3
"""Paced, cached discovery screen. Results are research leads, never app GO routes."""
import json, math, pathlib, subprocess, unicodedata, urllib.parse
ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/research/raw'
OUT = ROOT / 'data/research/discovery-scan.json'
STATIONS = ['Nyon', 'Morges', 'Renens VD', 'Baden', 'Brugg AG', 'Rapperswil SG', 'Wil SG', 'Solothurn', 'Sion', 'Yverdon-les-Bains', 'Uster', 'Wetzikon ZH', 'Bulle', 'Burgdorf', 'Visp', 'Brig', 'Basel Bad Bf', 'Zürich Altstetten', 'Zürich Stadelhofen']
DATE = '2026-09-14'
def slug(value):
    return ''.join(c if c.isalnum() else '-' for c in unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()).strip('-').lower()
def fetch(kind, params, name):
    url = f'https://transport.opendata.ch/v1/{kind}?' + urllib.parse.urlencode(params)
    path = RAW / f'scan-{name}.json'
    result = subprocess.run(['python3', str(ROOT/'scripts/research-fetch.py'), url, str(path)], capture_output=True, text=True)
    if result.returncode:
        return None, url, result.stderr.strip()
    return json.loads(path.read_text()), url, None
def distance(a, b):
    rad = math.pi/180
    dlat=(b['x']-a['x'])*rad;dlon=(b['y']-a['y'])*rad
    q=math.sin(dlat/2)**2+math.cos(a['x']*rad)*math.cos(b['x']*rad)*math.sin(dlon/2)**2
    return 6371000*2*math.atan2(math.sqrt(q),math.sqrt(1-q))
rows=[]
for name in STATIONS:
    key=slug(name)
    body,source,error=fetch('locations', {'query':name,'type':'station'}, key+'station')
    if not body or not body.get('stations'):
        rows.append({'stationQuery':name,'error':error or 'No station match','sources':[source]});continue
    exact=[s for s in body['stations'] if slug(s.get('name',''))==key and s.get('id')]
    station=(exact or [s for s in body['stations'] if s.get('id')])[0]
    coord=station.get('coordinate')
    if not coord:continue
    nearby,nearSource,error=fetch('locations', {'x':coord['x'],'y':coord['y'],'type':'station'}, key+'nearby')
    if not nearby:
        rows.append({'station':station,'error':error,'sources':[source,nearSource]});continue
    stops=[]
    for stop in nearby.get('stations',[]):
        if not stop.get('id') or stop['id']==station['id'] or not stop.get('coordinate'):continue
        direct=distance(coord,stop['coordinate'])
        if 45<=direct<=700:
            stops.append((direct,stop))
    stops.sort(key=lambda item:item[0])
    # At most two scored leads per station, so the screen has a bounded route-search cost.
    for direct,stop in stops[:2]:
        far='8507000' if name in ['Zürich Altstetten','Zürich Stadelhofen','Uster','Wetzikon ZH','Baden','Brugg AG','Rapperswil SG','Wil SG'] else '8503000'
        connections,routeSource,error=fetch('connections', {'from':stop['id'],'to':far,'date':DATE,'time':'08:00','limit':4},key+'from-'+str(stop['id']))
        row={'station':station['name'],'stationId':station['id'],'from':stop['name'],'fromId':stop['id'],
             'directDistanceM':round(direct),'status':'unverified-lead','checkedDate':'2026-09-13',
             'sources':[source,nearSource,routeSource],
             'limitation':'Straight-line distance is only a screening measure. Public path, platforms, stairs and construction must be checked before this can enter the planner.'}
        if error:row['error']=error
        else:
            observed=[]
            for connection in connections.get('connections',[]):
                access=0;chain=[];found=False
                for section in connection.get('sections',[]):
                    dep=section.get('departure',{});arr=section.get('arrival',{})
                    if section.get('journey') and dep.get('station',{}).get('id')==station['id']:
                        found=True;break
                    start=dep.get('departureTimestamp');end=arr.get('arrivalTimestamp')
                    if not isinstance(start,(int,float)) or not isinstance(end,(int,float)):break
                    access+=max(0,end-start)
                    chain.append({'from':dep.get('station',{}).get('name'),'to':arr.get('station',{}).get('name'),'mode':'walk' if section.get('walk') is not None else section.get('journey',{}).get('category'),'seconds':end-start})
                    if len(chain)>3:break
                if found and chain:observed.append({'plannerAccessS':access,'sections':chain})
            if observed:
                best=min(observed,key=lambda x:x['plannerAccessS'])
                row.update(best)
                row['walkingOnly']=all(s['mode']=='walk' for s in best['sections'])
                row['optimisticSprintFloorS']=round(15+direct/3.5+95)
                row['budgetAboveOptimisticFloorS']=round(best['plannerAccessS']-row['optimisticSprintFloorS'])
        rows.append(row)
        OUT.write_text(json.dumps({'method':'Discovery leads only; no straight-line route is promoted automatically. API calls paced and cached.','stationsRequested':STATIONS,'sampleDate':DATE,'leads':rows},ensure_ascii=False,indent=2)+'\n')
        print(f"{name}: {stop['name']} — planner access {row.get('plannerAccessS','unavailable')} s, direct {round(direct)} m",flush=True)
    if not stops:
        rows.append({'station':station['name'],'stationId':station['id'],'status':'no-nearby-stop-in-api-response','sources':[source,nearSource]})
        OUT.write_text(json.dumps({'method':'Discovery leads only; no straight-line route is promoted automatically. API calls paced and cached.','stationsRequested':STATIONS,'sampleDate':DATE,'leads':rows},ensure_ascii=False,indent=2)+'\n')
print(f'Screened {len(STATIONS)} stations, wrote {len(rows)} observations.',flush=True)
