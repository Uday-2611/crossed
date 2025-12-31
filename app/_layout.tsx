import { registerForPushNotificationsAsync } from "@/lib/notifications";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { api } from "../convex/_generated/api";
import './global.css';

// Wrap everything in try-catch for better error handling
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log("Error setting notification handler", error);
}

const LOCATION_TASK_NAME = 'background-location-task';

try {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error("Location Task Error:", error);
      return;
    }
    if (data) {
      const { locations } = data as any;
      const loc = locations?.[0];
      if (loc) {
        try {
          const reverse = await Location.reverseGeocodeAsync(loc.coords);
          const place = reverse?.[0];
          if (place && place.name) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `You are at ${place.name}`,
                body: "Do you want to save this place?",
                data: { type: 'location_suggestion', name: place.name, ...loc.coords }
              },
              trigger: null,
            });
          }
        } catch (e) {
          console.log("Reverse Geocode failed", e);
        }
      }
    }
  });
} catch (error) {
  console.log("Error defining location task", error);
}

// Check environment variables
console.log("🔍 Environment Check:");
console.log("CONVEX_URL exists:", !!process.env.EXPO_PUBLIC_CONVEX_URL);
console.log("CLERK_KEY exists:", !!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  console.error("❌ EXPO_PUBLIC_CONVEX_URL is missing!");
}
if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  console.error("❌ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing!");
}

if (Platform.OS !== 'web') {
  try {
    SplashScreen.setOptions({
      duration: 400,
      fade: true
    });
  } catch (e) {
    console.log("Splash Screen Options Error", e);
  }
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("Token retrieval error:", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("Token save error:", err);
      return;
    }
  },
};

const useHelper = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getMyProfile, isAuthenticated ? {} : 'skip');
  const router = useRouter();
  const segments = useSegments();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log("🔄 Navigation State:", {
      isLoading,
      isAuthenticated,
      hasProfile: !!profile,
      currentSegment: segments[0],
      hasNavigated
    });

    if (isLoading) {
      setHasNavigated(false);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated) {
      if (!inAuthGroup && !hasNavigated) {
        console.log("➡️ Navigating to sign-in");
        setHasNavigated(true);
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    // Wait for profile to load
    if (profile === undefined) {
      console.log("⏳ Waiting for profile to load...");
      return;
    }

    const isOnboardingComplete = profile?.isOnboardingComplete ?? false;
    console.log("✅ Profile loaded, onboarding complete:", isOnboardingComplete);

    if (!isOnboardingComplete) {
      if (!inOnboardingGroup && !hasNavigated) {
        console.log("➡️ Navigating to onboarding");
        setHasNavigated(true);
        router.replace('/(onboarding)');
      }
    } else {
      if ((inAuthGroup || inOnboardingGroup) && !hasNavigated) {
        console.log("➡️ Navigating to matches");
        setHasNavigated(true);
        router.replace('/(tabs)/matches');
      }
    }
  }, [isAuthenticated, isLoading, profile, segments, hasNavigated]);
}

const RootLayoutNav = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const savePushToken = useMutation(api.notifications.savePushToken);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useHelper();

  // Push notifications setup
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log("📱 Registering for push notifications...");
    registerForPushNotificationsAsync()
      .then(token => {
        console.log("✅ Push token received:", token?.substring(0, 20) + "...");
        if (token && savePushToken) {
          savePushToken({ token })
            .then(() => console.log("✅ Token saved to Convex"))
            .catch(err => console.error("❌ Error saving token:", err));
        }
      })
      .catch(err => {
        console.error("❌ Push notification registration error:", err);
        // Don't crash the app, just log the error
      });
  }, [isAuthenticated]);

  // Notification response handler
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      } else if (data?.matchId) {
        router.push('/(tabs)/matches');
      }
    });
    return () => subscription.remove();
  }, []);

  // Location setup
  useEffect(() => {
    if (Platform.OS === 'web') return;

    (async () => {
      try {
        console.log("📍 Requesting location permissions...");
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();

        if (fgStatus === 'granted') {
          console.log("✅ Foreground location granted");
          const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

          if (bgStatus === 'granted') {
            console.log("✅ Background location granted");
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.Balanced,
              deferredUpdatesDistance: 500,
              showsBackgroundLocationIndicator: false,
            });
            console.log("✅ Location updates started");
          } else {
            console.log("ℹ️ Background location not granted");
          }
        } else {
          console.log("ℹ️ Foreground location not granted");
        }
      } catch (e) {
        console.log("⚠️ Error starting location updates:", e);
        // Don't crash, just log
      }
    })();
  }, []);

  // Hide splash screen
  useEffect(() => {
    if (!isLoading) {
      console.log("🎬 Hiding splash screen");
      SplashScreen.hideAsync().catch(err =>
        console.log("Splash screen hide error:", err)
      );
    }
  }, [isLoading]);

  // Show error state if something went wrong
  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-xl font-bold text-destructive mb-4">
          App Error
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          {error}
        </Text>
      </View>
    );
  }

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
        <Stack.Screen name="blocked" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
        <Stack.Screen name="report/[userId]" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      {isLoading && (
        <View className="absolute inset-0 bg-background items-center justify-center z-50">
          <ActivityIndicator />
          <Text className="text-muted-foreground mt-4">Loading...</Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  // Validate environment variables before rendering
  if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-xl font-bold text-destructive mb-4">
          Configuration Error
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          EXPO_PUBLIC_CONVEX_URL is missing. Please check your .env file.
        </Text>
      </View>
    );
  }

  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-xl font-bold text-destructive mb-4">
          Configuration Error
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing. Please check your .env file.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RootLayoutNav />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}