import ngeohash from "ngeohash";

const COORD_PRECISION = 1000; // 3 decimal places

export const roundCoordinate = (coord: number): number => {
    return Math.round(coord * COORD_PRECISION) / COORD_PRECISION;
};

export const getGeohash = (lat: number, lng: number, precision: number = 7): string => {
    return ngeohash.encode(lat, lng, precision);
};

export const PRIVACY_RULES = {
    ROUNDING_PRECISION: 3,
    // Info for UI
    EXPLANATION: "Locations are rounded to ~100m for privacy.",
};
