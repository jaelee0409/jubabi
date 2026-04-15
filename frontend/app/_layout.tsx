import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Stack, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NotificationProvider } from "../context/NotificationContext";
import "./global.css";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    //shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.setOptions({
  duration: 100,
  fade: true,
});

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn && pathname !== "/login") {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaProvider>
      <NotificationProvider>
        <SafeAreaView
          className="flex-1 bg-black"
          edges={["top", "left", "right"]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaView>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}
