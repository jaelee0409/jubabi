import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const FAQ = [
  {
    emoji: "🔔",
    question: "공시 알림은 어떻게 받나요?",
    items: [
      "관심 종목을 등록합니다.",
      "해당 종목에 공시가 발생하면 알림이 발송됩니다.",
      "알림 설정은 마이페이지에서 변경할 수 있습니다.",
    ],
  },
  {
    emoji: "⏱",
    question: "공시는 언제 반영되나요?",
    items: [
      "전자공시시스템(DART) 업데이트 이후 자동 수집됩니다.",
      "보통 수 분 이내 반영되지만, 상황에 따라 지연될 수 있습니다.",
    ],
  },
  {
    emoji: "📱",
    question: "알림이 오지 않아요",
    items: [
      "앱 알림 권한이 허용되어 있는지 확인해주세요.",
      "로그아웃 후 재로그인 해보세요.",
      "네트워크 상태를 확인해주세요.",
    ],
  },
  {
    emoji: "🔐",
    question: "로그인 관련",
    items: [
      "카카오/이메일 로그인 중 문제가 발생하면 앱을 완전히 종료 후 재시도해주세요.",
      "동일 계정으로 여러 기기에서 사용 가능합니다.",
    ],
  },
];

const HelpPage = () => {
  const router = useRouter();

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather size={20} name="chevron-left" color="#1A1A1A" />
        </TouchableOpacity>
        <Feather size={18} name="help-circle" color="#1A1A1A" />
        <Text className="text-xl font-bold text-heading">도움말</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="px-4 pt-5 pb-3 text-xs font-medium text-muted">
          자주 묻는 질문
        </Text>

        {FAQ.map((faq, idx) => (
          <View
            key={idx}
            className="mx-4 mb-3 border border-border rounded-lg overflow-hidden"
          >
            {/* Question */}
            <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
              <Text className="text-base">{faq.emoji}</Text>
              <Text className="text-sm font-bold text-heading flex-1">
                {faq.question}
              </Text>
            </View>

            {/* Answers */}
            {faq.items.map((item, itemIdx) => (
              <View
                key={itemIdx}
                className={`flex-row items-start gap-3 px-4 py-3 ${
                  itemIdx < faq.items.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Text className="text-muted text-sm mt-0.5">•</Text>
                <Text className="flex-1 text-sm text-body leading-5">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default HelpPage;
