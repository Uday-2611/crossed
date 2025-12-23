import { useMutation } from 'convex/react';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../../convex/_generated/api';
import { LocationData } from '../../hooks/useLocationManager';
import { getGeohash, roundCoordinate } from '../../lib/locationUtils';

interface AddPlaceModalProps {
    visible: boolean;
    onClose: () => void;
    locationData: LocationData | null;
}

export default function AddPlaceModal({ visible, onClose, locationData }: AddPlaceModalProps) {
    const saveLocation = useMutation(api.locations.saveLocation);
    const [name, setName] = useState(locationData?.suggestedPlace?.name || '');
    const [category, setCategory] = useState(locationData?.suggestedPlace?.types?.[0] || 'place');
    const [isSaving, setIsSaving] = useState(false);

    // Update state when new data comes in
    React.useEffect(() => {
        if (locationData?.suggestedPlace) {
            setName(locationData.suggestedPlace.name);
            setCategory(mapGoogleTypeToLabel(locationData.suggestedPlace.types));
        } else if (locationData) {
            setName("My Current Location");
            setCategory("custom");
        }
    }, [locationData]);

    const handleSave = async () => {
        if (!locationData) return;
        setIsSaving(true);
        try {
            const { lat, lng } = locationData.coords;
            // PRIVACY: Round coordinates before saving
            // We store rounded coords effectively, but the prompt says 
            // "Approximate coordinates (rounded)".
            // Our Schema expects rounded.
            const roundedLat = roundCoordinate(lat);
            const roundedLng = roundCoordinate(lng);
            const geohash = getGeohash(roundedLat, roundedLng);

            await saveLocation({
                name,
                lat: roundedLat,
                lng: roundedLng,
                geohash,
                category,
                address: locationData.suggestedPlace?.vicinity,
            });
            onClose();
        } catch (error) {
            console.error("Failed to save location", error);
            // In a real app, show toast
        } finally {
            setIsSaving(false);
        }
    };

    if (!locationData) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4 border-b border-border/10">
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-secondary text-lg">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-bold">Save Place</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving || !name.trim()}>
                        {isSaving ? <ActivityIndicator /> : <Text className="text-primary text-lg font-bold">Save</Text>}
                    </TouchableOpacity>
                </View>

                {/* Map Preview */}
                <View className="h-48 w-full">
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: locationData.coords.lat,
                            longitude: locationData.coords.lng,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        <Marker coordinate={{ latitude: locationData.coords.lat, longitude: locationData.coords.lng }} />
                    </MapView>
                </View>

                {/* Form */}
                <View className="p-6 space-y-6">
                    <View>
                        <Text className="text-secondary mb-2 text-sm uppercase font-semibold tracking-wider">Place Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            className="bg-surface p-4 rounded-xl text-xl font-bold text-text-primary"
                            placeholder="e.g. Blue Tokai Coffee"
                        />
                    </View>

                    <View>
                        <Text className="text-secondary mb-2 text-sm uppercase font-semibold tracking-wider">Category</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {/* Quick Category Chips */}
                            {['Cafe', 'Gym', 'Work', 'Home', 'Park', 'Bar'].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-full border ${category === cat ? 'bg-primary border-primary' : 'bg-surface border-border'} `}
                                >
                                    <Text className={category === cat ? 'text-white' : 'text-text-primary'}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Text className="text-xs text-secondary text-center mt-4">
                        This location will be rounded to ~100m for privacy.
                        Exact coordinates are not stored.
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

// Helper to clean up Google types
function mapGoogleTypeToLabel(types?: string[]) {
    if (!types || types.length === 0) return 'Place';
    const main = types[0].replace(/_/g, ' ');
    return main.charAt(0).toUpperCase() + main.slice(1);
}
