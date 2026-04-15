import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const SECTIONS = [
  {
    title: "투자 판단에 대한 책임",
    items: [
      "주밥이는 전자공시시스템(DART) 등 외부 기관의 공개 정보를 수집·정리하여 제공하는 정보 서비스입니다.",
      "본 서비스는 특정 금융상품에 대한 매수·매도 권유 또는 투자 자문을 제공하지 않습니다.",
      "제공되는 모든 정보는 참고 자료이며, 투자 판단과 그 결과에 대한 책임은 전적으로 이용자 본인에게 있습니다.",
      "주밥이는 이용자의 투자 손실 또는 기회 손실에 대해 어떠한 책임도 부담하지 않습니다.",
    ],
  },
  {
    title: "정보의 정확성 및 한계",
    items: [
      "제공되는 공시 정보는 외부 데이터 제공처의 사정에 따라 지연, 오류, 누락이 발생할 수 있습니다.",
      "시스템 점검, 서버 장애, 네트워크 문제 등으로 서비스가 일시 중단될 수 있습니다.",
      "주밥이는 정보의 완전성, 정확성, 최신성을 보장하지 않습니다.",
    ],
  },
  {
    title: "알림 서비스 관련",
    items: [
      "알림 기능은 보조 수단이며, 실시간 수신을 보장하지 않습니다.",
      "단말기 설정, OS 정책, 통신 환경에 따라 알림이 지연 또는 누락될 수 있습니다.",
      "알림 미수신으로 발생하는 손해에 대해 주밥이는 책임지지 않습니다.",
    ],
  },
  {
    title: "책임 제한",
    items: [
      "주밥이는 고의 또는 중대한 과실이 없는 한 다음에 대한 책임을 부담하지 않습니다.",
      "서비스 이용 과정에서 발생한 간접 손해",
      "예상 이익 상실",
      "데이터 손실",
      "제3자에 의해 발생한 손해",
    ],
  },
  {
    title: "서비스 변경 및 중단",
    items: [
      "서비스의 일부 또는 전부는 운영 정책에 따라 사전 고지 후 변경 또는 종료될 수 있습니다.",
      "무료 서비스의 중단에 대해 별도의 보상은 제공되지 않습니다.",
    ],
  },
];

const NoticesPage = () => {
  const router = useRouter();

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather size={20} name="chevron-left" color="#1A1A1A" />
        </TouchableOpacity>
        <Feather size={18} name="alert-triangle" color="#1A1A1A" />
        <Text className="text-xl font-bold text-heading">유의사항</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Warning Banner */}
        <View className="flex-row items-start gap-3 mx-4 mt-5 p-4 border border-primary rounded-lg">
          <Feather size={16} name="alert-triangle" color="#B91C1C" style={{ marginTop: 1 }} />
          <Text className="flex-1 text-sm text-body leading-5">
            본 앱은 투자 권유 서비스가 아닙니다. 모든 투자 판단과 책임은
            이용자 본인에게 있습니다.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, sectionIdx) => (
          <View key={sectionIdx} className="mx-4 mt-5">
            {/* Section Title */}
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                <Text className="text-xs font-bold text-white">
                  {sectionIdx + 1}
                </Text>
              </View>
              <Text className="text-sm font-bold text-heading">
                {section.title}
              </Text>
            </View>

            {/* Items */}
            <View className="border border-border rounded-lg overflow-hidden">
              {section.items.map((item, itemIdx) => (
                <View
                  key={itemIdx}
                  className={`flex-row items-start gap-3 px-4 py-3 ${
                    itemIdx < section.items.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <Text className="text-muted text-sm mt-0.5">•</Text>
                  <Text className="flex-1 text-sm text-body leading-5">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default NoticesPage;
