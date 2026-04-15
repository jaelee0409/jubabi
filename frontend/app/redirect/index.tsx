import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { registerForPushNotificationsAsync } from "@/lib/registerForPushNotificationsAsync";

export default function Redirect() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();

  useEffect(() => {
    const register = async () => {
      if (!token) return;

      // 1. JWT 저장
      await SecureStore.setItemAsync("authToken", token);

      // 2. 푸시 토큰 등록
      try {
        await registerForPushNotificationsAsync();
      } catch {}

      // 3. 홈으로 이동
      router.replace("/(tabs)/search");
    };

    register();
  }, [token]);

  return (
    <View className="flex-1 justify-center align-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
