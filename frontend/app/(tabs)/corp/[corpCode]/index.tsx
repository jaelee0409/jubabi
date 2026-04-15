import DisclosureList from "@/components/lists/DisclosureList";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { fetchCompanyDisclosures, findCorpByCorpCode } from "@/lib/myApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import FeedFilter from "@/components/layout/FeedFilter";

const CorpPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ corpCode: string }>();
  const [favorite, setFavorite] = useState(false);

  const corpCode = Array.isArray(params.corpCode)
    ? params.corpCode[0]
    : params.corpCode;

  const [corp, setCorp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disclosureList, setDisclosureList] = useState<any[]>([]);

  const toggleFavorite = async () => {
    try {
      if (favorite) {
        await apiFetch(`/api/favorites/${corpCode}`, { method: "DELETE" });
        setFavorite(false);
      } else {
        await apiFetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corpCode }),
        });
        setFavorite(true);
      }
    } catch (err: any) {
      alert(err.message ?? "오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!corpCode) return;

    setLoading(true);
    setDisclosureList([]);
    setCorp(null);
    setFavorite(false);

    (async () => {
      try {
        const [corpRes, disclosures] = await Promise.all([
          findCorpByCorpCode(corpCode),
          fetchCompanyDisclosures(corpCode),
        ]);
        setCorp(corpRes);
        setDisclosureList(disclosures ?? []);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error("로드 실패:", e);
          setDisclosureList([]);
          setCorp(null);
        }
      } finally {
        setLoading(false);
      }
    })();

    // Check if already favorited
    (async () => {
      try {
        const res = await apiFetch("/api/favorites");
        const data = await res.json();
        setFavorite(data.some((f: any) => f.companyCorpCode === corpCode));
      } catch {}
    })();
  }, [corpCode]);

  if (!corpCode) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <Text>잘못된 접근입니다 (corpCode 누락)</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!corp && loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-2">회사 정보를 불러오는 중…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!corp && !loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <Text>회사 정보를 찾을 수 없습니다</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1">
        {corp && (
          <View className="flex flex-row justify-between items-center p-4">
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Feather name="arrow-left" size={20} color="#1A1A1A" />
            </TouchableOpacity>
            <Text className="text-xl font-medium text-heading">
              {corp.name}
            </Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <FontAwesome
                name={favorite ? "star" : "star-o"}
                size={20}
                color={favorite ? "#B91C1C" : "#737373"}
              />
            </TouchableOpacity>
          </View>
        )}

        <FeedFilter className="mb-2" />

        {/* 공시 리스트 */}
        <DisclosureList
          header={false}
          data={disclosureList}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
};

export default CorpPage;
