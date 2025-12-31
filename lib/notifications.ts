import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    try {
        // Android notification channel setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        // Check if physical device
        if (!Device.isDevice) {
            console.log('⚠️ Must use physical device for Push Notifications');
            return null;
        }

        // Check if running in Expo Go
        const isExpoGo = Constants.executionEnvironment === 'storeClient';
        const appOwnership = Constants.appOwnership;

        if (isExpoGo || appOwnership === 'expo') {
            console.log('⚠️ Push Notifications are not fully supported in Expo Go.');
            console.log('ℹ️ Use a Development Build for full push notification support.');
            console.log('📖 Learn more: https://docs.expo.dev/push-notifications/overview/');
            return null;
        }

        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('⚠️ Push notification permission not granted');
            return null;
        }

        // Get the project ID
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) {
            console.log('⚠️ No EAS project ID found. Push notifications may not work.');
            console.log('ℹ️ Make sure your app.json has the EAS projectId configured.');
        }

        // Get the token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        console.log("✅ Push Token received:", tokenData.data.substring(0, 30) + "...");
        return tokenData.data;

    } catch (error: any) {
        console.error("❌ Error registering for push notifications:", error?.message || error);

        // Provide helpful error messages
        if (error?.message?.includes('projectId')) {
            console.log('💡 Tip: Make sure your app.json includes the EAS projectId');
        } else if (error?.message?.includes('Expo Go')) {
            console.log('💡 Tip: Push notifications require a development build, not Expo Go');
        }
        return null;
    }
}