import { DELIVERY_ZONES } from './fulfillment.mjs';

const zoneIds = new Set(DELIVERY_ZONES.map(zone => zone.id));

function invalid() { throw new Error('INVALID_DELIVERY_ZONE'); }

export function validateZoneGeometry(value) {
  if (!value || value.type !== 'Polygon' || !Array.isArray(value.coordinates) || value.coordinates.length !== 1) invalid();
  const ring = value.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4 || ring.length > 501) invalid();
  const coordinates = ring.map(point => {
    if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite) ||
        point[0] < -180 || point[0] > 180 || point[1] < -90 || point[1] > 90) invalid();
    return [point[0], point[1]];
  });
  const [firstLng, firstLat] = coordinates[0];
  const [lastLng, lastLat] = coordinates.at(-1);
  if (firstLng !== lastLng || firstLat !== lastLat) invalid();
  const distinct = new Set(coordinates.slice(0, -1).map(point => `${point[0]},${point[1]}`));
  if (distinct.size < 3) invalid();
  return { type: 'Polygon', coordinates };
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function findDeliveryZone(boundaries, point) {
  if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) return null;
  const matches = boundaries.filter(boundary => zoneIds.has(boundary.zoneId) &&
    pointInRing(point, boundary.geometry.coordinates[0]));
  return matches.length === 1 ? matches[0].zoneId : null;
}

export function validateZoneUpdate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key => !['zoneId', 'geometry', 'revision'].includes(key)) ||
      !zoneIds.has(input.zoneId) || !Number.isSafeInteger(input.revision) || input.revision < 0) invalid();
  return { zoneId: input.zoneId, geometry: validateZoneGeometry(input.geometry), revision: input.revision };
}
