import Feed from "@/components/layout/Feed";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import SearchBar from "@/components/inputs/SearchBar";
import React from "react";
import { View } from "react-native";

const IndexPage = () => {
  return (
    <ScreenWrapper>
      <View className="flex-1">
        <SearchBar className="p-4" />
        <Feed />
      </View>
    </ScreenWrapper>
  );
};

export default IndexPage;
