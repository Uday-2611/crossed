import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'; // PROVIDER_DEFAULT uses Apple Maps on iOS
import { SafeAreaView } from 'react-native-safe-area-context';
import AddPlaceModal from '../components/locations/AddPlaceModal';
import { api } from '../convex/_generated/api';
import { useLocationManager } from '../hooks/useLocationManager';

export default function PlacesScreen() {
    const router = useRouter();
    const savedLocations = useQuery(api.locations.getMyLocations);
    const { getCurrentPlace, isLoading: isLocating } = useLocationManager();
    const [isModalVisible, setModalVisible] = useState(false);
    const [currentLocationData, setCurrentLocationData] = useState<any>(null);

    const handleAddPlace = async () => {
        const data = await getCurrentPlace();
        if (data) {
            setCurrentLocationData(data);
            setModalVisible(true);
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Map filling the screen */}
            {savedLocations === undefined ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1F6F5C" />
                </View>
            ) : (
                <MapView
                    style={{ flex: 1 }}
                    provider={PROVIDER_DEFAULT}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    initialRegion={{
                        // Default to a view or the first saved place
                        latitude: savedLocations.length > 0 ? savedLocations[0].lat : 37.78825,
                        longitude: savedLocations.length > 0 ? savedLocations[0].lng : -122.4324,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {savedLocations?.map((loc: any) => (
                        <Marker
                            key={loc._id}
                            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                            title={loc.name}
                            description={loc.category}
                            pinColor="#1F6F5C" // Brand color
                        />
                    ))}
                </MapView>
            )}

            {/* Overlay Header with Back Button */}
            <SafeAreaView className="absolute top-0 left-0 right-0 p-4" pointerEvents="box-none">
                <View className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-border/50 flex-row items-center pointer-events-auto">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-surface-muted rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-bold text-text-primary">Your Places</Text>
                        <Text className="text-secondary text-sm">
                            {savedLocations ? `${savedLocations.length} saved memories` : 'Loading...'}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Floating Add Button */}
            <TouchableOpacity
                onPress={handleAddPlace}
                disabled={isLocating}
                className="absolute bottom-10 right-6 bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg"
            >
                {isLocating ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Ionicons name="add" size={32} color="white" />
                )}
            </TouchableOpacity>

            {/* Modal */}
            <AddPlaceModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                locationData={currentLocationData}
            />
        </View>
    );
}
