import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];
const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jewish', 'Spiritual', 'Atheist', 'Agnostic', 'Other', 'Prefer not to say'];
const POLITICS_OPTIONS = ['Liberal', 'Moderate', 'Conservative', 'Apolitical', 'Prefer not to say'];
const DATING_INTENTIONS = ['Long-term relationship', 'Short-term', 'Casual dating', 'Not sure yet'];
const SEXUALITY_OPTIONS = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Pansexual', 'Queer', 'Questioning', 'Prefer not to say'];

export default function AboutYouScreen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        occupation: '',
        isStudent: false,
        university: '',
        height: '',
        location: '', // Hometown
        gender: '',
        sexuality: '',
        religion: '',
        politicalLeaning: '',
        datingIntentions: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                occupation: profile.occupation || '',
                university: profile.university || '',
                isStudent: !!profile.university, 
                height: profile.height ? profile.height.toString() : '',
                location: profile.location || '',
                gender: profile.gender || '',
                sexuality: profile.sexuality || '',
                religion: profile.religion || '',
                politicalLeaning: profile.politicalLeaning || '',
                datingIntentions: profile.datingIntentions || '',
            }));
        }
    }, [profile]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await upsertProfile({
                name: profile?.name || 'User',
                age: profile?.age || 18,
                bio: profile?.bio || '',
                photos: profile?.photos || [],
                activities: profile?.activities || [],
                // Updated fields:
                occupation: formData.occupation,
                university: formData.isStudent ? formData.university : undefined, // clear uni if not student
                height: formData.height ? (parseInt(formData.height) || 0) : 0,
                location: formData.location,
                gender: formData.gender,
                sexuality: formData.sexuality || 'Straight', religion: formData.religion,
                politicalLeaning: formData.politicalLeaning,
                datingIntentions: formData.datingIntentions,
            });

            Alert.alert("Success", "Profile updated successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (profile === undefined) {
        return (
            <View className='flex-1 justify-center items-center bg-background'>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/10">
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-50">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </Pressable>
                    <Text className="text-lg font-bold">About you</Text>
                    <Pressable onPress={handleSave} disabled={isSaving} className="active:opacity-50">
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <Text className="text-primary font-semibold text-lg">Save</Text>
                        )}
                    </Pressable>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>

                    {/* SECTION 1: Work & Education */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Work & Education</Text>
                        <View className="bg-surface rounded-2xl border border-border/20 overflow-hidden p-4 space-y-4">
                            <View>
                                <Text className="text-secondary text-base mb-1 font-medium">Occupation</Text>
                                <TextInput
                                    className="text-lg text-primary py-2 border-b border-border/10 placeholder:text-gray-600"
                                    placeholder="What do you do?"
                                    value={formData.occupation}
                                    onChangeText={(t) => updateField('occupation', t)}
                                />
                            </View>

                            <View className="flex-row items-center justify-between py-2">
                                <Text className="text-lg font-medium">I'm a student</Text>
                                <Switch
                                    value={formData.isStudent}
                                    onValueChange={(val) => updateField('isStudent', val)}
                                    trackColor={{ false: '#e0e0e0', true: '#000' }}
                                />
                            </View>

                            {formData.isStudent && (
                                <View>
                                    <Text className="text-secondary text-base mb-1 font-medium">University</Text>
                                    <TextInput
                                        className="text-lg text-primary py-2 border-b border-border/10"
                                        placeholder="Name of university"
                                        value={formData.university}
                                        onChangeText={(t) => updateField('university', t)}
                                    />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* SECTION 2: Height */}
                    <View className="mb-8">
                        <View className="flex-row items-baseline justify-between mb-4">
                            <Text className="text-lg font-bold">Height</Text>
                            <Text className="text-secondary text-xs">Only shown if you want</Text>
                        </View>
                        <View className="bg-surface rounded-2xl border border-border/20 p-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-base font-medium">Height (cm)</Text>
                                <TextInput
                                    className="text-right text-lg font-semibold min-w-[60px] p-0 pb-3"
                                    value={formData.height}
                                    onChangeText={(t) => updateField('height', t)}
                                    keyboardType="numeric"
                                    placeholder="Add"
                                    maxLength={3}
                                />
                            </View>
                        </View>
                    </View>

                    {/* SECTION 3: Hometown */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Hometown</Text>
                        <View className="bg-surface rounded-2xl border border-border/20 p-4">
                            <TextInput
                                className="text-lg text-primary p-0 pb-3"
                                placeholder="City or town"
                                value={formData.location}
                                onChangeText={(t) => updateField('location', t)}
                            />
                        </View>
                    </View>

                    {/* SECTION 4: Gender */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Gender</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {GENDER_OPTIONS.map(option => (
                                <Pressable
                                    key={option}
                                    onPress={() => updateField('gender', formData.gender === option ? '' : option)}
                                    className={`px-6 py-4 rounded-xl border active:opacity-70 ${formData.gender === option ? 'bg-black border-black' : 'bg-transparent border-gray-300'}`}
                                >
                                    <Text className={`font-medium ${formData.gender === option ? 'text-white' : 'text-primary'}`}>{option}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* SECTION 4.5: Sexuality */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Sexuality</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {SEXUALITY_OPTIONS.map(option => (
                                <Pressable
                                    key={option}
                                    onPress={() => updateField('sexuality', formData.sexuality === option ? '' : option)}
                                    className={`px-6 py-4 rounded-xl border active:opacity-70 ${formData.sexuality === option ? 'bg-black border-black' : 'bg-transparent border-gray-300'}`}
                                >
                                    <Text className={`font-medium ${formData.sexuality === option ? 'text-white' : 'text-primary'}`}>{option}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* SECTION 5: Religion */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Religion</Text>
                        <View className="bg-surface rounded-2xl border border-border/20 overflow-hidden">
                            {RELIGION_OPTIONS.map((option, index) => (
                                <Pressable
                                    key={option}
                                    onPress={() => updateField('religion', formData.religion === option ? '' : option)}
                                    className={`flex-row items-center justify-between p-4 active:bg-gray-50 active:opacity-70 ${index !== RELIGION_OPTIONS.length - 1 ? 'border-b border-border/10' : ''}`}
                                >
                                    <Text className="text-base font-medium">{option}</Text>
                                    {formData.religion === option && <Ionicons name="checkmark" size={20} color="#000" />}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* SECTION 6: Political Leaning */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Political Leaning</Text>
                        <View className="bg-surface rounded-2xl border border-border/20 overflow-hidden">
                            {POLITICS_OPTIONS.map((option, index) => (
                                <Pressable
                                    key={option}
                                    onPress={() => updateField('politicalLeaning', formData.politicalLeaning === option ? '' : option)}
                                    className={`flex-row items-center justify-between p-4 active:bg-gray-50 active:opacity-70 ${index !== POLITICS_OPTIONS.length - 1 ? 'border-b border-border/10' : ''}`}
                                >
                                    <Text className="text-base font-medium">{option}</Text>
                                    {formData.politicalLeaning === option && <Ionicons name="checkmark" size={20} color="#000" />}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* SECTION 7: Dating Intentions */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold mb-4">Dating Intentions</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {DATING_INTENTIONS.map(option => (
                                <Pressable
                                    key={option}
                                    onPress={() => updateField('datingIntentions', formData.datingIntentions === option ? '' : option)}
                                    className={`px-4 py-3 rounded-xl border active:opacity-70 ${formData.datingIntentions === option ? 'bg-black border-black' : 'bg-transparent border-gray-300'}`}
                                >
                                    <Text className={`font-medium text-sm ${formData.datingIntentions === option ? 'text-white' : 'text-primary'}`}>{option}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
