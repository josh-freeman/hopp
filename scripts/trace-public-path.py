#!/usr/bin/env python3
"""Inspect OSM pedestrian topology. Reports paths; does not create app routes."""
import heapq,json,math,pathlib,sys
file,start_id,platform_id=sys.argv[1:4]
step_free='--step-free' in sys.argv
data=json.loads(pathlib.Path(file).read_text());elements={e['id']:e for e in data['elements'] if e['type']!='relation'}
nodes={e['id']:e for e in data['elements'] if e['type']=='node'}
ways=[e for e in data['elements'] if e['type']=='way']
def distance(a,b):
 rad=math.pi/180
 q=math.sin((b['lat']-a['lat'])*rad/2)**2+math.cos(a['lat']*rad)*math.cos(b['lat']*rad)*math.sin((b['lon']-a['lon'])*rad/2)**2
 return 6371000*2*math.atan2(math.sqrt(q),math.sqrt(1-q))
graph={};allowed={'footway','pedestrian','path','steps','corridor','living_street'}
for way in ways:
 tags=way.get('tags',{})
 if tags.get('highway') not in allowed or (step_free and tags.get('highway')=='steps'):continue
 if tags.get('foot') in ['no','private'] or (tags.get('access') in ['no','private','customers'] and tags.get('foot') not in ['yes','designated','permissive']):continue
 for a,b in zip(way['nodes'],way['nodes'][1:]):
  if a not in nodes or b not in nodes:continue
  if any(nodes[n].get('tags',{}).get('barrier') in ['gate','lift_gate','turnstile'] and nodes[n].get('tags',{}).get('foot') not in ['yes','designated'] for n in (a,b)):continue
  d=distance(nodes[a],nodes[b]);graph.setdefault(a,[]).append((b,d,way['id']));graph.setdefault(b,[]).append((a,d,way['id']))
start=nodes[int(start_id)];platform=elements[int(platform_id)]
starts=sorted((distance(start,nodes[n]),n) for n in graph)[:8]
targets=set(platform['nodes'])&set(graph)
print(json.dumps({'start':start,'nearestGraphNodes':starts,'platform':platform['tags'],'connectedTargets':list(targets)},ensure_ascii=False))
for offset,origin in starts:
 if offset>35:continue
 queue=[(offset,origin)];best={origin:offset};prev={}
 found=None
 while queue:
  cost,node=heapq.heappop(queue)
  if cost!=best[node]:continue
  if node in targets:found=node;break
  for other,length,way in graph.get(node,[]):
   if cost+length<best.get(other,math.inf):best[other]=cost+length;prev[other]=(node,way,length);heapq.heappush(queue,(cost+length,other))
 if found is None:continue
 chain=[];cursor=found
 while cursor!=origin:
  prior,way,length=prev[cursor];chain.append({'from':prior,'to':cursor,'way':way,'metres':round(length,2),'tags':elements[way]['tags'],'fromCoordinate':{'lat':nodes[prior]['lat'],'lon':nodes[prior]['lon']},'toCoordinate':{'lat':nodes[cursor]['lat'],'lon':nodes[cursor]['lon']}});cursor=prior
 chain.reverse()
 print(json.dumps({'startOffsetM':offset,'origin':origin,'landing':nodes[found],'distanceM':best[found],'chain':chain},ensure_ascii=False))
