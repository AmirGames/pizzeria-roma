'use client';

import { useEffect, useRef } from 'react';
import type { FeatureCollection, Geometry } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

type Position = [number, number];
type Polygon = { type: 'Polygon'; coordinates: Position[][] };
const empty: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: [] };

export default function ZoneMap({ geometry, draft, drawing, onDraftPoint }: {
  geometry: Polygon | null;
  draft: Position[];
  drawing: boolean;
  onDraftPoint: (point: Position) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<import('maplibre-gl').Map | null>(null);
  const callback = useRef(onDraftPoint);
  const drawingRef = useRef(drawing);
  const geometryRef = useRef(geometry);
  const draftRef = useRef(draft);
  callback.current = onDraftPoint;
  drawingRef.current = drawing;
  geometryRef.current = geometry;
  draftRef.current = draft;

  useEffect(() => {
    let disposed = false;
    import('maplibre-gl').then(({ Map }) => {
      if (disposed || !container.current) return;
      const instance = new Map({
        container: container.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [4.87, 50.47],
        zoom: 12,
        maxZoom: 18,
      });
      map.current = instance;
      instance.on('load', () => {
        instance.addSource('delivery-zone', { type: 'geojson', data: empty });
        instance.addLayer({ id: 'zone-fill', type: 'fill', source: 'delivery-zone', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': '#c91d2e', 'fill-opacity': 0.2 } });
        instance.addLayer({ id: 'zone-line', type: 'line', source: 'delivery-zone', paint: { 'line-color': '#c91d2e', 'line-width': 3 } });
        instance.addSource('zone-draft', { type: 'geojson', data: empty });
        instance.addLayer({ id: 'draft-line', type: 'line', source: 'zone-draft', paint: { 'line-color': '#173b2a', 'line-width': 3, 'line-dasharray': [2, 1] } });
        instance.addLayer({ id: 'draft-points', type: 'circle', source: 'zone-draft', paint: { 'circle-radius': 5, 'circle-color': '#173b2a', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
        sync();
        instance.on('click', event => {
          if (drawingRef.current) callback.current([event.lngLat.lng, event.lngLat.lat]);
        });
      });
    });
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, []);

  function sync() {
    const instance = map.current;
    if (!instance?.isStyleLoaded()) return;
    const savedFeatures = geometryRef.current ? [{ type: 'Feature' as const, properties: {}, geometry: geometryRef.current }] : [];
    const lineCoordinates = draftRef.current;
    const draftFeatures = lineCoordinates.length > 1 ? [{ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: lineCoordinates } }] : [];
    const pointFeatures = lineCoordinates.map(coordinates => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'Point' as const, coordinates } }));
    (instance.getSource('delivery-zone') as import('maplibre-gl').GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: savedFeatures });
    (instance.getSource('zone-draft') as import('maplibre-gl').GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: [...draftFeatures, ...pointFeatures] });
  }

  useEffect(() => { sync(); }, [geometry, draft]);
  return <div ref={container} className="delivery-zone-map" aria-label="Carte de dessin des zones de livraison" />;
}
