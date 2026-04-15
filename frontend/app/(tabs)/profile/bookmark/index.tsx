import ScreenWrapper from "@/components/layout/ScreenWrapper";
import DisclosureList from "@/components/lists/DisclosureList";
import { DisclosureItem } from "@/types/disclosure";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { apiFetch } from "@/lib/apiFetch";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const BookmarkPage = () => {
  const router = useRouter();
  const [data, setData] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function fetchBookmarks() {
        setLoading(true);
        const res = await apiFetch("/api/bookmarks");
        if (res.ok) {
          setData(await res.json());
        }
        setLoading(false);
      }
      fetchBookmarks();
    }, [])
  );

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather size={20} name="chevron-left" color="#1A1A1A" />
        </TouchableOpacity>
        <Feather size={18} name="bookmark" color="#1A1A1A" />
        <Text className="text-xl font-bold text-heading">저장한 공시들</Text>
      </View>

      {!loading && data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Feather size={32} name="bookmark" color="#E5E5E5" />
          <Text className="text-muted mt-3">저장한 공시가 없습니다.</Text>
        </View>
      ) : (
        <DisclosureList header={false} data={data} loading={loading} />
      )}
    </ScreenWrapper>
  );
};

export default BookmarkPage;
