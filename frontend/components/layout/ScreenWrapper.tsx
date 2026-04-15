import { View, ViewProps } from "react-native";

export default function ScreenWrapper({ children, ...props }: ViewProps) {
  return (
    <View className="flex-1 bg-surface" {...props}>
      {children}
    </View>
  );
}
