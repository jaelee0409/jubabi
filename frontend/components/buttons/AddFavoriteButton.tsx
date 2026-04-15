import { TouchableOpacity, Text } from "react-native";
import { apiFetch } from "@/lib/apiFetch";

export default function AddFavoriteButton({
  corpCode,
  stock_name,
}: {
  corpCode: string;
  stock_name: string;
}) {
  const addFavorite = async () => {
    const res = await apiFetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ corpCode }),
    });

    if (res.ok) {
      alert(`${stock_name}가 관심 종목에 추가되었습니다!`);
    } else {
      const err = await res.json();
      alert(`관심 종목 추가 실패: ${err.error}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={addFavorite}
      className="bg-primary mx-auto p-4 w-full rounded-lg"
    >
      <Text className="text-center text-white font-medium">관심 종목 추가</Text>
    </TouchableOpacity>
  );
}
