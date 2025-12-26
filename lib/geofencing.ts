import * as Location from 'expo-location';
import { LOCATION_GEOFENCE_TASK } from './backgroundLocation';
import { fetchNearbyPlaces } from './googlePlaces';

export const setupGeofencing = async () => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Location permissions not granted');
            return;
        }

        const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            // @ts-ignore: handling user request for timeout/interval
            timeInterval: 10000
        });
        const { latitude, longitude } = loc.coords;

        console.log("Setting up geofences around:", latitude, longitude);

        const places = await fetchNearbyPlaces(latitude, longitude, 2000);

        if (!places || !Array.isArray(places)) {
            console.log("Failed to fetch nearby places or invalid response.");
            return;
        }

        const topPlaces = places.slice(0, 15);
        if (topPlaces.length === 0) {
            console.log("No places found to geofence.");
            return;
        }

        const regions = topPlaces
            .filter(place => place?.geometry?.location?.lat && place?.geometry?.location?.lng)
            .map((place, index) => ({
                identifier: place.place_id || `place_${index}_${Date.now()}`, // Use unique place_id or generate unique ID
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                radius: 100, // 100 meters trigger radius
                notifyOnEnter: true,
                notifyOnExit: false,
            }));

        if (regions.length === 0) {
            console.log("No valid regions created after filtering.");
            return;
        }
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
