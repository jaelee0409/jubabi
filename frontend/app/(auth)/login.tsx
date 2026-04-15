import KakaoLoginButton from "@/components/buttons/KakaoLoginButton";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

const LoginPage = () => {
  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      {/* Branding */}
      <View className="items-center mb-10">
        <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-4">
          <Feather name="bell" size={32} color="white" />
        </View>
        <Text className="text-3xl font-bold text-heading">주밥이</Text>
        <Text className="text-sm text-muted mt-2 text-center">
          실시간 기업 공시 알림 서비스
        </Text>
      </View>

      {/* Login Card */}
      <View className="w-full border border-border rounded-xl p-6 bg-surface">
        <Text className="text-base font-medium text-heading mb-1">로그인</Text>
        <Text className="text-sm text-muted mb-6">
          계속하려면 계정에 로그인하세요.
        </Text>
        <KakaoLoginButton />
      </View>
    </View>
  );
};

export default LoginPage;
