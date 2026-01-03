import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </Pressable>
                    <Text className="text-xl font-bold">Terms of Service</Text>
                </View>

                <ScrollView className="flex-1 px-6 py-4">
                    <Text className="text-base text-gray-800 mb-4">
                        Last Updated: December 2025
                    </Text>

                    <Text className="font-bold text-lg mb-2">1. Acceptance of Terms</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        By accessing and using Crossed, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
                    </Text>

                    <Text className="font-bold text-lg mb-2">2. Eligibility</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        You must be at least 18 years old to use Crossed. By using the app, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.
                    </Text>

                    <Text className="font-bold text-lg mb-2">3. User Conduct</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        You agree not to post any illegal, abusive, or harmful content. We reserve the right to ban any user who violates these guidelines or harasses other users.
                    </Text>

                    <Text className="font-bold text-lg mb-2">4. Privacy</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your data.
                    </Text>

                    <Text className="font-bold text-lg mb-2">5. Termination</Text>
                    <Text className="text-gray-600 mb-8 leading-5">
                        We reserve the right to terminate or suspend your account at any time, without prior notice or liability, for any reason whatsoever.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
