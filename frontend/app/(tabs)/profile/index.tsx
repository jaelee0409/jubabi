import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";

const membershipStyles: Record<
  string,
  { bg: string; text: string; label: string; emoji: string }
> = {
  free: {
    bg: "bg-gray-200",
    text: "text-gray-700",
    label: "무료",
    emoji: "🆓",
  },
  premium: {
    bg: "bg-yellow-300",
    text: "text-yellow-900",
    label: "프리미엄",
    emoji: "👑",
  },
  lifetime: {
    bg: "bg-purple-700",
    text: "text-white",
    label: "평생회원",
    emoji: "✨💎✨",
  },
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="px-4 pt-5 pb-2 text-xs font-semibold text-muted uppercase tracking-wide">
    {title}
  </Text>
);

const MenuItem = ({
  icon,
  title,
  onPress,
  isLast = false,
  destructive = false,
}: {
  icon: string;
  title: string;
  onPress: () => void;
  isLast?: boolean;
  destructive?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center px-5 py-4 ${
      isLast ? "" : "border-b border-border"
    }`}
  >
    <Feather
      name={icon as any}
      size={18}
      color={destructive ? "#B91C1C" : "#B91C1C"}
    />
    <Text className={`ml-3 ${destructive ? "text-primary" : "text-body"}`}>
      {title}
    </Text>
    {!destructive && (
      <Feather
        name="chevron-right"
        size={18}
        color="#737373"
        className="ml-auto"
      />
    )}
  </TouchableOpacity>
);

const ProfilePage = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [membership, setMembership] = useState<string>("free");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/auth/me");
        const data = await res.json();
        setNickname(data.nickname);
        setThumbnailUrl(data.thumbnailUrl);
        setMembership(data.membership);
        setCreatedAt(data.createdAt);
      } catch {}
    })();
  }, []);

  const logout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    router.replace("/(auth)/login");
  };

  const deleteAccount = async () => {
    Alert.alert(
      "회원탈퇴",
      "정말로 회원탈퇴를 진행하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch("/auth/unlink", { method: "DELETE" });
            } catch {}
            await SecureStore.deleteItemAsync("authToken");
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex flex-row items-center p-4 gap-2 justify-center">
        <Text className="text-xl font-medium text-heading">마이페이지</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Section */}
        <View className="bg-surface px-5 py-4 border border-border rounded-lg mx-4">
          <View className="flex-row items-center">
            <Image
              source={{ uri: thumbnailUrl ?? "https://placehold.co/100x100" }}
              className="w-16 h-16 rounded-lg"
            />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-medium text-heading">
                  {nickname ?? "Guest"}
                </Text>
                <View
                  className={`ml-2 px-2 py-1 flex-row items-center rounded-full ${membershipStyles[membership].bg}`}
                >
                  <Text className="mr-1 text-xs">
                    {membershipStyles[membership].emoji}
                  </Text>
                  <Text
                    className={`text-xs font-medium ${membershipStyles[membership].text}`}
                  >
                    {membershipStyles[membership].label}
                  </Text>
                </View>
              </View>
              {createdAt && (
                <Text className="text-sm text-muted mt-1">
                  {createdAt.split("T")[0]}부터 회원
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            className="mt-4 border border-primary p-3 rounded-lg"
            onPress={() => {}}
          >
            <Text className="text-center text-sm font-medium text-primary">
              프로필 수정
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: 내 활동 */}
        <SectionHeader title="내 활동" />
        <View className="bg-surface border border-border rounded-lg mx-4">
          <MenuItem
            icon="bookmark"
            title="저장한 공시들"
            onPress={() => router.navigate("/profile/bookmark")}
          />
          <MenuItem
            icon="settings"
            title="설정"
            onPress={() => router.navigate("/profile/settings")}
            isLast
          />
        </View>

        {/* Section 2: 결제/계정 */}
        <SectionHeader title="결제/계정" />
        <View className="bg-surface border border-border rounded-lg mx-4">
          <MenuItem
            icon="credit-card"
            title="멤버십 관리"
            onPress={() => router.navigate("/profile/membership")}
          />
          <MenuItem
            icon="log-out"
            title="로그아웃"
            onPress={logout}
            destructive
          />
          <MenuItem
            icon="user-x"
            title="회원탈퇴"
            onPress={deleteAccount}
            destructive
            isLast
          />
        </View>

        {/* Section 3: 고객지원 & 법적정보 */}
        <SectionHeader title="고객지원 & 법적정보" />
        <View className="bg-surface border border-border rounded-lg mx-4">
          <MenuItem
            icon="help-circle"
            title="도움말"
            onPress={() => router.navigate("/profile/help")}
          />
          <MenuItem
            icon="phone"
            title="고객센터"
            onPress={() => router.navigate("/profile/support")}
          />
          <MenuItem
            icon="alert-triangle"
            title="유의사항"
            onPress={() => router.navigate("/profile/notices")}
            isLast
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default ProfilePage;
