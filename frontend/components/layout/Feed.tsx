import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import DisclosureList from "../lists/DisclosureList";
import FeedFilter from "./FeedFilter";
import { DisclosureItem } from "@/types/disclosure";

const LIMIT = 20;

const Feed = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [disclosureList, setDisclosureList] = useState<DisclosureItem[]>([]);
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("ALL");
  const refreshKeyRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const categoryParam =
          category !== "ALL" ? `&category=${encodeURIComponent(category)}` : "";
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/disclosures/recent?limit=${LIMIT}&offset=${
            page * LIMIT
          }${categoryParam}`
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const list: DisclosureItem[] = data.map((d: any) => ({
          receiptNumber: d.receiptNumber,
          title: d.title,
          companyName: d.companyName,
          companyCorpCode: d.companyCorpCode,
          disclosedAt: d.disclosedAt,
          market: d.market,
          category: d.category,
          type: d.type,
          correctionType: d.correctionType,
        }));

        if (page === 0) {
          setDisclosureList(list);
        } else {
          setDisclosureList((prev) => {
            const combined = [...prev, ...list];
            return Array.from(
              new Map(combined.map((d) => [d.receiptNumber, d])).values()
            );
          });
        }
      } catch (err: any) {
        console.error("API fetch error:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    };

    doFetch();
    return () => {
      cancelled = true;
    };
  }, [page, category, refreshKeyRef.current]);

  const onCategoryChange = (id: string) => {
    setCategory(id);
    setDisclosureList([]);
    setPage(0);
    refreshKeyRef.current += 1;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setDisclosureList([]);
    setPage(0);
    refreshKeyRef.current += 1;
  };

  const onLoadMore = () => {
    if (!loadingMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <View className="flex-1">
      <FeedFilter className="pb-4" onChange={onCategoryChange} />
      <View className="border-b border-border" />
      <DisclosureList
        header={true}
        data={disclosureList}
        loading={loading}
        loadingMore={loadingMore}
        refreshing={refreshing}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
      />
    </View>
  );
};

export default Feed;
