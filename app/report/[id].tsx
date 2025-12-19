import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const REASONS = [
    'Spam or fake profile',
    'Inappropriate messages',
    'Harassment or hate speech',
    'Scammer',
    'Other'
];

const ReportScreen = () => {
    const router = useRouter();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);

    const handleSubmit = () => {
        // In a real app, send report to backend here
        router.back();
        // Optional: Show a toast or feedback
    };

    return (
        <View className='flex-1 bg-white'>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView className='flex-1'>

                {/* Header */}
                <View className='px-6 py-4 border-b border-gray-100'>
                    <TouchableOpacity onPress={() => router.back()} className='mb-4'>
                        <Ionicons name="close" size={28} color="black" />
                    </TouchableOpacity>
                    <Text className='text-3xl font-bold text-black tracking-tight'>Report user</Text>
                    <Text className='text-base text-gray-500 mt-2'>Why are you reporting this profile?</Text>
                </View>

                <ScrollView className='flex-1 px-6 pt-6'>
                    <View className='gap-3'>
                        {REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                onPress={() => setSelectedReason(reason)}
                                className={`p-5 rounded-2xl border flex-row items-center justify-between ${selectedReason === reason
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
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View className='p-6 border-t border-gray-100 bg-white'>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!selectedReason}
                        className={`w-full py-4 rounded-full items-center ${selectedReason ? 'bg-red-500' : 'bg-gray-100'
                            }`}
                    >
                        <Text className={`text-base font-bold ${selectedReason ? 'text-white' : 'text-gray-400'
                            }`}>
                            Submit Report
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className='mt-4 py-2 items-center'
                    >
                        <Text className='text-base font-medium text-black'>Cancel</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
};

export default ReportScreen;
