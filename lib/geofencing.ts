import * as Location from 'expo-location';
import { LOCATION_GEOFENCE_TASK } from './backgroundLocation';
import { fetchNearbyPlaces } from './googlePlaces';

/**
 * Sets up geofences around the top 20 nearby places.
 * This should be called when:
 * 1. The user enables the feature.
 * 2. The user moves significantly (background fetch or significant location change).
 */
export const setupGeofencing = async () => {
    try {
        // 1. Get current location (Foreground check)
        // We assume permissions are already granted by the UI toggle flow.
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;

        console.log("Setting up geofences around:", latitude, longitude);

        // 2. Fetch Top Places
        // Google Places API: Get spots within 2km
        const places = await fetchNearbyPlaces(latitude, longitude, 2000);

        // 3. Filter/Select Top 20
        // iOS Limit: 20 regions per app. We leave room for 1-2 "Refresh" regions if needed.
        // For now, let's take top 15 to be safe.
        const topPlaces = places.slice(0, 15);

        if (topPlaces.length === 0) {
            console.log("No places found to geofence.");
            return;
        }

        // 4. Create Regions
        const regions = topPlaces.map(place => ({
            identifier: place.name, // Using Name as ID for the notification message
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            radius: 100, // 100 meters trigger radius
            notifyOnEnter: true,
            notifyOnExit: false,
        }));

        // 5. Start Geofencing
        // This replaces any existing regions for this task.
        await Location.startGeofencingAsync(LOCATION_GEOFENCE_TASK, regions);
        console.log(`Started watching ${regions.length} places.`);

    } catch (error) {
        console.error("Error setting up geofences:", error);
    }
};

export const stopGeofencing = async () => {
    try {
        const isStarted = await Location.hasStartedGeofencingAsync(LOCATION_GEOFENCE_TASK);
        if (isStarted) {
            await Location.stopGeofencingAsync(LOCATION_GEOFENCE_TASK);
            console.log("Stopped watching places.");
        }
    } catch (error) {
        console.error("Error stopping geofences:", error);
    }
};
