const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

export interface PlaceResult {
    place_id: string;
    name: string;
    vicinity: string;
    types: string[];
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
}

export const fetchNearbyPlaces = async (
    lat: number,
    lng: number,
    radius: number = 50
): Promise<PlaceResult[]> => {
    if (!API_KEY) return [];

    try {
        const url = `${PLACES_BASE_URL}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        if (data.status === "OK") {
            return (data.results || []) as PlaceResult[];
        } else {
            return [];
        }
    } catch (error) {
        return [];
    }
};
