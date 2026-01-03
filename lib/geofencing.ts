import * as Location from 'expo-location';
import { LOCATION_GEOFENCE_TASK } from './backgroundLocation';
import { fetchNearbyPlaces } from './googlePlaces';

export const setupGeofencing = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
        return;
    }

    const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;

    const places = await fetchNearbyPlaces(latitude, longitude, 2000);

    if (!places || !Array.isArray(places)) {
        return;
    }

    const topPlaces = places.slice(0, 15);
    if (topPlaces.length === 0) {
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
        return;
    }
    await Location.startGeofencingAsync(LOCATION_GEOFENCE_TASK, regions);
};

export const stopGeofencing = async () => {
    const isStarted = await Location.hasStartedGeofencingAsync(LOCATION_GEOFENCE_TASK);
    if (isStarted) {
        await Location.stopGeofencingAsync(LOCATION_GEOFENCE_TASK);
    }
};
