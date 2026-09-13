import { readdir, readFile, writeFile } from 'node:fs/promises';
import { HackSchema } from '../src/schema/hack';
const directory = new URL('../data/hacks/', import.meta.url);
const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
const hacks = await Promise.all(files.map(async file => {
  const hack = HackSchema.parse(JSON.parse(await readFile(new URL(file, directory), 'utf8')));
  if (file !== `${hack.id}.json`) throw new Error(`${file}: filename must match the route id ${hack.id}`);
  return hack;
}));
if (new Set(hacks.map(hack => hack.id)).size !== hacks.length) throw new Error('Duplicate route id');
const path = new URL('../data/catalogue.json', import.meta.url);
const text = JSON.stringify(hacks, null, 2) + '\n';
if (await readFile(path, 'utf8').catch(() => '') !== text) await writeFile(path, text);
const stationPath = new URL('../data/stations.json', import.meta.url);
const stations: Record<string, { name: string; minTransferS: number; observedPlatforms: string[] }> = JSON.parse(await readFile(stationPath, 'utf8'));
for (const hack of hacks) {
  stations[hack.station.id] ??= { name: hack.station.name, minTransferS: hack.station.minTransferS, observedPlatforms: [] };
  stations[hack.alight.id] ??= { name: hack.alight.name, minTransferS: hack.alight.plannerWalkS, observedPlatforms: [] };
  for (const stop of hack.rideOn) stations[stop.id] ??= { name: stop.name, minTransferS: stop.plannerWalkS, observedPlatforms: [] };
}
const stationText = JSON.stringify(stations, null, 2) + '\n';
if (await readFile(stationPath, 'utf8') !== stationText) await writeFile(stationPath, stationText);
console.log(`Bundled ${hacks.length} route records from data/hacks/`);
