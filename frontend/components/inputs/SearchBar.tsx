import { useDebounce } from "@/hooks/useDebounce";
import { Corporation } from "@/types/corporation";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Props {
  className?: string;
}

const SearchBar = ({ className }: Props) => {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Corporation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 화면에 진입할 때마다 검색어와 결과 초기화 그리고 입력창에 포커스
  useFocusEffect(
    React.useCallback(() => {
      resetSearch(); // 검색 초기화 함수 호출
      inputRef.current?.blur();
    }, [])
  );

  const resetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsActive(false);
  };

  useEffect(() => {
    if (debouncedSearchQuery.length > 0) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    let backPressCount = 0;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isActive || searchQuery.length > 0) {
          if (backPressCount === 0) {
            // 첫 번째 뒤로가기: 키보드 닫기 + 검색 초기화
            inputRef.current?.blur();
            resetSearch();
            backPressCount++;
            setTimeout(() => {
              backPressCount = 0;
            }, 1000); // 1초 후 카운트 리셋
            return true; // 이벤트 소비
          }
          // 두 번째 뒤로가기: 앱 종료 허용
          return false;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isActive, searchQuery]);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setIsActive(query.length > 0);
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      if (!query) {
        setSearchResults([]);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/companies/search?q=${encodeURIComponent(
          query
        )}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  // 언마운트 시 안전하게 취소
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleFocus = () => {
    setIsActive(true);
  };

  const navigateToCorpPage = (corp: Corporation): void => {
    Keyboard.dismiss();

    resetSearch();
    if (!corp.corpCode) return;
    router.navigate(`/corp/${encodeURIComponent(corp.corpCode)}`);
  };

  return (
    <View className={className}>
      <View className="flex-row items-center border border-border rounded-lg bg-white">
        <TouchableOpacity
          onPress={() => {
            if (isActive) {
              resetSearch();
              inputRef.current?.blur(); // 키보드 닫기
            } else {
              inputRef.current?.focus();
            }
          }}
          className="ml-2 justify-center items-center w-8 h-8"
        >
          <Feather
            name={isActive ? "chevron-left" : "search"} // 검색 활성화 시 뒤로가기 아이콘
            size={20}
            color="#737373"
          />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          className="flex-1 text-lg text-body"
          style={{
            minHeight: 40,
            lineHeight: 24,
          }}
          placeholder="회사 이름, 코드 또는 주식 코드로 검색..."
          placeholderTextColor="#737373"
          value={searchQuery}
          onChangeText={handleSearch}
          multiline={false}
          onFocus={handleFocus} // 포커스 시 검색 활성화
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={resetSearch}
            className="mr-3 justify-center items-center w-8 h-8"
          >
            <Feather name="x" size={20} color="#737373" />
          </TouchableOpacity>
        )}
      </View>

      {debouncedSearchQuery.length > 0 && (
        <View className="absolute top-20 left-4 right-4 bg-white border border-border rounded-lg shadow-lg z-20 max-h-[70vh]">
          {/* 로딩 상태 */}
          {isSearching && (
            <View className="p-6 flex-row justify-center items-center">
              <ActivityIndicator size="small" color="#B91C1C" />
              <Text className="ml-2 text-muted">검색 중...</Text>
            </View>
          )}

          {/* 검색 결과 */}
          {!isSearching && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.corpCode}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4"
                  onPress={() => navigateToCorpPage(item)}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-medium text-heading">
                        {item.name}
                      </Text>

                      <Text className="text-muted text-sm mt-1">
                        {item.stockCode
                          ? "종목코드: " + item.stockCode
                          : "비상장"}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#1A1A1A" />
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-border mx-4" />
              )}
            />
          ) : null}

          {/* 결과 없음 상태 */}
          {!isSearching && searchResults.length === 0 && (
            <View className="p-6 items-center justify-center">
              {/* <SearchOff size={32} color="#9ca3af" className="mb-2" /> */}
              <Text className="text-body">
                {debouncedSearchQuery}에 대한 결과가 없습니다
              </Text>
              <Text className="text-muted mt-1">
                다른 검색어를 시도해 보세요
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default SearchBar;
