import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

export const LOCATION_GEOFENCE_TASK = 'LOCATION_GEOFENCE_TASK';

// Define the shape of the data manually since it's not exported
type GeofencingTaskData = {
    eventType: Location.GeofencingEventType;
    region?: Location.LocationRegion;
};

// Define the task that runs when a geofence is entered
TaskManager.defineTask(LOCATION_GEOFENCE_TASK, async ({ data, error }: { data: GeofencingTaskData, error: any }) => {
    if (error) {
        console.error("Geofencing task error:", error);
        return;
    }

    if (data.eventType === Location.GeofencingEventType.Enter) {
        if (!data.region) {
            console.error("Geofencing event missing region data");
            return;
        }
        const { region } = data;
        console.log("📍 Entered region:", region.identifier);

        const placeName = region.identifier;

        // Check notification permissions before scheduling
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            console.warn("Notification permissions not granted");
            return;
        }

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
