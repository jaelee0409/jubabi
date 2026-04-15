import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const SettingsPage = () => {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather size={20} name="chevron-left" color="#1A1A1A" />
        </TouchableOpacity>
        <Feather size={18} name="settings" color="#1A1A1A" />
        <Text className="text-xl font-bold text-heading">설정</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <Feather size={32} name="settings" color="#E5E5E5" />
        <Text className="text-muted mt-3">준비 중입니다.</Text>
      </View>
    </ScreenWrapper>
  );
};

export default SettingsPage;
