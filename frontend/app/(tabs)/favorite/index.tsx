import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { apiFetch } from "@/lib/apiFetch";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FavoritePage = () => {
  const router = useRouter();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingCorpCode, setAddingCorpCode] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFavorites = async () => {
    try {
      const res = await apiFetch("/api/favorites");
      setFavorites(await res.json());
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  // Debounced search
  useEffect(() => {
    if (!modalVisible) return;
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/companies/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) setSearchResults(await res.json());
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, modalVisible]);

  const openModal = () => {
    setQuery("");
    setSearchResults([]);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setQuery("");
    setSearchResults([]);
  };

  const addFavorite = async (corpCode: string) => {
    setAddingCorpCode(corpCode);
    try {
      const res = await apiFetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpCode }),
      });

      if (res.ok) {
        const added = await res.json();
        setFavorites((prev) => [...prev, added]);
      } else {
        const err = await res.json();
        alert(err.error ?? "추가에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setAddingCorpCode(null);
    }
  };

  const favoritedCorpCodes = new Set(favorites.map((f) => f.companyCorpCode));

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex flex-row justify-between items-center px-5 py-4 border-b border-border">
      {/* 삭제 버튼 */}
      <TouchableOpacity
        onPress={async () => {
          try {
            await apiFetch(`/api/favorites/${item.companyCorpCode}`, { method: "DELETE" });
            setFavorites((prev) =>
              prev.filter((f) => f.companyCorpCode !== item.companyCorpCode)
            );
          } catch {}
        }}
      >
        <Feather size={18} name="x" color="#B91C1C" />
      </TouchableOpacity>

      {/* 회사명 + 이동 */}
      <TouchableOpacity
        className="flex-1 ml-3 flex-row items-center justify-between"
        onPress={() => {
          router.navigate({
            pathname: "/corp/[corpCode]",
            params: { corpCode: item.companyCorpCode },
          });
        }}
      >
        <Text className="text-body">{item.companyName}</Text>
        <Feather name="chevron-right" size={18} color="#737373" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B91C1C" />
          <Text className="text-muted mt-2">불러오는 중...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 bg-surface">
        {/* Header */}
        <View className="flex flex-row items-center justify-center px-4 pt-4">
          <Text className="text-xl font-medium text-heading">관심종목</Text>
        </View>

        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          className="flex-1 m-4"
          contentContainerStyle={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 8,
          }}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center border-b border-border">
              <Feather name="star" size={36} color="#E5E5E5" />
              <Text className="text-muted mt-3">관심 종목이 없습니다.</Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-6 py-3 rounded-lg"
                onPress={openModal}
              >
                <Text className="text-white font-medium">첫 종목 추가하기</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={() => (
            <TouchableOpacity
              className="flex flex-row items-center px-5 py-4"
              onPress={openModal}
            >
              <Feather name="plus" size={18} color="#404040" />
              <Text className="ml-3 text-body">종목 추가</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Add Stock Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-lg font-bold text-heading">종목 추가</Text>
            <TouchableOpacity onPress={closeModal} hitSlop={8}>
              <Feather name="x" size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="mx-4 mt-4 flex-row items-center border border-border rounded-lg px-3 bg-surface">
            <Feather name="search" size={16} color="#737373" />
            <TextInput
              className="flex-1 ml-2 py-3 text-body"
              placeholder="회사명 또는 종목코드 검색"
              placeholderTextColor="#737373"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={16} color="#737373" />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          {searching ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#B91C1C" />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.corpCode}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 8 }}
              ListEmptyComponent={
                query.trim().length > 0 ? (
                  <View className="p-8 items-center">
                    <Text className="text-muted">검색 결과가 없습니다.</Text>
                  </View>
                ) : (
                  <View className="p-8 items-center">
                    <Feather name="search" size={32} color="#E5E5E5" />
                    <Text className="text-muted mt-3">종목명을 입력하세요.</Text>
                  </View>
                )
              }
              renderItem={({ item }) => {
                const alreadyAdded = favoritedCorpCodes.has(item.corpCode);
                const isAdding = addingCorpCode === item.corpCode;
                return (
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
                    <View className="flex-1">
                      <Text className="text-body font-medium">{item.name}</Text>
                      {item.stockCode && (
                        <Text className="text-xs text-muted mt-0.5">
                          {item.stockCode}
                          {item.market ? ` · ${item.market}` : ""}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => !alreadyAdded && addFavorite(item.corpCode)}
                      disabled={alreadyAdded || isAdding}
                      className={`ml-3 px-3 py-1.5 rounded-lg ${
                        alreadyAdded ? "bg-gray-100" : "bg-primary"
                      }`}
                    >
                      {isAdding ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text
                          className={`text-sm font-medium ${
                            alreadyAdded ? "text-muted" : "text-white"
                          }`}
                        >
                          {alreadyAdded ? "추가됨" : "추가"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default FavoritePage;
