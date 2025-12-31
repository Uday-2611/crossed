import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </Pressable>
                    <Text className="text-xl font-bold">Privacy Policy</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-4">
                    <Text className="text-base text-gray-800 mb-4">
                        Last Updated: December 2025
                    </Text>

                    <Text className="font-bold text-lg mb-2">1. Information We Collect</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We collect information you provide directly to us, such as your name, photos, birthdate, and bio. We also collect location data to show you potential matches nearby.
                    </Text>

                    <Text className="font-bold text-lg mb-2">2. How We Use Your Information</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We use your information to provide, maintain, and improve our services, including matching you with other users and facilitating communication.
                    </Text>

                    <Text className="font-bold text-lg mb-2">3. Location Data</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        Your location is used to identify when you cross paths with other users. You can disable location tracking at any time in your device settings, but this will limit app functionality.
                    </Text>

                    <Text className="font-bold text-lg mb-2">4. Data Security</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access.
                    </Text>

                    <Text className="font-bold text-lg mb-2">5. Contact Us</Text>
                    <Text className="text-gray-600 mb-8 leading-5">
                        If you have any questions about this Privacy Policy, please contact us at support@crossed.app.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
