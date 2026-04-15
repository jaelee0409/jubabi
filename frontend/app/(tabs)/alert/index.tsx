import ScreenWrapper from "@/components/layout/ScreenWrapper";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { apiFetch } from "@/lib/apiFetch";
import * as Linking from "expo-linking";
import { useNotification } from "@/context/NotificationContext";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  companyName: string;
  title: string;
  disclosedAt: string;
  read: boolean;
  receiptNumber: string;
}

interface AlertItem {
  id: string;
  keyword: string;
  enabled: boolean;
  lastTriggeredAt: string | null;
}

const AlertPage = () => {
  const { refreshUnreadCount } = useNotification();
  const [tab, setTab] = useState<"settings" | "notifications">("notifications");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchNotifications();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch("/api/alerts");
      setAlerts(await res.json());
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch("/api/notifications");
      setNotifications(await res.json());
    } catch {}
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      await apiFetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    } catch {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a)));
    }
  };

  const deleteAlert = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await apiFetch(`/api/alerts/${id}`, { method: "DELETE" });
    } catch {
      fetchAlerts();
    }
  };

  const addAlert = async () => {
    if (!keyword.trim()) return;
    setAdding(true);
    try {
      const res = await apiFetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const newAlert = await res.json();
      setAlerts((prev) => [...prev, newAlert]);
      setKeyword("");
      setModalVisible(false);
    } catch (err: any) {
      alert(err.message ?? "알림 추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      await refreshUnreadCount();
    } catch {}
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      await refreshUnreadCount();
    } catch {}
  };

  return (
    <ScreenWrapper>
      <View className="flex-1 bg-surface">
        {/* Header */}
        <View className="flex-row items-center justify-center px-4 py-4">
          <Text className="text-xl font-medium text-heading">알림</Text>
        </View>

        {/* 탭 토글 */}
        <View className="flex-row mx-4 mb-4 border border-border rounded-lg overflow-hidden">
          <TouchableOpacity
            className={`flex-1 py-2 items-center ${tab === "notifications" ? "bg-primary" : "bg-surface"}`}
            onPress={() => setTab("notifications")}
          >
            <Text className={tab === "notifications" ? "text-white font-medium" : "text-muted"}>
              최근 알림
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 items-center ${tab === "settings" ? "bg-primary" : "bg-surface"}`}
            onPress={() => setTab("settings")}
          >
            <Text className={tab === "settings" ? "text-white font-medium" : "text-muted"}>
              알림 설정
            </Text>
          </TouchableOpacity>
        </View>

        {/* 최근 알림 탭 */}
        {tab === "notifications" && (
          <ScrollView>
            <View className="px-4 flex-row justify-between items-center mb-3">
              <Text className="text-muted text-sm">{notifications.filter((n) => !n.read).length}개 읽지 않음</Text>
              <TouchableOpacity onPress={markAllAsRead}>
                <Text className="text-primary text-sm">모두 읽음</Text>
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Feather name="bell-off" size={40} color="#E5E5E5" />
                <Text className="text-muted mt-4">아직 알림이 없습니다.</Text>
                <Text className="text-muted text-sm mt-1">관심 종목을 추가하면 새 공시 알림을 받을 수 있어요.</Text>
              </View>
            ) : (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  className={`mx-4 mb-3 p-4 border rounded-lg ${n.read ? "border-border" : "border-primary bg-red-50"}`}
                  onPress={() => {
                    Linking.openURL(`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${n.receiptNumber}`);
                    if (!n.read) markAsRead(n.id);
                  }}
                >
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-bold text-heading flex-1 mr-2">{n.companyName}</Text>
                    {!n.read && <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
                  </View>
                  <Text className="text-body mb-3">{n.title}</Text>
                  <Text className="text-muted text-sm">{formatDate(n.disclosedAt)}</Text>
                </TouchableOpacity>
              ))
            )}
            <View className="h-8" />
          </ScrollView>
        )}

        {/* 알림 설정 탭 */}
        {tab === "settings" && (
          <ScrollView>
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-muted text-sm">{alerts.length} / 2 사용 중</Text>
            </View>

            {alerts.length === 0 ? (
              <View className="flex-1 items-center justify-center py-16">
                <Feather name="bell" size={40} color="#E5E5E5" />
                <Text className="text-muted mt-4">등록된 알림이 없습니다.</Text>
                <TouchableOpacity
                  className="mt-4 bg-primary px-6 py-3 rounded-lg"
                  onPress={() => setModalVisible(true)}
                >
                  <Text className="text-white font-medium">첫 알림 추가하기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {alerts.map((alert) => (
                  <View
                    key={alert.id}
                    className="rounded-lg p-4 flex-row items-center justify-between mx-4 mb-3 border border-border"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="font-bold text-heading">{alert.keyword}</Text>
                      <Text className="text-muted text-sm mt-1">
                        최근: {alert.lastTriggeredAt ? formatDate(alert.lastTriggeredAt) : "없음"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Switch
                        value={alert.enabled}
                        onValueChange={(val) => toggleAlert(alert.id, val)}
                        thumbColor={alert.enabled ? "#B91C1C" : "#737373"}
                        trackColor={{ false: "#E5E5E5", true: "#FECACA" }}
                      />
                      <TouchableOpacity onPress={() => deleteAlert(alert.id)} hitSlop={8}>
                        <Feather name="trash-2" size={16} color="#737373" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  className="rounded-lg p-4 flex-row items-center justify-center mx-4 mb-4 border border-border"
                  onPress={() => setModalVisible(true)}
                >
                  <Feather name="plus" size={18} color="#404040" />
                  <Text className="ml-2 text-body">알림 추가</Text>
                </TouchableOpacity>
              </>
            )}
            <View className="h-8" />
          </ScrollView>
        )}
      </View>

      {/* 알림 추가 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-lg font-bold text-heading">알림 추가</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
              <Feather name="x" size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <View className="mx-4 mt-4">
            <Text className="text-muted text-sm mb-2">
              공시 제목에 포함된 키워드로 알림을 받습니다.
            </Text>
            <View className="flex-row items-center border border-border rounded-lg px-3 bg-surface">
              <TextInput
                className="flex-1 py-3 text-body"
                placeholder="예: 유상증자, 자기주식"
                placeholderTextColor="#737373"
                value={keyword}
                onChangeText={setKeyword}
                autoFocus
                onSubmitEditing={addAlert}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`mx-4 mt-4 p-4 rounded-lg ${!keyword.trim() ? "bg-disabled" : "bg-primary"}`}
            onPress={addAlert}
            disabled={adding || !keyword.trim()}
          >
            {adding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-medium">추가하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default AlertPage;
