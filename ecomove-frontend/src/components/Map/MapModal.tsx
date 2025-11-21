// MapModal.tsx - Modal de Mapa Interactivo con Leaflet y Rutas
import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Bike, Zap, Battery, RefreshCw, Target, Info, Route, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORTANTE: Necesitarás instalar estas dependencias:
// npm install leaflet react-leaflet
// npm install -D @types/leaflet

// Importar Leaflet y sus estilos
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

// Fix para los iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ============ INTERFACES ============

interface Station {
  id: number;
  nombre: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  transportes_disponibles?: number;
  estado?: string;
  imagen?: string;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  userLocation?: { lat: number; lng: number };
  onStationClick?: (station: Station) => void;
  selectedStation?: Station | null;  // ✅ AGREGA ESTA LÍNEA
}

interface MapPosition {
  lat: number;
  lng: number;
  zoom: number;
}

interface RouteInfo {
  distance: number; // en metros
  duration: number; // en segundos
  coordinates: [number, number][];
}

// ============ COMPONENTES AUXILIARES ============

// Componente para centrar el mapa en una ubicación
const RecenterMap: React.FC<{ position: [number, number]; zoom: number }> = ({ position, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, zoom);
  }, [position, zoom, map]);
  
  return null;
};

// Componente para el control de ubicación del usuario
const LocationControl: React.FC<{ onLocate: () => void; isLocating: boolean }> = ({ onLocate, isLocating }) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={onLocate}
        disabled={isLocating}
        className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        title="Centrar en mi ubicación"
      >
        {isLocating ? (
          <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
        ) : (
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        )}
      </button>
    </div>
  );
};

