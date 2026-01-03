import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform, Pressable, Switch, Text, View } from 'react-native';

export default function PrivacySettingsScreen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const toggleVisibility = useMutation(api.settings.toggleVisibility);

    if (profile === undefined) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Loading...</Text>
            </View>
        );
    }

    const isVisible = profile?.isVisible !== false;

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 flex-row items-center border-b border-gray-800">
                <Pressable onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Text className="text-white text-xl font-bold">Privacy</Text>
            </View>

            <View className="p-4">
                <View className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-xl mb-4">
                    <View className="flex-1 mr-4">
                        <Text className="text-white text-lg font-semibold mb-1">Incognito Mode</Text>
                        <Text className="text-gray-400 text-sm">
                            When enabled, you won't be shown to new people in the discovery feed. You can still chat with existing matches.
                        </Text>
                    </View>
                    <Switch
                        value={!isVisible} 
                        onValueChange={async (val) => {
                            await toggleVisibility({ isVisible: !val });
                        }}
                        trackColor={{ false: '#3f3f46', true: '#ef4444' }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
                    />
                </View>

                <Text className="text-gray-500 text-xs px-2">
                    This effectively pauses your account without deleting it.
                </Text>
            </View>

        </SafeAreaView>
    );
}
