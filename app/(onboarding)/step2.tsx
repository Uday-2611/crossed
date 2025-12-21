import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';

export default function Step2Screen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [occupation, setOccupation] = useState('');
    const [isStudent, setIsStudent] = useState(false);
    const [university, setUniversity] = useState('');
    const [height, setHeight] = useState('');
    const [hometown, setHometown] = useState('');
    const [religion, setReligion] = useState('');
    const [politics, setPolitics] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setOccupation(profile.occupation || '');
            setIsStudent(!!profile.university);
            setUniversity(profile.university || '');
            setHeight(profile.height ? profile.height.toString() : '');
            setHometown(profile.location || '');
            setReligion(profile.religion || '');
            setPolitics(profile.politicalLeaning || '');
        }
    }, [profile]);

    const handleNext = async () => {
        try {
            setIsSaving(true);
            await upsertProfile({
                // New fields
                occupation,
                isStudent,
                university: isStudent ? university : undefined,
                height: height && !isNaN(Number(height)) ? Number(height) : 0,
                location: hometown,
                religion,
                politicalLeaning: politics,
            });
            router.push('/(onboarding)/step3');
        } catch (error) {
            console.error('Failed to save step 2:', error);
            Alert.alert('Error', 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background px-6 py-4">
            <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-secondary text-lg">Back</Text>
                </TouchableOpacity>
                <Text className="text-secondary font-medium uppercase tracking-widest text-xs">Step 2 of 5</Text>
                <View className="w-10" />
            </View>

            <Text className="text-3xl font-bold text-text-primary mb-6">About You</Text>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="space-y-6 pb-20">
                    {/* Occupation */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Occupation</Text>
                        <TextInput
                            value={occupation}
                            onChangeText={setOccupation}
                            placeholder="e.g. Product Designer"
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                    </View>

                    {/* Student Status */}
                    <View className="flex-row items-center justify-between bg-surface p-4 rounded-xl border border-border/50">
                        <Text className="text-text-primary text-lg font-medium">I am a student</Text>
                        <Switch
                            value={isStudent}
                            onValueChange={setIsStudent}
                            trackColor={{ false: '#e0e0e0', true: '#1F6F5C' }}
                        />
                    </View>

                    {/* University (Conditional) */}
                    {isStudent && (
                        <View>
                            <Text className="text-text-secondary text-base mb-2 font-medium">University</Text>
                            <TextInput
                                value={university}
                                onChangeText={setUniversity}
                                placeholder="e.g. Stanford University"
                                className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                            />
                        </View>
                    )}

                    {/* Height */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Height (cm)</Text>
                        <TextInput
                            value={height}
                            onChangeText={setHeight}
                            placeholder="e.g. 175"
                            keyboardType="number-pad"
                            maxLength={3}
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                    </View>

                    {/* Hometown */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Hometown</Text>
                        <TextInput
                            value={hometown}
                            onChangeText={setHometown}
                            placeholder="e.g. Chicago, IL"
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                    </View>

                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Religion</Text>
                        <TextInput
                            value={religion}
                            onChangeText={setReligion}
                            placeholder="Select or type..."
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                        <Text className="text-xs text-gray-400 mt-1">Type your religion (e.g. Hindu, Christian, Agnostic)</Text>
                    </View>

                    {/* Politics */}
                    <View>
                        <Text className="text-text-secondary text-base mb-2 font-medium">Political Leaning</Text>
                        <TextInput
                            value={politics}
                            onChangeText={setPolitics}
                            placeholder="e.g. Moderate, Liberal"
                            className="bg-surface p-4 rounded-xl text-lg text-text-primary border border-border/50"
                        />
                    </View>

                </View>
            </ScrollView>

            <TouchableOpacity
                onPress={handleNext}
                disabled={isSaving}
                className="bg-primary py-4 rounded-full items-center shadow-md mb-4 absolute bottom-4 left-6 right-6"
            >
                {isSaving ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-lg font-bold">Next</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
}
