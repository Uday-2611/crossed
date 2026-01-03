import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];

export default function Step1Screen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [name, setName] = useState(profile?.name || '');
    const [age, setAge] = useState(profile?.age?.toString() || '');
    const [gender, setGender] = useState(profile?.gender || '');
    const [isSaving, setIsSaving] = useState(false);

    // Pre-fill if profile loads late
    React.useEffect(() => {
        if (profile) {
            if (!name) setName(profile.name || '');
            if (!age) setAge(profile.age?.toString() || '');
            if (!gender) setGender(profile.gender || '');
        }
    }, [profile, name, age, gender]);
    const handleNext = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name.');
            return;
        }
        if (!age || isNaN(Number(age)) || Number(age) < 18) {
            Alert.alert('Invalid Age', 'You must be at least 18 years old.');
            return;
        }
        if (!gender) {
            Alert.alert('Required', 'Please select your gender.');
            return;
        }

        try {
            setIsSaving(true);
            await upsertProfile({
                name,
                age: Number(age),
                gender,
                // Preserve other fields if they exist (though technically new user shouldn't have them)
                bio: profile?.bio || '',
                photos: profile?.photos || [],
                activities: profile?.activities || [],
            });
            router.push('/(onboarding)/step2');
        } catch (error) {
            Alert.alert('Error', 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background px-6 py-4">
            <View className="flex-1">
                <Text className="text-secondary font-medium mb-2 uppercase tracking-widest text-xs">Step 1 of 5</Text>
                <Text className="text-3xl font-bold text-text-primary mb-8">Basic Info</Text>

                <View className="space-y-6">
                    {/* Name */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Full Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Alex Johnson"
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                    </View>

                    {/* Age */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Age</Text>
                        <TextInput
                            value={age}
                            onChangeText={setAge}
                            placeholder="18+"
                            keyboardType="number-pad"
                            maxLength={3}
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                    </View>
                    {/* Gender */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Gender</Text>
                        <View className="flex-row gap-3">
                            {GENDER_OPTIONS.map((option) => (
                                <Pressable
                                    key={option}
                                    onPress={() => setGender(option)}
                                    className={`flex-1 py-3 px-2 rounded-xl border active:opacity-70 ${gender === option
                                        ? 'bg-primary border-primary'
                                        : 'bg-surface border-border/50'
                                        }`}
                                >
                                    <Text
                                        className={`text-center font-medium ${gender === option ? 'text-white' : 'text-text-primary'
                                            }`}
                                    >
                                        {option}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            <Pressable
                onPress={handleNext}
                disabled={isSaving}
                className="bg-primary py-4 rounded-full items-center shadow-md mb-4 active:opacity-80"
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
