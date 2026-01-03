import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, Switch, Text, View } from 'react-native';
import { LOCATION_GEOFENCE_TASK } from '../lib/backgroundLocation';
import { setupGeofencing, stopGeofencing } from '../lib/geofencing';

export default function LocationDiscoveryToggle() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check status on mount and when app comes to foreground
    useEffect(() => {
        checkStatus();
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkStatus();
            }
        });
        return () => subscription.remove();
    }, []);

    const checkStatus = async () => {

        const isGeofencing = await Location.hasStartedGeofencingAsync(LOCATION_GEOFENCE_TASK);
        setIsEnabled(isGeofencing);

    };

    const toggleSwitch = async (value: boolean) => {
        setIsLoading(true);
        try {
            if (value) {
                // TURN ON
                // 1. Ask for Notifications Permission
                const { status: notifStatus } = await Notifications.requestPermissionsAsync();
                if (notifStatus !== 'granted') {
                    Alert.alert("Permission Required", "We need notification permissions to tell you when you're at a cool spot.");
                    setIsEnabled(false);
                    return;
                }

                // 2. Ask for Background Location Permission
                // Note: On iOS, you must request Foreground first, then Background.
                const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
                if (fgStatus !== 'granted') {
                    Alert.alert("Permission Required", "We need location access to find places near you.");
                    setIsEnabled(false);
                    return;
                }

                let bgStatus;
                try {
                    const result = await Location.requestBackgroundPermissionsAsync();
                    bgStatus = result.status;
                } catch (error: any) {
                    // Check for specific Expo Go error regarding missing plist keys
                    if (error.message.includes('UsageDescription') || error.message.includes('Info.plist')) {
                        Alert.alert(
                            "Development Build Required",
                            "Background location requires a custom Development Build or Production Build. It does not work in standard Expo Go.\n\nRest assured, this WILL work in production.",
                            [{ text: "OK" }]
                        );
                        setIsEnabled(false);
                        return;
                    }
                    throw error; // Re-throw other errors
                }

                if (bgStatus !== 'granted') {
                    Alert.alert(
                        "Background Location Required",
                        "To detect when you visit places without opening the app, allow 'Always' in settings. We never track your history.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => Linking.openSettings() }
                        ]
                    );
                    setIsEnabled(false);
                    return;
                }

                // 3. Start Geofencing
                await setupGeofencing();
                setIsEnabled(true);
                Alert.alert("Discovery Active", "Crossed will now notify you when you visit popular places!");

            } else {
                // TURN OFF
                await stopGeofencing();
                setIsEnabled(false);
            }
        } catch {
            Alert.alert("Error", "Could not update settings.");
            await checkStatus();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="bg-surface p-4 rounded-2xl border border-border/60 mb-6">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-4">
                    <Text className="text-lg font-bold text-text-primary mb-1">Passively discover places</Text>
                    <Text className="text-text-secondary text-sm leading-5">
                        Get notified when you visit popular spots so you can save them.
                        {'\n'}
                        <Text className="text-xs text-text-muted mt-1 italic">
                            Strictly opt-in. No location history is tracked.
                        </Text>
                    </Text>
                </View>
                <Switch
                    trackColor={{ false: '#e0e0e0', true: '#1F6F5C' }}
                    thumbColor={'#ffffff'}
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                    disabled={isLoading}
                />
            </View>
        </View>
    );
}
