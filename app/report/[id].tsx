import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';

const REASONS = [
    'Spam or fake profile',
    'Inappropriate messages',
    'Harassment or hate speech',
    'Scammer',
    'Other'
];

const ReportScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportMutation = useMutation(api.matches.report);

    const handleSubmit = async () => {
        if (!selectedReason || !id) return;

        setIsSubmitting(true);
        try {
            await reportMutation({
                targetId: id as Id<"profiles">,
                reason: selectedReason,
            });

            Alert.alert(
                "Report Submitted",
                "Thank you for keeping our community safe. We will review this report shortly.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch {
            Alert.alert("Error", "Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className='flex-1 bg-white'>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className='flex-1'>

                {/* Header */}
                <View className='px-6 py-4 border-b border-gray-100'>
                    <Pressable onPress={() => router.back()} className='mb-4 active:opacity-50'>
                        <Ionicons name="close" size={28} color="black" />
                    </Pressable>
                    <Text className='text-3xl font-bold text-black tracking-tight'>Report user</Text>
                    <Text className='text-base text-gray-500 mt-2'>Why are you reporting this profile?</Text>
                </View>

                <ScrollView className='flex-1 px-6 pt-6'>
                    <View className='gap-3'>
                        {REASONS.map((reason) => (
                            <Pressable
                                key={reason}
                                onPress={() => setSelectedReason(reason)}
                                className={`p-5 rounded-2xl border flex-row items-center justify-between active:scale-[0.98] ${selectedReason === reason
                                    ? 'bg-black border-black'
                                    : 'bg-gray-50 border-transparent'
                                    }`}
                            >
                                <Text className={`text-base font-medium ${selectedReason === reason ? 'text-white' : 'text-black'
                                    }`}>
                                    {reason}
                                </Text>
                                {selectedReason === reason && (
                                    <Ionicons name="checkmark-circle" size={24} color="white" />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View className='p-6 border-t border-gray-100 bg-white'>
                    <Pressable
                        onPress={handleSubmit}
                        disabled={!selectedReason || isSubmitting}
                        className={`w-full py-4 rounded-full items-center flex-row justify-center gap-2 active:opacity-80 ${selectedReason ? 'bg-red-500' : 'bg-gray-100'
                            }`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={selectedReason ? "white" : "gray"} />
                        ) : (
                            <Text className={`text-base font-bold ${selectedReason ? 'text-white' : 'text-gray-400'
                                }`}>
                                Submit Report
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={() => router.back()}
                        className='mt-4 py-2 items-center active:opacity-50'
                        disabled={isSubmitting}
                    >
                        <Text className='text-base font-medium text-black'>Cancel</Text>
                    </Pressable>
                </View>

            </SafeAreaView>
        </View>
    );
};

export default ReportScreen;
