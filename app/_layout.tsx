import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { api } from "../convex/_generated/api";
import './global.css';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      Alert.alert("Authentication Error", "Could not retrieve session. You have been signed out.");
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const useHelper = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getMyProfile, isAuthenticated ? {} : 'skip');
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
    } else {
      if (profile === undefined) return;

      const isOnboardingComplete = profile?.isOnboardingComplete ?? false;

      if (!isOnboardingComplete) {
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)');
        }
      } else {
        if (inAuthGroup || inOnboardingGroup) {
          router.replace('/(tabs)/matches');
        }
      }
    }
  }, [isAuthenticated, isLoading, profile, segments, router]);
}

const RootLayoutNav = () => {
  const { isLoading } = useConvexAuth();
  useHelper();

  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen
          name="your-places"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom'
          }}
        />
      </Stack>
      {isLoading && (
        <View className="absolute inset-0 bg-background items-center justify-center z-50">
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RootLayoutNav />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}