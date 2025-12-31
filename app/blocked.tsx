import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

export default function BlockedUsersScreen() {
    const router = useRouter();
    const blockedUsers = useQuery(api.settings.getBlockedUsers);
    const unblock = useMutation(api.settings.unblockUser);

    const handleUnblock = async (blockId: string, name: string) => {
        Alert.alert(
            "Unblock User",
            `Are you sure you want to unblock ${name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unblock",
                    style: "destructive",
                    onPress: async () => {
                        const id = blockId as Id<"blocks">;
                        await unblock({ blockId: id });
                    }
                }
            ]
        );
    };

    if (blockedUsers === undefined) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 flex-row items-center">
                <Pressable onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </Pressable>
                <Text className="text-white text-xl font-bold">Blocked Users</Text>
            </View>

            <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.blockId}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View className="mt-10 items-center">
                        <Text className="text-gray-500">No blocked users.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="flex-row items-center justify-between bg-zinc-900 p-4 rounded-xl mb-3">
                        <View className="flex-row items-center flex-1">
                            <Image
                                source={{ uri: item.photos && item.photos.length > 0 ? item.photos[0] : 'https://via.placeholder.com/50' }}
                                className="w-12 h-12 rounded-full mr-3 bg-gray-700"
                            />
                            <View>
                                <Text className="text-white font-semibold text-lg">{item.name}</Text>
                                <Text className="text-gray-400 text-sm">Blocked on {new Date(item.blockedAt).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={() => handleUnblock(item.blockId, item.name)}
                            className="bg-zinc-800 px-4 py-2 rounded-full"
                        >
                            <Text className="text-white font-medium">Unblock</Text>
                        </Pressable>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
