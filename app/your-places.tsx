import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
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
        try {
            const data = await getCurrentPlace();
            if (data) {
                setCurrentLocationData(data);
                setModalVisible(true);
            } else {
                Alert.alert('Location Error', 'Unable to get current location');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch location');
        }
    };
    return (
        <View className="flex-1 bg-background">
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
                            pinColor="#1F6F5C"
                        />
                    ))}
                </MapView>
            )}

            <SafeAreaView className="absolute top-0 left-0 right-0 p-4" pointerEvents="box-none">
                <View className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-border/50 flex-row items-center pointer-events-auto">
                    <Pressable onPress={() => router.back()} className="mr-4 p-2 bg-surface-muted rounded-full active:opacity-70">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </Pressable>
                    <View>
                        <Text className="text-xl font-bold text-text-primary">Your Places</Text>
                        <Text className="text-secondary text-sm">
                            {savedLocations ? `${savedLocations.length} saved memories` : 'Loading...'}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            <Pressable
                onPress={handleAddPlace}
                disabled={isLocating}
                className="absolute bottom-10 right-6 bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg active:scale-95"
            >
                {isLocating ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Ionicons name="add" size={32} color="white" />
                )}
            </Pressable>

            <AddPlaceModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                locationData={currentLocationData}
            />
        </View>
    );
}
