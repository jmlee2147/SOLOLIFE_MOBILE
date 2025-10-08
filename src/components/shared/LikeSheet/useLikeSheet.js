import { useContext } from "react";
import { LikeSheetContext } from "./context"; // 아래 참고: context 파일

/**
 * 어디서든 사용:
 * const { open, close, isOpen } = useLikeSheet();
 * open(place); // 바텀시트 열기
 */
export default function useLikeSheet() {
  const ctx = useContext(LikeSheetContext);
  if (!ctx) {
    // Provider로 감싸지 않은 경우에도 앱이 죽지 않도록 방어
    return {
      open: () => console.warn("[LikeSheet] Provider가 감싸져 있지 않습니다."),
      close: () => {},
      isOpen: false,
    };
  }
  return ctx;
}