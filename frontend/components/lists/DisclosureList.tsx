import dayjs from "@/lib/dayjs";
import { formatCorpName } from "@/lib/utils";
import { DisclosureItem } from "@/types/disclosure";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { apiFetch } from "@/lib/apiFetch";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

type DisclosureListProps = {
  header: boolean;
  data: DisclosureItem[];
  loading: boolean;
  loadingMore?: boolean;
  refreshing?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
};

export default function DisclosureList({
  header,
  data,
  loading,
  loadingMore,
  refreshing,
  onLoadMore,
  onRefresh,
}: DisclosureListProps) {
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [summaryModal, setSummaryModal] = useState<{ rcpNo: string; companyName: string; title: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/bookmarks");
        const items: { receiptNumber: string }[] = await res.json();
        const map: Record<string, boolean> = {};
        items.forEach((item) => {
          map[item.receiptNumber] = true;
        });
        setBookmarked(map);
      } catch {}
    })();
  }, []);

  const toggleBookmark = async (receiptNumber: string) => {
    const isBookmarked = !!bookmarked[receiptNumber];
    setBookmarked((prev) => ({ ...prev, [receiptNumber]: !isBookmarked }));
    try {
      if (isBookmarked) {
        await apiFetch(`/api/bookmarks/${receiptNumber}`, { method: "DELETE" });
      } else {
        await apiFetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiptNumber }),
        });
      }
    } catch {
      setBookmarked((prev) => ({ ...prev, [receiptNumber]: isBookmarked }));
    }
  };

  const openSummary = async (item: DisclosureItem) => {
    setSummaryModal({ rcpNo: item.receiptNumber, companyName: item.companyName, title: item.title });
    setSummary(null);
    setSummaryError(null);
    setSummaryLoading(true);
    try {
      const res = await apiFetch(`/api/disclosures/${item.receiptNumber}/summary`);
      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      setSummaryError(err.message ?? "요약을 불러올 수 없습니다.");
      console.error("Summary error:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#B91C1C" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item.receiptNumber}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 8 }}
        ListHeaderComponent={
          header ? (
            <View className="pl-6 pb-2 bg-surface">
              <Text className="text-lg font-medium text-heading">최근 공시 목록</Text>
            </View>
          ) : (
            <></>
          )
        }
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text className="text-muted">공시가 없습니다.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="p-4">
              <ActivityIndicator size="large" color="#B91C1C" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.receiptNumber}`
              );
            }}
            className="mx-4 mb-4 p-4 border border-border rounded-lg"
          >
            <View className="flex flex-row justify-between items-start mb-2">
              <Text className="font-bold text-heading flex-1 mr-2">
                {formatCorpName(item.companyName)}
              </Text>
              {item.disclosedAt && (
                <Text className="text-muted text-sm">
                  {dayjs(item.disclosedAt).fromNow()}
                </Text>
              )}
            </View>

            {item.title && <Text className="text-body mb-4">{item.title}</Text>}

            <View className="flex-row justify-between items-center">
              {item.market && (
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-12 items-center justify-center rounded-lg py-1 ${
                      item.market === "Y"
                        ? "bg-red-100"
                        : item.market === "K"
                        ? "bg-blue-100"
                        : item.market === "N"
                        ? "bg-purple-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        item.market === "Y"
                          ? "text-red-800"
                          : item.market === "K"
                          ? "text-blue-800"
                          : item.market === "N"
                          ? "text-purple-800"
                          : "text-gray-800"
                      }`}
                    >
                      {item.market === "Y"
                        ? "코스피"
                        : item.market === "K"
                        ? "코스닥"
                        : item.market === "N"
                        ? "코넥스"
                        : "기타"}
                    </Text>
                  </View>
                  {item.correctionType && (
                    <View className="bg-amber-100 rounded-lg px-3 py-1">
                      <Text className="text-xs font-medium text-amber-800">
                        {item.correctionType}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View className="flex-row items-center gap-3 ml-auto">
                {/* AI 요약 버튼 */}
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    openSummary(item);
                  }}
                  className="flex-row items-center gap-1 bg-red-50 px-2 py-1 rounded-lg"
                >
                  <Feather name="zap" size={12} color="#B91C1C" />
                  <Text className="text-xs text-primary font-medium">AI 요약</Text>
                </TouchableOpacity>

                {/* 북마크 */}
                <TouchableOpacity
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleBookmark(item.receiptNumber);
                  }}
                >
                  <FontAwesome
                    name={bookmarked[item.receiptNumber] ? "bookmark" : "bookmark-o"}
                    size={18}
                    color="#B91C1C"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* AI 요약 모달 */}
      <Modal
        visible={!!summaryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSummaryModal(null)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <View className="flex-1 mr-4">
              <Text className="text-lg font-bold text-heading">
                {summaryModal ? formatCorpName(summaryModal.companyName) : ""}
              </Text>
              <Text className="text-sm text-muted mt-0.5" numberOfLines={1}>
                {summaryModal?.title}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSummaryModal(null)} hitSlop={8}>
              <Feather name="x" size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-1 px-4 py-2 bg-red-50 border-b border-red-100">
            <Feather name="zap" size={14} color="#B91C1C" />
            <Text className="text-xs text-primary font-medium">AI 요약 — Claude Sonnet</Text>
          </View>

          {summaryLoading && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#B91C1C" />
              <Text className="text-muted mt-3">공시를 분석하고 있습니다...</Text>
            </View>
          )}

          {summaryError && (
            <View className="flex-1 items-center justify-center px-8">
              <Feather name="file-x" size={40} color="#E5E5E5" />
              <Text className="text-heading font-medium mt-4">요약을 제공할 수 없습니다</Text>
              <Text className="text-muted text-sm mt-2 text-center">
                이 공시는 문서 전문을 지원하지 않아{"\n"}AI 요약이 불가능합니다.
              </Text>
              <TouchableOpacity
                className="mt-5 border border-border rounded-lg px-5 py-3 flex-row items-center gap-2"
                onPress={() =>
                  Linking.openURL(
                    `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${summaryModal?.rcpNo}`
                  )
                }
              >
                <Feather name="external-link" size={14} color="#737373" />
                <Text className="text-muted text-sm">DART에서 직접 보기</Text>
              </TouchableOpacity>
            </View>
          )}

          {summary && (
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
              <Markdown
                style={{
                  heading2: {
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#1A1A1A",
                    marginTop: 20,
                    marginBottom: 6,
                    paddingBottom: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  },
                  body: {
                    fontSize: 14,
                    color: "#404040",
                    lineHeight: 22,
                  },
                  bullet_list: {
                    marginTop: 4,
                  },
                  bullet_list_icon: {
                    color: "#B91C1C",
                    marginTop: 4,
                  },
                  strong: {
                    color: "#1A1A1A",
                    fontWeight: "700",
                  },
                  paragraph: {
                    marginTop: 4,
                    marginBottom: 4,
                  },
                }}
              >
                {summary}
              </Markdown>

              <TouchableOpacity
                className="mt-6 mb-4 border border-border rounded-lg p-3 flex-row items-center justify-center gap-2"
                onPress={() =>
                  Linking.openURL(
                    `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${summaryModal?.rcpNo}`
                  )
                }
              >
                <Feather name="external-link" size={14} color="#737373" />
                <Text className="text-muted text-sm">원문 보기</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}