// Función para obtener ruta usando OpenRouteService (API gratuita)
const getRoute = async (
  start: [number, number],
  end: [number, number]
): Promise<RouteInfo | null> => {
  try {
    // Usar OSRM (Open Source Routing Machine) - sin necesidad de API key
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      // Convertir coordenadas de [lng, lat] a [lat, lng]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      
      return {
        distance: route.distance, // metros
        duration: route.duration, // segundos
        coordinates
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo ruta:', error);
    return null;
  }
};

// Iconos personalizados para estaciones
const createStationIcon = (available: number, isActive: boolean) => {
  const color = available > 0 ? '#10b981' : '#ef4444';
  const opacity = isActive ? 1 : 0.5;
  
  return L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="
          width: 40px;
          height: 40px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 14px;
          opacity: ${opacity};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${available}
        </div>
        ${available > 0 ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: #22c55e;
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    className: 'custom-station-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const createUserIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
    `,
    className: 'custom-user-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// ============ COMPONENTE PRINCIPAL ============

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  stations,
  userLocation,
  onStationClick,
  selectedStation // 👈 NUEVA PROP
}) => {
  // Coordenadas por defecto (Valledupar, Colombia)
  const DEFAULT_CENTER: [number, number] = [10.4731, -73.2503];
  const DEFAULT_ZOOM = 13;

  const [mapPosition, setMapPosition] = useState<MapPosition>({
    lat: DEFAULT_CENTER[0],
    lng: DEFAULT_CENTER[1],
    zoom: DEFAULT_ZOOM
  });

  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(
    userLocation || null
  );
  const [isLocating, setIsLocating] = useState(false);
  
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estados para navegación
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  // Calcular ruta automáticamente cuando se selecciona una estación
useEffect(() => {
  if (isOpen && selectedStation && currentUserLocation) {
    console.log('🚀 Calculando ruta automática a:', selectedStation.nombre);
    
    // Centrar en la estación seleccionada primero
    if (selectedStation.latitud && selectedStation.longitud) {
      setMapPosition({
        lat: selectedStation.latitud,
        lng: selectedStation.longitud,
        zoom: 15
      });
    }
    
    // Calcular la ruta después de un pequeño delay
    setTimeout(() => {
      navigateToStation(selectedStation);
    }, 500);
  } else if (isOpen && selectedStation && !currentUserLocation) {
    // Si no hay ubicación del usuario, intentar obtenerla
    console.log('📍 Obteniendo ubicación para calcular ruta...');
    getUserLocation();
    
    // Después de obtener ubicación, calcular ruta
    setTimeout(() => {
      if (selectedStation.latitud && selectedStation.longitud) {
        navigateToStation(selectedStation);
      }
    }, 1500);
  }
}, [isOpen, selectedStation]);
useEffect(() => {
  if (isOpen && selectedStation && selectedStation.latitud && selectedStation.longitud) {
    // Centrar mapa en la estación seleccionada
    setMapPosition({
      lat: selectedStation.latitud,
      lng: selectedStation.longitud,
      zoom: 16
    });
  }
}, [isOpen, selectedStation]);
  // Obtener ubicación automáticamente al abrir el mapa
  useEffect(() => {
    if (isOpen && !currentUserLocation) {
      getUserLocation();
    }
  }, [isOpen]);

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    setIsLocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentUserLocation(location);
          setMapPosition({
            lat: location.lat,
            lng: location.lng,
            zoom: 15
          });
          setIsLocating(false);
          console.log('✅ Ubicación obtenida automáticamente:', location);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setIsLocating(false);
          
          // Mensajes de error más específicos
          let errorMessage = 'No se pudo obtener tu ubicación.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor actívalo en la configuración del navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado al obtener ubicación.';
              break;
          }
          
          setRouteError(errorMessage);
          
          // Limpiar el error después de 5 segundos
          setTimeout(() => setRouteError(null), 5000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setIsLocating(false);
      setRouteError('Tu navegador no soporta geolocalización');
      setTimeout(() => setRouteError(null), 5000);
    }
  };

  // Centrar mapa en una estación
const centerOnStation = (station: Station) => {
  if (station.latitud && station.longitud) {
    setMapPosition({
      lat: station.latitud,
      lng: station.longitud,
      zoom: 16
    });
  }
};

  // Calcular y mostrar ruta
  const navigateToStation = async (station: Station) => {
        if (!station.latitud || !station.longitud) {
      console.error('❌ Coordenadas inválidas en navigateToStation:', {
        latitud: station.latitud,
        longitud: station.longitud
      });
      setRouteError('Esta estación no tiene coordenadas válidas');
      setTimeout(() => setRouteError(null), 3000);
      return;
    }
    if (!currentUserLocation) {
      // Intentar obtener ubicación una vez más
      setRouteError('Obteniendo tu ubicación...');
      getUserLocation();
      
      // Esperar un momento y volver a intentar
      setTimeout(() => {
        if (currentUserLocation) {
          navigateToStation(station);
        } else {
          setRouteError('No se pudo obtener tu ubicación. Intenta activar el GPS.');
        }
      }, 2000);
      return;
    }
    
    if (!station.latitud || !station.longitud) {
      setRouteError('Esta estación no tiene coordenadas válidas');
      setTimeout(() => setRouteError(null), 3000);
      return;
    }
    
    setIsCalculatingRoute(true);
    setRouteError(null);
    
    try {
      const route = await getRoute(
        [currentUserLocation.lat, currentUserLocation.lng],
        [station.latitud, station.longitud]
      );
      
      if (route) {
        setActiveRoute(route);
        
        // Ajustar el mapa para mostrar toda la ruta
        const bounds = L.latLngBounds([
          [currentUserLocation.lat, currentUserLocation.lng],
          [station.latitud, station.longitud]
        ]);
        
        // Expandir bounds ligeramente para mejor visualización
        const paddedBounds = bounds.pad(0.2);
        setMapPosition({
          lat: paddedBounds.getCenter().lat,
          lng: paddedBounds.getCenter().lng,
          zoom: 14
        });
      } else {
        setRouteError('No se pudo calcular la ruta. Intenta nuevamente.');
        setTimeout(() => setRouteError(null), 3000);
      }
    } catch (error) {
      console.error('Error calculando ruta:', error);
      setRouteError('Error al calcular la ruta');
      setTimeout(() => setRouteError(null), 3000);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Limpiar ruta
  const clearRoute = () => {
    setActiveRoute(null);
    setRouteError(null);
  };

  // Formatear distancia
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Formatear duración
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Filtrar estaciones con coordenadas válidas
  const validStations = stations.filter(
    s => s.latitud !== undefined && 
         s.longitud !== undefined && 
         !isNaN(s.latitud) && 
         !isNaN(s.longitud)
  );

  // URLs de tiles según el modo
  const tileUrls = {
    streets: isDarkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  const attribution = mapStyle === 'streets'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.esri.com/">Esri</a>';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl h-[85vh] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mapa de Estaciones
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {validStations.length} estaciones disponibles
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Toggle de estilo de mapa */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setMapStyle('streets')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    mapStyle === 'streets'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Calles
                </button>
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    mapStyle === 'satellite'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Satélite
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Mapa */}
          <div className="flex-1 relative">
            <MapContainer
              center={[mapPosition.lat, mapPosition.lng]}
              zoom={mapPosition.zoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-xl"
              zoomControl={false}
            >
              <TileLayer
                attribution={attribution}
                url={tileUrls[mapStyle]}
              />

              <RecenterMap 
                position={[mapPosition.lat, mapPosition.lng]} 
                zoom={mapPosition.zoom} 
              />

              {/* Ruta activa */}
              {activeRoute && (
                <Polyline
                  positions={activeRoute.coordinates}
                  color="#3b82f6"
                  weight={5}
                  opacity={0.7}
                  dashArray="10, 10"
                  className="route-line"
                />
              )}

              {/* Marcador de usuario */}
              {currentUserLocation && (
                <Marker
                  position={[currentUserLocation.lat, currentUserLocation.lng]}
                  icon={createUserIcon()}
                >
                  <Popup>
                    <div className="text-center p-2">
                      <p className="font-semibold text-blue-600">Tu ubicación</p>
                      <p className="text-xs text-gray-600">
                        {currentUserLocation.lat.toFixed(6)}, {currentUserLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Marcadores de estaciones */}
              
                {validStations.map((station) => (
                <Marker
                  key={station.id}
                  position={[station.latitud!, station.longitud!]}
                  icon={createStationIcon(
                  station.transportes_disponibles || 0,
                  station.estado === 'activa' || station.estado === 'active'
                  )}
                  eventHandlers={{
                  click: () => {
                  if (onStationClick) onStationClick(station);
                    }
                  }}
                >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2 min-w-[250px]">
                  {/* Imagen de la estación */}
                  {station.imagen && (
                    <div className="mb-3 -mx-2 -mt-2">
                      <img
                        src={station.imagen}
                        alt={station.nombre}
                        className="w-full h-32 object-cover rounded-t-lg"
                        onError={(e) => {
                          // Imagen por defecto si falla la carga
                          e.currentTarget.src = 'https://via.placeholder.com/300x128/10b981/ffffff?text=Estación+EcoMove';
                        }}
                      />
                    </div>
                  )}
                  
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {station.nombre}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {station.direccion}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Vehículos disponibles:</span>
                    <span className={`text-sm font-bold ${
                      (station.transportes_disponibles || 0) > 0
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}>
                      {station.transportes_disponibles || 0}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => navigateToStation(station)}
                      disabled={isCalculatingRoute}
                      className="flex-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs rounded transition-colors flex items-center justify-center space-x-1"
                    >
                      {isCalculatingRoute ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Calc...</span>
                        </>
                      ) : (
                        <>
                          <Route className="h-3 w-3" />
                          <span>Ruta</span>
                        </>
                      )}
                    </button>
                    
                    {(station.transportes_disponibles || 0) > 0 ? (
                      <button
                        onClick={() => {
                          window.location.href = `/transportes?station=${station.id}`;
                        }}
                        className="flex-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors flex items-center justify-center space-x-1"
                      >
                        <Bike className="h-3 w-3" />
                        <span>Alquilar</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 px-3 py-1.5 bg-gray-400 text-white text-xs rounded cursor-not-allowed flex items-center justify-center space-x-1"
                      >
                        <Bike className="h-3 w-3" />
                        <span>Sin vehículos</span>
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
                </Marker>
              ))}
            </MapContainer>
              <style>{`
                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.5;
                  }
                }
                
                .route-line {
                  animation: dash 20s linear infinite;
                }
                
                @keyframes dash {
                  to {
                    stroke-dashoffset: -100;
                  }
                }
                
                /* Estilos personalizados para el popup */
                .custom-popup .leaflet-popup-content-wrapper {
                  padding: 0;
                  border-radius: 0.5rem;
                  overflow: hidden;
                }
                
                .custom-popup .leaflet-popup-content {
                  margin: 0;
                  width: 100% !important;
                }
                
                .custom-popup img {
                  transition: transform 0.3s ease;
                }
                
                .custom-popup img:hover {
                  transform: scale(1.05);
                }
              `}</style>
            {/* Indicador de carga de ubicación */}
            {isLocating && !currentUserLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      Obteniendo tu ubicación
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Por favor, permite el acceso a tu ubicación
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Control de ubicación */}
            <LocationControl onLocate={getUserLocation} isLocating={isLocating} />

            {/* Panel de información de ruta */}
            {activeRoute && (
              <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Ruta Calculada
                    </span>
                  </div>
                  <button
                    onClick={clearRoute}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Limpiar ruta"
                  >
                    <XCircle className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Distancia:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatDistance(activeRoute.distance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tiempo estimado:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(activeRoute.duration)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ruta optimizada para ciclismo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de error de ruta */}
            {routeError && (
              <div className="absolute top-4 left-4 z-[1000] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg shadow-lg max-w-xs">
                <div className="flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      {routeError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Leyenda
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Con vehículos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Sin vehículos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Tu ubicación
                  </span>
                </div>
              </div>
            </div>
          </div>

        </motion.div>

        {/* Estilos para animaciones */}
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          .route-line {
            animation: dash 20s linear infinite;
          }
          
          @keyframes dash {
            to {
              stroke-dashoffset: -100;
            }
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
};