import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchUnreadNotificationsCount } from "@/lib/myApi";

interface NotificationContextType {
  notification: Notifications.Notification | null;
  error: Error | null;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const router = useRouter();

  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const lastHandledIdRef = useRef<string | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await fetchUnreadNotificationsCount();
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {}
  }, []);

  const handleResponse = (response: Notifications.NotificationResponse) => {
    const id = response.notification.request.identifier;
    if (lastHandledIdRef.current === id) return;
    lastHandledIdRef.current = id;

    const data = response.notification.request.content.data as any;
    const receiptNumber: string | undefined = data?.receiptNumber;

    if (typeof receiptNumber === "string") {
      router.navigate({
        pathname: "/dart/[rcept_no]",
        params: { rcept_no: receiptNumber },
      });
    }
  };

  useEffect(() => {
    refreshUnreadCount();

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        refreshUnreadCount();
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleResponse(response);
      });

    (async () => {
      try {
        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          handleResponse(lastResponse);
        }
      } catch (e) {
        setError(e as Error);
      }
    })();

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notification, error, unreadCount, refreshUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
