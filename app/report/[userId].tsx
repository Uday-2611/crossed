import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const REPORT_REASONS = [
    "Inappropriate Messages",
    "Fake Profile",
    "Harassment",
    "Scam or Spam",
    "Underage",
    "Other"
];

export default function ReportUserScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId as Id<"profiles">;

    const reportMutation = useMutation(api.matches.report);

    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert("Error", "Please select a reason for reporting.");
            return;
        }

        setIsSubmitting(true);
        try {
            await reportMutation({
                targetId: userId,
                reason: selectedReason,
                description: description.trim()
            });

            Alert.alert("Report Sent", "Thank you for letting us know. We will review this report.", [
                { text: "OK", onPress: () => router.replace('/(tabs)/chats') }
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="close" size={28} color="black" />
                    </Pressable>
                    <Text className="text-xl font-bold">Report User</Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView className="flex-1 px-6 py-4">
                        <Text className="text-gray-500 mb-6 text-base">
                            We take safety seriously. Please tell us why you are reporting this user.
                            This report is confidential.
                        </Text>

                        <Text className="font-bold text-lg mb-4">Reason</Text>
                        <View className="gap-3 mb-8">
                            {REPORT_REASONS.map((reason) => (
                                <Pressable
                                    key={reason}
                                    onPress={() => setSelectedReason(reason)}
                                    className={`p-4 rounded-xl border ${selectedReason === reason ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <Text className={`font-medium ${selectedReason === reason ? 'text-red-700' : 'text-gray-700'}`}>
                                            {reason}
                                        </Text>
                                        {selectedReason === reason && (
                                            <Ionicons name="checkmark-circle" size={20} color="#EF4444" />
                                        )}
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        <Text className="font-bold text-lg mb-4">Description (Optional)</Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-32 text-base"
                            placeholder="Provide more details..."
                            multiline
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </ScrollView>

                    <View className="p-6 border-t border-gray-100 pb-10">
                        <Pressable
                            onPress={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                            className={`w-full py-4 rounded-full items-center ${!selectedReason || isSubmitting ? 'bg-gray-200' : 'bg-red-500'}`}
                        >
                            <Text className={`font-bold text-lg ${!selectedReason || isSubmitting ? 'text-gray-400' : 'text-white'}`}>
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
