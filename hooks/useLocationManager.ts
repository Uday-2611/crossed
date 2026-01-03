import { Alert } from 'react-native';
import { useRef, useState } from 'react';
import * as Location from 'expo-location';
import { fetchNearbyPlaces, PlaceResult } from '../lib/googlePlaces';

export interface LocationData {
    coords: {
        lat: number;
        lng: number;
    };
    suggestedPlace?: PlaceResult;
    nearbyPlaces?: PlaceResult[];
}

export const useLocationManager = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

    const inFlightRequest = useRef<Promise<LocationData | null> | null>(null);

    const requestPermissions = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);
            return status === Location.PermissionStatus.GRANTED;
        } catch (error) {
            return false;
        }
    };

    const getCurrentPlace = async (): Promise<LocationData | null> => {
        if (inFlightRequest.current) {
            return inFlightRequest.current;
        }

        const request = (async () => {
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
                Alert.alert("Error", "Could not fetch location.");
                return null;
            } finally {
                setIsLoading(false);
                inFlightRequest.current = null;
            }
        })();

        inFlightRequest.current = request;
        return request;
    };

    return {
        requestPermissions, getCurrentPlace, isLoading, permissionStatus
    };
};
