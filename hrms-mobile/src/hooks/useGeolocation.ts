// src/hooks/useGeolocation.ts
//
// The backend performs all geofence validation (Haversine distance against
// the employee's assigned Location) - this only obtains the device's
// current coordinates and hands them to the API. It never decides
// in/out-of-range itself, and never continuously tracks the employee -
// only requests a single fresh position on demand (check-in/check-out).
import * as Location from "expo-location";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export class GeolocationError extends Error {
  constructor(
    message: string,
    public reason: "permission_denied" | "unavailable" | "timeout"
  ) {
    super(message);
  }
}

export async function getCurrentPosition(): Promise<GeoPosition> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== Location.PermissionStatus.GRANTED) {
    throw new GeolocationError(
      "Location access was denied. Please enable it to check in/out.",
      "permission_denied"
    );
  }

  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new GeolocationError(
      "Location services are turned off. Please enable GPS to check in/out.",
      "unavailable"
    );
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch {
    throw new GeolocationError(
      "Unable to determine your current location. Please try again.",
      "timeout"
    );
  }
}
