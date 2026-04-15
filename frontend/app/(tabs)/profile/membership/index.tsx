import ScreenWrapper from "@/components/layout/ScreenWrapper";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/lib/apiFetch";
import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
  type PurchaseError,
  type Product,
} from "react-native-iap";

type PlanKey = "free" | "premium" | "lifetime";

interface Plan {
  key: PlanKey;
  name: string;
  emoji: string;
  price: string;
  period: string;
  features: string[];
  productId: string | null;
  upgradeCta: string;
  downgradeCta: string;
}

const PLANS: Plan[] = [
  {
    key: "free",
    name: "무료",
    emoji: "🆓",
    price: "₩0",
    period: "/매달",
    features: ["관심 종목 5개", "키워드 알림 2개", "실시간 공시 알림"],
    productId: null,
    upgradeCta: "",
    downgradeCta: "무료로 다운그레이드",
  },
  {
    key: "premium",
    name: "프리미엄",
    emoji: "👑",
    price: "₩19,800",
    period: "/매달",
    features: [
      "관심 종목 30개",
      "키워드 알림 10개",
      "실시간 공시 알림",
      "공시 카테고리 필터",
      "AI 공시 요약",
    ],
    productId: "com.jubabi.premium.monthly",
    upgradeCta: "프리미엄 업그레이드",
    downgradeCta: "프리미엄으로 다운그레이드",
  },
  {
    key: "lifetime",
    name: "평생회원",
    emoji: "✨💎✨",
    price: "₩592,000",
    period: "/일시불",
    features: [
      "관심 종목 무제한",
      "키워드 알림 무제한",
      "실시간 공시 알림",
      "공시 카테고리 필터",
      "AI 공시 요약",
      "우선 고객 지원",
    ],
    productId: "com.jubabi.lifetime",
    upgradeCta: "평생회원 구매하기",
    downgradeCta: "",
  },
];

const PLAN_ORDER: PlanKey[] = ["free", "premium", "lifetime"];

const membershipBadge: Record<PlanKey, { bg: string; text: string }> = {
  free: { bg: "bg-gray-100", text: "text-gray-600" },
  premium: { bg: "bg-yellow-100", text: "text-yellow-800" },
  lifetime: { bg: "bg-purple-100", text: "text-purple-800" },
};

