import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

import type { Project } from '@/lib/types';

import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface BoundsReporterProps {
  onBoundsChange: (bounds: string) => void;
}

const BoundsReporter: React.FC<BoundsReporterProps> = ({ onBoundsChange }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = map.getBounds();
    const value = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    onBoundsChange(value);
  }, [map, onBoundsChange]);

  useMapEvents({
    moveend: (event) => {
      const bounds = event.target.getBounds();
      const value = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      onBoundsChange(value);
    },
  });

  return null;
};

interface ProjectsMapProps {
  projects: Project[];
  onBoundsChange: (bounds: string) => void;
  onSelect: (project: Project) => void;
}

export const ProjectsMap: React.FC<ProjectsMapProps> = ({ projects, onBoundsChange, onSelect }) => {
  return (
    <MapContainer center={[51.1694, 71.4491]} zoom={5} className="h-[500px] w-full rounded-lg shadow">
      <BoundsReporter onBoundsChange={onBoundsChange} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup chunkedLoading>
        {projects.map((project) => (
          <Marker
            key={project.id}
            position={[project.geo_point.coordinates[1], project.geo_point.coordinates[0]]}
            eventHandlers={{ click: () => onSelect(project) }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};
