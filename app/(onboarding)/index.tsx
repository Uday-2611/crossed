import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <View className="items-center space-y-4">
        <Text className="text-4xl font-bold text-text-primary text-center">
          Welcome to Crossed
        </Text>
        <Text className="text-lg text-text-secondary text-center px-4 leading-6">
          Let’s set up your profile so we can show you people who fit you.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(onboarding)/step1')}
        className="mt-12 bg-primary w-full py-4 rounded-full items-center shadow-sm active:opacity-90"
      >
        <Text className="text-white text-lg font-bold">Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}