const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
    console.warn("Google Maps API Key is missing! Places will not identify correctly.");
}

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
            console.warn(`Google Places API HTTP error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();

        if (data.status === "OK") {
            return (data.results || []) as PlaceResult[];
        } else {
            console.warn("Google Places API Error:", data.status, data.error_message);
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch nearby places:", error);
        return [];
    }
};
