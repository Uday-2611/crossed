import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import { uploadToCloudinary } from '../../lib/cloudinary';

const PHOTO_SLOTS = [0, 1, 2, 3, 4, 5];

export default function Step3Screen() {
    const router = useRouter();
    const profile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertMyProfile);

    const [photos, setPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile && profile.photos) {
            setPhotos(profile.photos);
        }
    }, [profile]);

    const pickImage = async (index: number) => {
        setIsUploading(true);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need access to your photos to upload.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
                base64: true, // Needed for cloudinary upload likely, or URI
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];

                // Upload to Cloudinary
                // Note: uploadToCloudinary implementation might expect base64 or uri
                // Inspecting previous code: uploadToCloudinary(result.assets[0])
                const imageUrl = await uploadToCloudinary(asset.uri);

                if (imageUrl) {
                    const newPhotos = [...photos];
                    // If adding to a new slot
                    if (index >= newPhotos.length) {
                        newPhotos.push(imageUrl);
                    } else {
                        newPhotos[index] = imageUrl;
                    }
                    // Filter just in case
                    const validPhotos = newPhotos.filter(Boolean);
                    setPhotos(validPhotos);

                    // Auto-persist photos immediately
                    await upsertProfile({
                        name: profile?.name || '',
                        age: profile?.age || 18,
                        photos: validPhotos,
                        // Safety
                        activities: profile?.activities || [],
                    });
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Upload Error', 'Failed to upload photo.');
        } finally {
            setIsUploading(false);
        }
    };

    const removePhoto = async (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        await upsertProfile({
            name: profile?.name || '',
            age: profile?.age || 18,
            photos: newPhotos,
            activities: profile?.activities || [],
        });
    };

    const handleNext = async () => {
        if (photos.length === 0) {
            Alert.alert('Photo Required', 'Please upload at least one photo.');
            return;
        }
        router.push('/(onboarding)/step4');
    };

    return (
        <SafeAreaView className="flex-1 bg-background px-6 py-4">
            <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-secondary text-lg">Back</Text>
                </TouchableOpacity>
                <Text className="text-secondary font-medium uppercase tracking-widest text-xs">Step 3 of 5</Text>
                <View className="w-10" />
            </View>

            <Text className="text-3xl font-bold text-text-primary mb-2">Your Photos</Text>
            <Text className="text-text-secondary text-base mb-6">Add at least one photo to continue.</Text>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap justify-between">
                    {PHOTO_SLOTS.map((slotIndex) => {
                        const photoUrl = photos[slotIndex];
                        return (
                            <TouchableOpacity
                                key={slotIndex}
                                onPress={() => pickImage(slotIndex)}
                                className="w-[48%] aspect-[3/4] mb-4 bg-surface rounded-2xl border border-dashed border-border/50 overflow-hidden items-center justify-center relative"
                                disabled={isUploading}
                            >
                                {photoUrl ? (
                                    <>
                                        <Image source={{ uri: photoUrl }} className="w-full h-full" resizeMode="cover" />
                                        <TouchableOpacity
                                            className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                removePhoto(slotIndex);
                                            }}
                                        >
                                            <Ionicons name="close" size={16} color="white" />
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View className="items-center justify-center">
                                        {isUploading ? (
                                            <ActivityIndicator />
                                        ) : (
                                            <Ionicons name="add" size={40} color="#ccc" />
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <TouchableOpacity
                onPress={handleNext}
                className={`w-full py-4 rounded-full items-center shadow-md mb-4 ${photos.length > 0 ? 'bg-primary' : 'bg-gray-300'
                    }`}
                disabled={photos.length === 0}
            >
                <Text className="text-white text-lg font-bold">Next</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
