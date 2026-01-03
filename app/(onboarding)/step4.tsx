import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';

export default function Step4Screen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [activities, setActivities] = useState(['', '', '']);
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!isInitialized && profile && profile.activities && profile.activities.length > 0) {
            // Pad with empty strings if less than 3
            const loaded = [...profile.activities];
            while (loaded.length < 3) loaded.push('');
            setActivities(loaded);
            setIsInitialized(true);
        }
    }, [profile, isInitialized]);

    if (profile === undefined) {
        return (
            <SafeAreaView className="flex-1 bg-background px-6 py-4 items-center justify-center">
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    const updateActivity = (index: number, text: string) => {
        const newActivities = [...activities];
        newActivities[index] = text;
        setActivities(newActivities);
    };

    const handleNext = async () => {
        try {
            setIsSaving(true);
            const cleanActivities = activities.filter(a => a.trim().length > 0);

            await upsertProfile({
                name: profile?.name || '',
                age: profile?.age || 18,
                // Safety
                photos: profile?.photos || [],

                activities: cleanActivities,
                // activitiesUpdatedAt handled by backend
            });
            router.push('/(onboarding)/step5');
        } catch {
            Alert.alert('Error', 'Failed to save activities.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background px-6 py-4">
            <View className="flex-row items-center justify-between mb-4">
                <Pressable onPress={() => router.back()} className="active:opacity-50">
                    <Text className="text-secondary text-lg">Back</Text>
                </Pressable>
                <Text className="text-secondary font-medium uppercase tracking-widest text-xs">Step 4 of 5</Text>
                <View className="w-10" />
            </View>

            <Text className="text-3xl font-bold text-text-primary mb-2">Weekly Activities</Text>
            <Text className="text-text-secondary text-base mb-6">
                What have you been up to? Share 3 things to break the ice.
            </Text>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="space-y-4">
                        {[0, 1, 2].map((i) => (
                            <View key={i}>
                                <Text className="text-text-secondary text-sm mb-2 font-medium">Activity {i + 1}</Text>
                                <TextInput
                                    value={activities[i]}
                                    onChangeText={(text) => updateActivity(i, text)}
                                    placeholder={i === 0 ? "I tried a new cafe..." : i === 1 ? "I went hiking..." : "I read a book about..."}
                                    multiline
                                    numberOfLines={3}
                                    className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50 h-24"
                                    textAlignVertical="top"
                                />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Pressable
                onPress={handleNext}
                disabled={isSaving}
                className="bg-primary py-4 rounded-full items-center shadow-md mb-4 mt-4 active:opacity-80"
            >
                {isSaving ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-lg font-bold">Next</Text>
                )}
            </Pressable>
        </SafeAreaView>
    );
}
