import { useNotification } from "@/context/NotificationContext";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

function AlertsTabIcon({ color, size }: { color: string; size: number }) {
  const { unreadCount } = useNotification();

  return (
    <View>
      <Feather name="bell" size={size} color={color} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            right: -6,
            top: -3,
            backgroundColor: "#B91C1C",
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#B91C1C",
        tabBarInactiveTintColor: "#737373",
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: { marginBottom: 8 },
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="search"
        options={{
          title: "홈",
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather size={20} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          title: "관심 종목",
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather size={20} name="star" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alert"
        options={{
          title: "알림",
          tabBarIcon: ({ color }: { color: string }) => (
            <AlertsTabIcon size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color }: { color: string }) => (
            <Feather size={20} name="user" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="corp/[corpCode]"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/bookmark/index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/membership/index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/notices/index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/help/index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/support/index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile/settings/index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
