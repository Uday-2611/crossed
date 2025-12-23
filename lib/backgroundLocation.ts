import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

export const LOCATION_GEOFENCE_TASK = 'LOCATION_GEOFENCE_TASK';

// Define the task that runs when a geofence is entered
TaskManager.defineTask(LOCATION_GEOFENCE_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error("Geofencing task error:", error);
        return;
    }

    if (data.eventType === Location.GeofencingEventType.Enter) {
        const { region } = data;
        console.log("📍 Entered region:", region.identifier);

        // We use the identifier to pass the place Name. 
        // In real app, might pass ID and fetch details, but Name is faster for notification.
        const placeName = region.identifier;

        // Schedule a local notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Discover Nearby 📍",
                body: `You are near ${placeName}. Tap to save this memory!`,
                data: { placeName: placeName },
            },
            trigger: null, // Immediate
        });
    }
});
