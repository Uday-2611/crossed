import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView className="flex-1" edges={['top']}>
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
                        We collect information you provide directly to us, such as your name, photos, birthdate, bio, gender, and interests. We also automatically collect location data (GPS coordinates) to power our core &quot;cross paths&quot; matching feature, as well as devise information (IP address, device ID).
                    </Text>

                    <Text className="font-bold text-lg mb-2">2. How We Use Your Information</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We use your data to:
                        {'\n'}• Provide and improve the Service (matching, chat).
                        {'\n'}• Personalize your experience.
                        {'\n'}• Send you notifications (matches, messages).
                        {'\n'}• Monitor and analyze trends and usage.
                        {'\n'}• Detect and prevent fraud or abuse.
                    </Text>

                    <Text className="font-bold text-lg mb-2">3. Data Sharing & Third Parties</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We do not sell your personal data. We may share data with:
                        {'\n'}• **Service Providers**: Hosting (Convex), Authentication (Clerk), and Analytics services that assist in operating our app.
                        {'\n'}• **Legal Authorities**: If required by law or to protect rights and safety.
                        {'\n'}• **Other Users**: Your public profile (photos, name, age, bio) is visible to other users.
                    </Text>

                    <Text className="font-bold text-lg mb-2">4. Your Rights (GDPR & CCPA)</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        Depending on your location, you have the right to:
                        {'\n'}• **Access**: Request a copy of your data.
                        {'\n'}• **Correction**: Update inaccurate data via &quot;Edit Profile&quot;.
                        {'\n'}• **Deletion**: Delete your account and data directly within the app settings.
                        {'\n'}• **Opt-Out**: Disable location usage in device settings or turn off Push Notifications.
                    </Text>

                    <Text className="font-bold text-lg mb-2">5. Data Retention</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We retain your personal information only as long as your account is active or needed to provide the Service. If you delete your account, your profile and messages are removed from our active databases immediately, though backups may persist for a short period (up to 30 days) before permanent deletion.
                    </Text>

                    <Text className="font-bold text-lg mb-2">6. Children&apos;s Privacy</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        Our Service is restricted to users who are 18 years of age or older. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that a child under 18 has provided us with personal data, we will take steps to delete such information.
                    </Text>

                    <Text className="font-bold text-lg mb-2">7. International Transfers</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ (primarily the United States).
                    </Text>

                    <Text className="font-bold text-lg mb-2">8. Cookies & Tracking</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We use standard tracking technologies (like local storage and secure tokens) to maintain your authenticated session and preferences. We do not use third-party advertising cookies.
                    </Text>

                    <Text className="font-bold text-lg mb-2">9. Changes to This Policy</Text>
                    <Text className="text-gray-600 mb-4 leading-5">
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
                    </Text>

                    <Text className="font-bold text-lg mb-2">10. Contact Us</Text>
                    <Text className="text-gray-600 mb-8 leading-5">
                        If you have any questions about this Privacy Policy, please contact us at support@crossed.app.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
