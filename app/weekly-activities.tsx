import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WeeklyActivitiesScreen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [activities, setActivities] = useState<string[]>(['', '', '']);
    const [isSaving, setIsSaving] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);

    const placeholders = [
        "I tried something new...",
        "I learned about...",
        "I spent time..."
    ];

    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (profile && !hasInitialized) {
            const currentActivities = profile.activities || [];
            const newActivities = ['', '', ''];
            for (let i = 0; i < 3; i++) {
                if (currentActivities[i]) newActivities[i] = currentActivities[i];
            }
            setActivities(newActivities);
            setHasInitialized(true);
        }

        if (profile?.activitiesUpdatedAt) {
            const now = Date.now();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            const timeDiff = now - profile.activitiesUpdatedAt;

            const savedActivitiesCount = (profile.activities || []).length;
            const isProfileIncomplete = savedActivitiesCount < 3;

            if (timeDiff < sevenDays && !isProfileIncomplete) {
                setIsLocked(true);
                setDaysLeft(Math.ceil((sevenDays - timeDiff) / (24 * 60 * 60 * 1000)));
            } else {
                setIsLocked(false);
            }
        }
    }, [profile, hasInitialized]);

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const cleanActivities = activities.filter(a => a.trim().length > 0);

            await upsertProfile({
                name: profile?.name || 'User',
                age: profile?.age || 18,
                bio: profile?.bio || '',
                photos: profile?.photos || [],
                sexuality: profile?.sexuality || 'Heterosexual',
                occupation: profile?.occupation || '',
                university: profile?.university,
                height: profile?.height || 0,
                location: profile?.location || '',
                gender: profile?.gender || '',
                religion: profile?.religion || '',
                politicalLeaning: profile?.politicalLeaning,
                datingIntentions: profile?.datingIntentions,
                activities: cleanActivities,
            });

            Alert.alert("Reflections Saved", "Your profile has been updated.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("Failed to save activities:", error);
            Alert.alert("Cannot Update", error.message || "Something went wrong.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateActivity = (text: string, index: number) => {
        const newActivities = [...activities];
        newActivities[index] = text;
        setActivities(newActivities);
    };

    if (profile === undefined) {
        return (
            <View className='flex-1 justify-center items-center bg-background'>
                <ActivityIndicator size="large" color="#1F6F5C" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4">
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-50">
                        <Ionicons name="close" size={28} color="#000" />
                    </Pressable>
                    {!isLocked && (
                        <Pressable onPress={handleSave} disabled={isSaving} className="active:opacity-50">
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#1F6F5C" />
                            ) : (
                                <Text className="text-brand font-bold text-lg">Save</Text>
                            )}
                        </Pressable>
                    )}
                </View>

                <ScrollView className="flex-1 px-6 pb-20">
                    <View className="mb-8">
                        <Text className="text-3xl font-bold text-text-primary mb-2">This week's activities</Text>
                        <Text className="text-base text-text-secondary leading-6">
                            Share a few things you did recently. It helps potential matches start a conversation.
                        </Text>

                        {isLocked ? (
                            <View className="mt-6 bg-surface-muted p-4 rounded-xl border border-border flex-row items-center gap-3">
                                <Ionicons name="time-outline" size={24} color="#5F6F6B" />
                                <View className="flex-1">
                                    <Text className="text-text-primary font-bold">Updates locked</Text>
                                    <Text className="text-text-secondary text-sm">
                                        You can update your activities again in {daysLeft} days.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <Text className="text-sm mt-2 font-medium text-brand">
                                You can update this once every 7 days.
                            </Text>
                        )}
                    </View>

                    <View className="space-y-6">
                        {[0, 1, 2].map((index) => (
                            <View key={index} className="bg-surface rounded-2xl border border-border/20 p-4 min-h-[120px] mb-2">
                                <TextInput
                                    className="text-lg text-text-primary leading-7"
                                    placeholder={placeholders[index]}
                                    placeholderTextColor="#9AA8A3"
                                    multiline
                                    maxLength={120}
                                    value={activities[index]}
                                    onChangeText={(text) => updateActivity(text, index)}
                                    // Disable input if locked
                                    editable={!isLocked}
                                    style={{ opacity: isLocked ? 0.6 : 1 }}
                                />
                                <Text className="text-xs text-text-muted absolute bottom-4 right-4">
                                    {activities[index].length}/120
                                </Text>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
