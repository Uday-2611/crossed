import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../convex/_generated/api';

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const settings = useQuery(api.settings.getNotificationSettings);
    const updateSettings = useMutation(api.settings.updateNotificationSettings);

    if (settings === undefined) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Loading...</Text>
            </View>
        );
    }

    // Handle null (e.g. user not found)
    if (settings === null) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Error loading settings</Text>
            </View>
        );
    }

    const toggleNewMatch = async (val: boolean) => {
        await updateSettings({
            newMatch: val,
            newMessage: settings.newMessage
        });
    };

    const toggleNewMessage = async (val: boolean) => {
        await updateSettings({
            newMatch: settings.newMatch,
            newMessage: val
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 flex-row items-center border-b border-gray-800">
                <Pressable onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Text className="text-white text-xl font-bold">Notifications</Text>
            </View>

            <View className="p-4">

                {/* New Matches */}
                <View className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-xl mb-4">
                    <View className="flex-1 mr-4">
                        <Text className="text-white text-lg font-semibold mb-1">New Matches</Text>
                        <Text className="text-gray-400 text-sm">
                            Get notified when you match with someone new.
                        </Text>
                    </View>
                    <Switch
                        value={settings.newMatch}
                        onValueChange={toggleNewMatch}
                        trackColor={{ false: '#3f3f46', true: '#10b981' }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
                    />
                </View>

                {/* New Messages */}
                <View className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-xl mb-4">
                    <View className="flex-1 mr-4">
                        <Text className="text-white text-lg font-semibold mb-1">New Messages</Text>
                        <Text className="text-gray-400 text-sm">
                            Get notified when you receive a message.
                        </Text>
                    </View>
                    <Switch
                        value={settings.newMessage}
                        onValueChange={toggleNewMessage}
                        trackColor={{ false: '#3f3f46', true: '#10b981' }}
                        thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
                    />
                </View>

            </View>

        </SafeAreaView>
    );
}
