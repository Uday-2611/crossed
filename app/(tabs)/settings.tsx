import { api } from '@/convex/_generated/api';
import { useClerk, useUser } from '@clerk/clerk-expo';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Slider from '@react-native-community/slider';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Settings = () => {
    const { signOut } = useClerk();
    const { user } = useUser();
    const router = useRouter();
    const deleteAccountMutation = useMutation(api.profiles.deleteMyAccount);
    const [isDeleting, setIsDeleting] = useState(false);

    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    // Preferences State
    const [interestedIn, setInterestedIn] = useState('Women');
    const [ageRange, setAgeRange] = useState([21, 26]); // [min, max]
    const [distance, setDistance] = useState(50);
    const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);

    // Sync with backend
    useEffect(() => {
        if (profile?.datingPreferences) {
            const prefs = profile.datingPreferences;
            if (prefs.interestedIn) setInterestedIn(prefs.interestedIn);
            if (prefs.ageRange) setAgeRange(prefs.ageRange);
            if (prefs.maxDistanceKm) setDistance(prefs.maxDistanceKm);
            if (prefs.religion) setSelectedReligions(prefs.religion || []);
        }
    }, [profile]);

    type DatingPreferences = {
        interestedIn?: string;
        ageRange?: number[];
        maxDistanceKm?: number;
        religion?: string[];
    };

    const handleSavePreferences = async (updates: DatingPreferences = {}) => {
        if (!profile) return;

        const finalPreferences = {
            interestedIn: updates.interestedIn ?? interestedIn,
            ageRange: updates.ageRange ?? ageRange,
            maxDistanceKm: updates.maxDistanceKm ?? distance,
            religion: updates.religion ?? selectedReligions,
        };

        try {
            setIsSavingPrefs(true);
            await upsertProfile({
                name: profile.name,
                age: profile.age,
                bio: profile.bio,
                photos: profile.photos,
                activities: profile.activities,
                sexuality: profile.sexuality,
                occupation: profile.occupation,
                university: profile.university,
                height: profile.height,
                location: profile.location,
                gender: profile.gender,
                religion: profile.religion,
                politicalLeaning: profile.politicalLeaning,
                datingIntentions: profile.datingIntentions,
                datingPreferences: finalPreferences
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Not religious'];

    return (
        <View className='flex-1 bg-background pb-24'>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className='flex-1' edges={['top']}>
                {/* Header */}
                <View className='px-6 pt-4 pb-6'>
                    <Text className='font-bold text-4xl text-text-primary tracking-tight'>Settings</Text>
                </View>

                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>

                    {/* Section 1: Account */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Account</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Edit Profile</Text>
                            </TouchableOpacity>

                            <View className='p-4 border-b border-gray-200'>
                                <Text className='text-base font-medium text-black mb-1'>Account Information</Text>
                                <Text className='text-sm text-gray-500'>
                                    {user?.primaryEmailAddress?.emailAddress || 'Linked with Apple/Google'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                className='p-4 border-b border-gray-200 active:bg-gray-100/50'
                                onPress={async () => {
                                    try {
                                        await signOut();
                                        router.replace("/(auth)/sign-in");
                                    } catch (err) {
                                        console.error("Logout failed", err);
                                        Alert.alert("Error", "Failed to log out. Please try again.");
                                    }
                                }}                            >
                                <Text className='text-base font-medium text-black'>Log Out</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='p-4 active:bg-red-50/50'
                                disabled={isDeleting}
                                onPress={() => {
                                    Alert.alert(
                                        "Delete account?",
                                        "This will permanently delete your profile, photos, matches, and chats.\nThis action cannot be undone.",
                                        [
                                            {
                                                text: "Cancel",
                                                style: "cancel"
                                            },
                                            {
                                                text: "Delete account",
                                                style: "destructive",
                                                onPress: async () => {
                                                    try {
                                                        setIsDeleting(true);

                                                        // 1. Delete from Convex (Must come first while auth token is valid)
                                                        await deleteAccountMutation();

                                                        // 2. Delete from Clerk
                                                        if (user) {
                                                            await user.delete();
                                                        } else {
                                                            await signOut();
                                                        }

                                                        // 3. Redirect
                                                        router.replace("/(auth)/sign-in");

                                                    } catch (error) {
                                                        console.error("Delete account failed:", error as any);
                                                        Alert.alert("Error", "Failed to delete account. Please try again.");
                                                        setIsDeleting(false);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <Text className={`text-base font-medium ${isDeleting ? 'text-gray-400' : 'text-red-500'}`}>
                                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Loading Overlay */}
                    <Modal transparent visible={isDeleting}>
                        <View className="flex-1 bg-black/50 items-center justify-center">
                            <View className="bg-white p-6 rounded-2xl items-center shadow-xl">
                                <ActivityIndicator size="large" color="#FF3B30" />
                                <Text className="mt-4 font-bold text-lg text-text-primary">Deleting Account...</Text>
                                <Text className="text-gray-500 text-sm mt-1">Please wait</Text>
                            </View>
                        </View>
                    </Modal>

                    {/* Section 1.5: Dating Preferences */}
                    <View className='px-6 mb-8'>
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className='text-lg font-bold text-black tracking-tight'>Dating Preferences</Text>
                            {isSavingPrefs && <ActivityIndicator size="small" color="#000" />}
                        </View>
                        <View className='bg-gray-50 rounded-2xl p-4 gap-6'>

                            {/* Age Range Slider */}
                            <View>
                                <View className='flex-row justify-between mb-3'>
                                    <Text className='text-base font-medium text-black'>Age range</Text>
                                    <Text className='text-base font-medium text-gray-500'>{ageRange[0]} – {ageRange[1]}</Text>
                                </View>

                                <View className="items-center w-full px-2">
                                    <MultiSlider
                                        values={[ageRange[0], ageRange[1]]}
                                        sliderLength={280} // Approx width
                                        onValuesChange={(values) => setAgeRange(values)}
                                        onValuesChangeFinish={(values) => handleSavePreferences({ ageRange: values })}
                                        min={18}
                                        max={60}
                                        step={1}
                                        allowOverlap={false}
                                        snapped
                                        markerStyle={{
                                            backgroundColor: '#FFFFFF',
                                            height: 24,
                                            width: 24,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: '#E5E7EB',
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 1.41,
                                            elevation: 2,
                                        }}
                                        selectedStyle={{
                                            backgroundColor: '#000000',
                                        }}
                                        unselectedStyle={{
                                            backgroundColor: '#E5E7EB',
                                        }}
                                        trackStyle={{
                                            height: 4,
                                            backgroundColor: '#E5E7EB',
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Distance Slider */}
                            <View>
                                <View className='flex-row justify-between mb-3'>
                                    <Text className='text-base font-medium text-black'>Distance</Text>
                                    <Text className='text-base font-medium text-gray-500'>Up to {distance} km</Text>
                                </View>
                                <Slider
                                    style={{ width: '100%', height: 40 }}
                                    minimumValue={1}
                                    maximumValue={100}
                                    step={1}
                                    value={distance}
                                    onValueChange={(val: number) => setDistance(val)}
                                    onSlidingComplete={(val: number) => handleSavePreferences({ maxDistanceKm: val })}
                                    minimumTrackTintColor="#000000"
                                    maximumTrackTintColor="#E5E7EB"
                                    thumbTintColor="#FFFFFF"
                                />
                                <Text className='text-xs text-gray-400 mt-1'>We'll show people within this distance</Text>
                            </View>

                            {/* Interested In */}
                            <View>
                                <Text className='text-base font-medium text-black mb-3'>Interested in</Text>
                                <View className='flex-row rounded-lg overflow-hidden border border-gray-200'>
                                    {['Men', 'Women', 'Everyone'].map((option, idx) => {
                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                onPress={() => {
                                                    setInterestedIn(option);
                                                    handleSavePreferences({ interestedIn: option });
                                                }}
                                                className={`flex-1 py-3 items-center ${interestedIn === option ? 'bg-black' : 'bg-white'} ${idx !== 2 ? 'border-r border-gray-200' : ''} `}
                                            >
                                                <Text className={`font-medium ${interestedIn === option ? 'text-white' : 'text-black'} `}>{option}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Religion */}
                            <View>
                                <Text className='text-base font-medium text-black mb-3'>Religion <Text className='text-gray-400 font-normal'>(Optional)</Text></Text>
                                <View className='flex-row flex-wrap gap-2'>
                                    {RELIGIONS.map((item) => {
                                        const isSelected = selectedReligions.includes(item);
                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => {
                                                    let newVal: string[];
                                                    if (isSelected) {
                                                        newVal = selectedReligions.filter(r => r !== item);
                                                    } else {
                                                        newVal = [...selectedReligions, item];
                                                    }
                                                    setSelectedReligions(newVal);
                                                    handleSavePreferences({ religion: newVal });
                                                }}
                                                className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-black border-black' : 'bg-white border-gray-200'} `}
                                            >
                                                <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'} `}>{item}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                        </View>
                    </View>

                    {/* Section 2: Privacy & Safety */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Privacy & Safety</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Privacy Settings</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Blocked Users</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Report a Problem</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 3: Preferences */}
                    <View className='px-6 mb-8'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Preferences</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Notifications</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Location Usage</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 4: Legal & About */}
                    <View className='px-6 mb-12'>
                        <Text className='text-lg font-bold text-black mb-4 tracking-tight'>Legal</Text>
                        <View className='bg-gray-50 rounded-2xl p-2'>
                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Terms of Service</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className='p-4 border-b border-gray-200 active:bg-gray-100/50'>
                                <Text className='text-base font-medium text-black'>Privacy Policy</Text>
                            </TouchableOpacity>

                            <View className='p-4'>
                                <Text className='text-base font-medium text-black mb-1'>About Crossed</Text>
                                <Text className='text-sm text-gray-500'>Version 1.0.0 (Build 42)</Text>
                                <Text className='text-sm text-gray-500 mt-1'>
                                    Crossed is a minimalist dating app designed for authentic connections.
                                </Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default Settings;