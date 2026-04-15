import { Alert, Linking, Text, TouchableOpacity } from "react-native";

export default function KakaoLoginButton() {
  const onPress = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
      const kakaoLoginUrl = `${backendUrl}/auth/kakao`;

      await Linking.openURL(kakaoLoginUrl);
    } catch (e: any) {
      console.log("[AUTH] ERROR =", e);
      Alert.alert("오류", e?.message ?? String(e));
    }
  };

  return (
    <TouchableOpacity
      className="bg-[#FEE500] p-4 rounded-lg min-w-36 justify-center items-center"
      onPress={onPress}
    >
      <Text className="font-bold">카카오 로그인</Text>
    </TouchableOpacity>
  );
}
