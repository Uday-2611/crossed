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
import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import { api } from "../convex/_generated/api";
import './global.css';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    return;
  }
  if (data) {
    const { locations } = data as any;
    const loc = locations?.[0];
    if (loc) {
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
    }
  }
});

if (Platform.OS !== 'web') {
  SplashScreen.setOptions({
    duration: 400,
    fade: true
  });
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      Alert.alert("Error", "Token save error");
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
    if (isLoading) {
      setHasNavigated(false);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated) {
      if (!inAuthGroup && !hasNavigated) {
        setHasNavigated(true);
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (profile === undefined) {
      return;
    }

    const isOnboardingComplete = profile?.isOnboardingComplete ?? false;

    if (!isOnboardingComplete) {
      if (!inOnboardingGroup && !hasNavigated) {
        setHasNavigated(true);
        router.replace('/(onboarding)');
      }
    } else {
      if ((inAuthGroup || inOnboardingGroup) && !hasNavigated) {
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

  useHelper();

  // Push notifications setup
  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotificationsAsync()
      .then(token => {
        if (token && savePushToken) {
          savePushToken({ token })
            .then(() => { })
            .catch(err => { });
        }
      })
      .catch(err => { });
  }, [isAuthenticated]);

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

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let isSubscribed = true;

    (async () => {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();

        if (fgStatus === 'granted') {
          const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

          if (bgStatus === 'granted' && isSubscribed) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.Balanced,
              deferredUpdatesDistance: 500,
              showsBackgroundLocationIndicator: true,
            });
          } else {
            // Permission denied
          }
        } else {
          // Permission denied
        }
      } catch (e) {
        // Ignored
      }
    })();

    return () => {
      isSubscribed = false;
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => { });
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(err => { });
    }
  }, [isLoading]);

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