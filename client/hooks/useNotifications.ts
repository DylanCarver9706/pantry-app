import { useEffect } from "react";
import { initializeNotifications } from "@/services/NotificationsService";

export function useNotifications() {
  useEffect(() => {
    // Initialize notifications when the app starts
    initializeNotifications();
  }, []);
}
