// src/hooks/useGeolocation.ts
"use client";

// POST /attendance/check-in and /check-out both require latitude/longitude
// (hrms-backend AttendanceController - geofenced against the employee's
// assigned Location). This wraps the browser Geolocation API to get a
// single current position on demand.
export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location services are not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location access was denied. Please enable it to check in/out."));
        } else {
          reject(new Error("Unable to determine your current location. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
