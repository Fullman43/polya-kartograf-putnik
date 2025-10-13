// Yandex APIs integration
const ROUTING_API_KEY = "7d6de12a-0616-42db-b088-c5023c2c4aaa";
const GEOCODING_API_KEY = "7d6de12a-0616-42db-b088-c5023c2c4aaa";

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: number[][]; // array of [lat, lng] points
}

/**
 * Calculate route between two points using Yandex Routing API
 */
export async function calculateRoute(
  from: RoutePoint,
  to: RoutePoint
): Promise<RouteResult | null> {
  try {
    const url = `https://api.routing.yandex.net/v2/route?apikey=${ROUTING_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        points: [
          { coordinates: [from.lng, from.lat] },
          { coordinates: [to.lng, to.lat] },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Routing API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.route && data.route.legs && data.route.legs.length > 0) {
      const leg = data.route.legs[0];
      
      return {
        distance: leg.distance?.value || 0,
        duration: leg.duration?.value || 0,
        geometry: data.route.geometry?.coordinates || [],
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to calculate route:", error);
    return null;
  }
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}мин`;
  }
  return `${minutes}мин`;
}

/**
 * Format distance in meters to human-readable format
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}км`;
  }
  return `${Math.round(meters)}м`;
}

/**
 * Calculate ETA based on current time and duration
 */
export function calculateETA(durationSeconds: number): string {
  const now = new Date();
  const eta = new Date(now.getTime() + durationSeconds * 1000);
  return eta.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Geocode address to coordinates using Yandex Geocoding API
 */
export async function geocodeAddress(address: string): Promise<RoutePoint | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODING_API_KEY}&geocode=${encodeURIComponent(address)}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Geocoding API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    
    const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    if (!geoObject) {
      console.error("No geocoding results found for:", address);
      return null;
    }

    const coords = geoObject.Point.pos.split(" ");
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);

    return { lat, lng };
  } catch (error) {
    console.error("Failed to geocode address:", error);
    return null;
  }
}

/**
 * Parse PostGIS Point format to coordinates
 * Supports formats: "POINT(lng lat)" or "(lng,lat)"
 */
export function parsePointToCoordinates(point: string | null): RoutePoint | null {
  if (!point) return null;
  
  try {
    // Remove "POINT" prefix if exists and extract coordinates
    const coordsMatch = point.match(/[\(\s]([-\d.]+)[,\s]+([-\d.]+)[\)]/);
    if (coordsMatch) {
      const lng = parseFloat(coordsMatch[1]);
      const lat = parseFloat(coordsMatch[2]);
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Failed to parse point:", error);
    return null;
  }
}

/**
 * Format coordinates to PostGIS Point format
 */
export function formatToPostGISPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}
