import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface ProductData {
  title: string;
  weight: string;
  image: string;
  upc: string;
  timestamp: number;
  expirationDate?: number;
  isManualEntry?: boolean;
  base64Image?: string;
}

// Function to get items expiring in the next 3 days
const getExpiringItems = async (): Promise<ProductData[]> => {
  try {
    const storedItems = await AsyncStorage.getItem("scannedItems");
    if (!storedItems) return [];

    const items: ProductData[] = JSON.parse(storedItems);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return items.filter((item) => {
      if (!item.expirationDate) return false;
      const expirationDate = new Date(item.expirationDate);
      return expirationDate >= now && expirationDate <= threeDaysFromNow;
    });
  } catch (error) {
    console.error("Error getting expiring items:", error);
    return [];
  }
};

// Function to return the notification body for the test and live notification
const getNotificationBody = async (expiringItems: ProductData[]) => {
  let body = "";
  if (expiringItems.length === 0) {
    body = "No items expiring in the next 3 days!";
  } else if (expiringItems.length === 1) {
    body = `${expiringItems[0].title} expires in the next 3 days!`;
  } else {
    body = `${expiringItems.length} items expiring in the next 3 days: ${
      expiringItems[0].title
    } and ${expiringItems.length - 1} other${
      expiringItems.length - 1 > 1 ? "s" : ""
    }`;
  }
  return body;
};

// Function to create the daily notification background task
export const createDailyNotificationTask = async (notificationTime?: Date) => {
  try {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Get the notification time (default to 9:00 AM if not provided)
    let time = notificationTime;
    if (!time) {
      const savedTime = await AsyncStorage.getItem("notificationTime");
      if (savedTime) {
        time = new Date(JSON.parse(savedTime));
      } else {
        // Default to 9:00 AM
        time = new Date();
        time.setHours(9, 0, 0, 0);
      }
    }

    // Calculate the next notification time
    const now = new Date();
    const nextNotification = new Date();
    nextNotification.setHours(time.getHours(), time.getMinutes(), 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextNotification <= now) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }

    // Get expiring items
    const expiringItems = await getExpiringItems();

    // Create notification content
    const title = "Pantry Reminder";
    const body = await getNotificationBody(expiringItems);

    // Schedule the notification to repeat daily using daily trigger
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "daily_reminder",
          expiringCount: expiringItems.length,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.getHours(),
        minute: time.getMinutes(),
      },
    });

    console.log(
      `Daily notification scheduled for ${time.getHours()}:${time
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    );
    return true;
  } catch (error) {
    console.error("Error creating daily notification task:", error);
    return false;
  }
};

// Function to reschedule notifications with new time
export const rescheduleNotification = async (newTime?: Date) => {
  try {
    // If newTime is provided, save it to storage
    if (newTime) {
      await AsyncStorage.setItem("notificationTime", JSON.stringify(newTime));
    }

    // Create new daily notification task with the updated time
    const success = await createDailyNotificationTask(newTime);

    if (success) {
      console.log("Notifications rescheduled successfully");
    } else {
      console.error("Failed to reschedule notifications");
    }

    return success;
  } catch (error) {
    console.error("Error rescheduling notifications:", error);
    return false;
  }
};

// Function to request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

// Function to initialize notifications (call this when app starts)
export const initializeNotifications = async () => {
  try {
    // Request permissions
    const hasPermission = await requestNotificationPermissions();

    if (hasPermission) {
      // Create the daily notification task
      await createDailyNotificationTask();
      console.log("Notifications initialized successfully");
    } else {
      console.log("Notification permissions not granted");
    }

    return hasPermission;
  } catch (error) {
    console.error("Error initializing notifications:", error);
    return false;
  }
};

// Function to send a test notification immediately (for testing purposes)
export const sendTestNotification = async () => {
  try {
    const expiringItems = await getExpiringItems();

    const title = "Pantry Reminder";
    const body = await getNotificationBody(expiringItems);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "test_reminder",
          expiringCount: expiringItems.length,
        },
      },
      trigger: null, // Send immediately
    });

    console.log("Test notification sent");
    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return false;
  }
};
