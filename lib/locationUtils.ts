import ngeohash from "ngeohash";

export const PRIVACY_RULES = {
    ROUNDING_PRECISION: 3,
    EXPLANATION: "Locations are rounded to ~100m for privacy.",
};

const COORD_PRECISION = Math.pow(10, PRIVACY_RULES.ROUNDING_PRECISION);

export const roundCoordinate = (coord: number): number => {
    return Math.round(coord * COORD_PRECISION) / COORD_PRECISION;
};

export const getGeohash = (lat: number, lng: number, precision: number = 7): string => {
    return ngeohash.encode(lat, lng, precision);
};