const MembershipPage = () => {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [storeProducts, setStoreProducts] = useState<Record<string, Product>>({});

  // Load current membership
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/auth/me");
        const data = await res.json();
        if (data.membership) setCurrentPlan(data.membership as PlanKey);
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Initialize IAP
  useEffect(() => {
    if (Platform.OS !== "android") return;

    let purchaseUpdateSub: ReturnType<typeof purchaseUpdatedListener>;
    let purchaseErrorSub: ReturnType<typeof purchaseErrorListener>;

    const setup = async () => {
      try {
        await initConnection();

        const productIds = PLANS.filter((p) => p.productId).map((p) => p.productId!);
        const products = await getProducts({ skus: productIds });
        const productMap: Record<string, Product> = {};
        products.forEach((p) => { productMap[p.productId] = p; });
        setStoreProducts(productMap);

        purchaseUpdateSub = purchaseUpdatedListener(async (purchase: ProductPurchase) => {
          const { productId, purchaseToken } = purchase;
          if (!purchaseToken) return;

          try {
            // Verify with backend and upgrade membership
            const res = await apiFetch("/auth/verify-purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId, purchaseToken }),
            });
            const data = await res.json();
            if (data.membership) {
              setCurrentPlan(data.membership as PlanKey);
            }
            await finishTransaction({ purchase, isConsumable: false });
            Alert.alert("구매 완료", "멤버십이 업그레이드되었습니다! 🎉");
          } catch (err: any) {
            Alert.alert("오류", err.message ?? "구매 처리 중 오류가 발생했습니다.");
          } finally {
            setPurchasing(null);
          }
        });

        purchaseErrorSub = purchaseErrorListener((error: PurchaseError) => {
          if (error.code !== "E_USER_CANCELLED") {
            Alert.alert("구매 오류", error.message ?? "구매 중 오류가 발생했습니다.");
          }
          setPurchasing(null);
        });
      } catch (err) {
        console.error("IAP setup error:", err);
      }
    };

    setup();

    return () => {
      purchaseUpdateSub?.remove();
      purchaseErrorSub?.remove();
    };
  }, []);

  const handlePurchase = useCallback(async (plan: Plan) => {
    if (!plan.productId) return;
    if (Platform.OS !== "android") {
      Alert.alert("안내", "현재 Android에서만 구매 가능합니다.");
      return;
    }

    setPurchasing(plan.productId);
    try {
      await requestPurchase({ skus: [plan.productId] });
      // result is handled in purchaseUpdatedListener
    } catch (err: any) {
      if (err.code !== "E_USER_CANCELLED") {
        Alert.alert("오류", err.message ?? "구매 요청 중 오류가 발생했습니다.");
      }
      setPurchasing(null);
    }
  }, []);

  const handleRestore = useCallback(async () => {
    if (Platform.OS !== "android") {
      Alert.alert("안내", "현재 Android에서만 복원 가능합니다.");
      return;
    }
    setRestoring(true);
    try {
      const purchases = await getAvailablePurchases();
      // Find the highest-tier purchase
      const productIds = purchases.map((p) => p.productId);
      let restored: PlanKey | null = null;
      if (productIds.includes("com.jubabi.lifetime")) restored = "lifetime";
      else if (productIds.includes("com.jubabi.premium.monthly")) restored = "premium";

      if (!restored) {
        Alert.alert("복원 완료", "복원할 구매 내역이 없습니다.");
        return;
      }

      // Verify each purchase with backend
      for (const purchase of purchases) {
        if (!purchase.purchaseToken) continue;
        try {
          await apiFetch("/auth/verify-purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken,
            }),
          });
        } catch {}
      }

      setCurrentPlan(restored);
      Alert.alert("복원 완료", `${restored === "lifetime" ? "평생회원" : "프리미엄"} 멤버십이 복원되었습니다.`);
    } catch (err: any) {
      Alert.alert("오류", err.message ?? "구매 복원 중 오류가 발생했습니다.");
    } finally {
      setRestoring(false);
    }
  }, []);

  const getPlanCta = (plan: Plan): { label: string; isUpgrade: boolean } | null => {
    const planIdx = PLAN_ORDER.indexOf(plan.key);
    const currentIdx = PLAN_ORDER.indexOf(currentPlan);
    if (planIdx > currentIdx) return { label: plan.upgradeCta, isUpgrade: true };
    if (planIdx < currentIdx && plan.downgradeCta)
      return { label: plan.downgradeCta, isUpgrade: false };
    return null;
  };

  const currentPlanData = PLANS.find((p) => p.key === currentPlan)!;
  const badge = membershipBadge[currentPlan];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather size={20} name="chevron-left" color="#1A1A1A" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-heading">멤버십 관리</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B91C1C" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Current Plan Card ── */}
          <View className="mx-4 mt-5 mb-2 p-4 bg-surface border border-border rounded-lg">
            <Text className="text-xs font-medium text-muted mb-3">
              현재 플랜
            </Text>

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-heading">
                  {currentPlanData.name}
                </Text>
              </View>
              <View
                className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${badge.bg}`}
              >
                <Text className="text-xs">{currentPlanData.emoji}</Text>
                <Text className={`text-xs font-medium ${badge.text}`}>
                  {currentPlanData.name}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Available Plans ── */}
          <Text className="px-4 pt-5 pb-2 text-xs font-medium text-muted">
            요금제
          </Text>

          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const cta = getPlanCta(plan);
            const storeProduct = plan.productId ? storeProducts[plan.productId] : null;
            const displayPrice = storeProduct?.localizedPrice ?? plan.price;
            const isPurchasing = purchasing === plan.productId;

            return (
              <View
                key={plan.key}
                className={`mx-4 mb-3 p-4 rounded-lg bg-surface ${
                  isCurrent
                    ? "border-2 border-primary"
                    : "border border-border"
                }`}
              >
                {/* Plan Header */}
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-heading">
                      {plan.name}
                    </Text>
                    <Text>{plan.emoji}</Text>
                  </View>
                  {isCurrent && (
                    <View className="bg-primary px-2.5 py-1 rounded-full">
                      <Text className="text-xs font-medium text-white">
                        현재 플랜
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price */}
                <View className="flex-row items-end gap-1 mb-4">
                  <Text className="text-2xl font-bold text-heading">
                    {displayPrice}
                  </Text>
                  <Text className="text-sm text-muted mb-0.5">
                    {plan.period}
                  </Text>
                </View>

                {/* Features */}
                <View className="gap-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <Feather size={13} name="check" color="#B91C1C" />
                      <Text className="text-sm text-body">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                {isCurrent ? (
                  <View className="p-3 bg-background border border-border rounded-lg">
                    <Text className="text-center text-sm text-muted">
                      현재 이용 중인 플랜
                    </Text>
                  </View>
                ) : cta ? (
                  <TouchableOpacity
                    disabled={isPurchasing || !!purchasing}
                    onPress={() => cta.isUpgrade ? handlePurchase(plan) : undefined}
                    className={`p-3 rounded-lg ${
                      cta.isUpgrade
                        ? "bg-primary"
                        : "border border-border"
                    } ${(isPurchasing || !!purchasing) ? "opacity-50" : ""}`}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator size="small" color={cta.isUpgrade ? "#fff" : "#737373"} />
                    ) : (
                      <Text
                        className={`text-center text-sm font-medium ${
                          cta.isUpgrade ? "text-white" : "text-muted"
                        }`}
                      >
                        {cta.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}

          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring || !!purchasing}
            className="mx-4 mt-4 p-3 border border-border rounded-lg"
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#737373" />
            ) : (
              <Text className="text-center text-sm text-muted">구매 복원</Text>
            )}
          </TouchableOpacity>

          <Text className="px-4 pt-3 text-xs text-muted text-center">
            구독은 Google Play 계정으로 청구됩니다.{"\n"}
            구독 관리 및 취소는 Google Play 스토어에서 가능합니다.
          </Text>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

export default MembershipPage;
