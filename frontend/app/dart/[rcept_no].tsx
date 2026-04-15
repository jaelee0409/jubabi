import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Linking } from "react-native";

export default function DartPage() {
  const params = useLocalSearchParams<{ rcept_no?: string | string[] }>();
  const router = useRouter();

  // 2) 중복 실행 방지 (RN StrictMode/재마운트 대비)
  const openedRef = useRef(false);

  const rcpNo = useMemo(() => {
    const v = params.rcept_no;
    return (Array.isArray(v) ? v[0] : v)?.trim();
  }, [params.rcept_no]);

  useEffect(() => {
    if (!rcpNo || typeof rcpNo !== "string") return;
    openedRef.current = true;

    const url = `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${encodeURIComponent(
      rcpNo
    )}`;

    (async () => {
      try {
        // 인앱 브라우저 대신, 바로 시스템 브라우저로 넘김
        await Linking.openURL(url);
      } finally {
        router.back();
      }
    })();
  }, [rcpNo]);

  return null; // 별도 UI 없음
}
