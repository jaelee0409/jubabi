import { Link, Stack } from "expo-router";
import { View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops! Not Found" }} />
      <View className="flex-1 items-center justify-center">
        <Link href="/" className="text-xl text-red-400 underline">
          뒤로가기
        </Link>
      </View>
    </>
  );
}
