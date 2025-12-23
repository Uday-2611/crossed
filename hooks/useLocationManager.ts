import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert } from 'react-native';
import { fetchNearbyPlaces, PlaceResult } from '../lib/googlePlaces';

// This file handles the permissions for IOS. 

export interface LocationData {
    coords: {
        lat: number;
        lng: number;
    };
    suggestedPlace?: PlaceResult; // The venue we think they are at
    nearbyPlaces?: PlaceResult[]; // Other options
}

export const useLocationManager = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

    const requestPermissions = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);
            return status === Location.PermissionStatus.GRANTED;
        } catch (error) {
            console.error("Permission request failed", error);
            return false;
        }
    };

    const getCurrentPlace = async (): Promise<LocationData | null> => {
        setIsLoading(true);
        try {
            // 1. Check/Get Permission
            let status = permissionStatus;
            if (!status) {
                const result = await Location.getForegroundPermissionsAsync();
                status = result.status;
            }

            if (status !== Location.PermissionStatus.GRANTED) {
                const granted = await requestPermissions();
                if (!granted) {
                    Alert.alert("Permission Required", "Crossed needs location access to save places.");
                    return null;
                }
            }

            // 2. Get Coords
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = location.coords;

            // 3. Identify Place (Google Places)
            const places = await fetchNearbyPlaces(latitude, longitude);

            return {
                coords: { lat: latitude, lng: longitude },
                suggestedPlace: places[0] || undefined,
                nearbyPlaces: places.slice(1),
            };

        } catch (error) {
            console.error("Error getting location:", error);
            Alert.alert("Error", "Could not fetch location.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        requestPermissions,
        getCurrentPlace,
        isLoading,
        permissionStatus
    };
};
