import 'server-only';
import { DELIVERY_ZONES } from './fulfillment.mjs';
import { prisma } from './db';
// @ts-ignore JavaScript module; covered by unit tests
import { findDeliveryZone, validateZoneGeometry } from './delivery-zones.mjs';

type GeocodeCandidate = { score?: number; house?: { name?: string; geometry?: { type?: string; coordinates?: number[] } } };

export async function resolveWalloniaDeliveryAddress(address: string) {
  const endpoint = new URL('https://geoservices.wallonie.be/geocodeWS/geocode');
  endpoint.searchParams.set('address', address);
  endpoint.searchParams.set('geom', 'true');
  endpoint.searchParams.set('crs', 'EPSG:4326');
  endpoint.searchParams.set('nap', 'closest');
  endpoint.searchParams.set('scopes', 'WAL');
  endpoint.searchParams.set('lang', 'fr');
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(7000), cache: 'no-store' });
  if (!response.ok) throw new Error('GEOCODER_UNAVAILABLE');
  const result = await response.json() as { candidates?: GeocodeCandidate[] };
  const candidates = (Array.isArray(result.candidates) ? result.candidates : [])
    .filter(candidate => candidate.house?.geometry?.type === 'Point' && Array.isArray(candidate.house.geometry.coordinates) && candidate.house.geometry.coordinates.length === 2 && candidate.house.geometry.coordinates.every(Number.isFinite))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  if (!candidates.length) throw new Error('ADDRESS_NOT_FOUND');
  const point = candidates[0].house!.geometry!.coordinates!;
  const stored = await prisma.deliveryZoneBoundary.findMany();
  const boundaries = stored.map(zone => ({ zoneId: zone.zoneId, geometry: validateZoneGeometry(zone.geometry) }));
  const zoneId = findDeliveryZone(boundaries, point);
  if (!zoneId) throw new Error(stored.length < DELIVERY_ZONES.length ? 'ZONES_NOT_CONFIGURED' : 'ADDRESS_OUTSIDE_DELIVERY');
  const zone = DELIVERY_ZONES.find(item => item.id === zoneId)!;
  return { zoneId, zoneLabel: zone.label, score: candidates[0].score ?? null };
}
