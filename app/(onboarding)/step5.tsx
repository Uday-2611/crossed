import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';

export default function Step5Screen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [distance, setDistance] = useState(50);
    const [interestedIn, setInterestedIn] = useState<string>('Everyone');
    const [minAge, setMinAge] = useState(18);
    const [maxAge, setMaxAge] = useState(30);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile?.datingPreferences) {
            setDistance(profile.datingPreferences.maxDistanceKm || 50);
            setInterestedIn(profile.datingPreferences.interestedIn || 'Everyone');
            if (profile.datingPreferences.ageRange) {
                setMinAge(profile.datingPreferences.ageRange[0]);
                setMaxAge(profile.datingPreferences.ageRange[1]);
            }
        }
    }, [profile]);

    const handleFinish = async () => {
        if (!profile) {
            Alert.alert('Error', 'Profile data is still loading. Please wait.');
            return;
        }

        try {
            setIsSaving(true);
            await upsertProfile({
                name: profile.name,
                age: profile.age,
                photos: profile.photos,
                activities: profile.activities,
                datingPreferences: {
                    maxDistanceKm: distance,
                    interestedIn: interestedIn,
                    ageRange: [minAge, maxAge],
                    religion: [],
                },
                isOnboardingComplete: true,
            });

            router.replace('/(tabs)/matches');
        } catch {
            Alert.alert('Error', 'Failed to finish setup.');
        } finally {
            setIsSaving(false);
        }
    };
    const renderInterestedInOption = (option: string) => {
        const isSelected = interestedIn === option;
        return (
            <Pressable
                key={option}
                onPress={() => setInterestedIn(option)}
                style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: isSelected ? 'white' : 'transparent',
                    shadowColor: isSelected ? '#000' : 'transparent',
                    shadowOffset: isSelected ? { width: 0, height: 1 } : { width: 0, height: 0 },
                    shadowOpacity: isSelected ? 0.05 : 0,
                    shadowRadius: isSelected ? 2 : 0,
                    elevation: isSelected ? 1 : 0,
                    opacity: pressed ? 0.7 : 1
                })}
            >
                <Text
                    style={{
                        textAlign: 'center',
                        fontWeight: '500',
                        color: isSelected ? '#FF6B6B' : '#6B7280',
                    }}
                >
                    {option}
                </Text>
            </Pressable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background px-6 py-4">
            <View className="flex-row items-center justify-between mb-4">
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                    <Text className="text-secondary text-lg">Back</Text>
                </Pressable>
                <Text className="text-secondary font-medium uppercase tracking-widest text-xs">
                    Step 5 of 5
                </Text>
                <View className="w-10" />
            </View>

            <Text className="text-3xl font-bold text-text-primary mb-6">Preferences</Text>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="space-y-8">
                    {/* Interested In */}
                    <View>
                        <Text className="text-text-secondary text-base mb-3 font-medium">
                            Interested In
                        </Text>
                        <View className="flex-row rounded-xl bg-surface p-1 border border-border/50">
                            {renderInterestedInOption('Men')}
                            {renderInterestedInOption('Women')}
                            {renderInterestedInOption('Everyone')}
                        </View>
                    </View>

                    {/* Distance */}
                    <View>
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-text-secondary text-base font-medium">
                                Maximum Distance
                            </Text>
                            <Text className="text-primary font-bold">{distance} km</Text>
                        </View>
                        <View className="flex-row justify-between items-center bg-surface p-4 rounded-xl border border-border/50">
                            <Pressable
                                onPress={() => setDistance(Math.max(1, distance - 5))}
                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            >
                                <Text className="text-2xl text-primary">-</Text>
                            </Pressable>
                            <Text className="text-xl font-medium">{distance}</Text>
                            <Pressable
                                onPress={() => setDistance(Math.min(100, distance + 5))}
                                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            >
                                <Text className="text-2xl text-primary">+</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Age Range */}
                    <View>
                        <Text className="text-text-secondary text-base mb-3 font-medium">
                            Age Range
                        </Text>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="mb-2 text-xs text-text-secondary uppercase">
                                    Min Age
                                </Text>
                                <View className="bg-surface p-4 rounded-xl border border-border/50 flex-row justify-between items-center">
                                    <Pressable
                                        onPress={() => setMinAge(Math.max(18, minAge - 1))}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                    >
                                        <Text className="text-lg text-primary">-</Text>
                                    </Pressable>
                                    <Text className="text-lg font-bold">{minAge}</Text>
                                    <Pressable
                                        onPress={() => setMinAge(Math.min(maxAge, minAge + 1))}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                    >
                                        <Text className="text-lg text-primary">+</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="mb-2 text-xs text-text-secondary uppercase">
                                    Max Age
                                </Text>
                                <View className="bg-surface p-4 rounded-xl border border-border/50 flex-row justify-between items-center">
                                    <Pressable
                                        onPress={() => setMaxAge(Math.max(minAge, maxAge - 1))}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                    >
                                        <Text className="text-lg text-primary">-</Text>
                                    </Pressable>
                                    <Text className="text-lg font-bold">{maxAge}</Text>
                                    <Pressable
                                        onPress={() => setMaxAge(Math.min(60, maxAge + 1))}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                                    >
                                        <Text className="text-lg text-primary">+</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Pressable
                onPress={handleFinish}
                disabled={isSaving}
                className="bg-primary py-4 rounded-full items-center shadow-md mb-4 mt-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
                {isSaving ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-lg font-bold">Finish Setup</Text>
                )}
            </Pressable>
        </SafeAreaView>
    );
}