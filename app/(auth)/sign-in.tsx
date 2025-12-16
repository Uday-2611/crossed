import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignInAnimation } from '../../components/SignInAnimation';
import '../global.css';

const SignIn = () => {
  const router = useRouter();

  const handleSignIn = () => {
    router.replace('/(tabs)/matches');
  };

  return (
    <View className="flex-1">
      <StatusBar style="dark" />

      {/* Fluid Background Animation */}
      <SignInAnimation />

      <SafeAreaView className="flex-1 justify-between">
        <View className="flex-1 px-8 pt-2 justify-end pb-20">
          <View className="mb-14">
            <Text className="text-6xl font-bold tracking-tight text-text-primary mb-2">
              Sign in
            </Text>
            <Text className="text-lg leading-6 text-text-secondary">
              Welcome back. Continue discovering people whose paths cross yours.
            </Text>
          </View>

          {/* Auth Buttons */}
          <View className="space-y-5 flex flex-col gap-2">
            {/* Google */}
            <Pressable
              onPress={handleSignIn}
              className="flex-row items-center justify-center bg-white/90 px-6 py-5 rounded-3xl shadow-md active:bg-white"
            >
              <Ionicons
                name="logo-google"
                size={22}
                color="#1E2A27"
                style={{ marginRight: 12 }}
              />
              <Text className="text-text-primary font-semibold text-lg">
                Continue with Google
              </Text>
            </Pressable>

            {/* Apple */}
            <Pressable
              onPress={handleSignIn}
              className="flex-row items-center justify-center bg-black/80 px-6 py-5 rounded-3xl shadow-md active:bg-black"
            >
              <Ionicons
                name="logo-apple"
                size={22}
                color="#FFFFFF"
                style={{ marginRight: 12 }}
              />
              <Text className="text-white font-semibold text-lg">
                Continue with Apple
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default SignIn;