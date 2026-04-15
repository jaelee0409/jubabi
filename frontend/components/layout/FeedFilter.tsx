import { DISCLOSURE_CATEGORIES } from "@/constants/disclosures";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
  className?: string;
  onChange?: (id: string) => void;
}

const FeedFilter = ({ className, onChange }: Props) => {
  const [selected, setSelected] = useState<string>(DISCLOSURE_CATEGORIES[0].id);

  const handleSelect = (id: string) => {
    setSelected(id);
    onChange?.(id);
  };

  return (
    <View className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        className="min-h-8"
      >
        {DISCLOSURE_CATEGORIES.map((category) => {
          const isActive = selected === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleSelect(category.id)}
              className={`rounded-full items-center justify-center px-4 py-2 mx-1 ${
                isActive ? "bg-primary" : "bg-disabled"
              }`}
            >
              <Text
                className={isActive ? "font-medium text-white" : "text-muted"}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default FeedFilter;
