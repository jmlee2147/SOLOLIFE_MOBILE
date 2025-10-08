import { getLikeFolders } from "@services/api"; // 필요 시 사용할 수 있게 남김
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import LikeSheet from "./LikeSheet";

export const LikeSheetContext = createContext(null);

export function LikeSheetProvider({ children }) {
  const modalRef = useRef(null);
  const [place, setPlace] = useState(null);
  const [likedMap, setLikedMap] = useState({});
  const [folders, setFolders] = useState([]);

  // (옵션) 폴더 목록 사전 로드가 필요하면 사용
  const loadFolders = useCallback(async () => {
    try {
      const items = await getLikeFolders();
      setFolders(items || []);
    } catch (e) {
      console.warn("[likeSheet] 폴더 목록 불러오기 실패", e);
    }
  }, []);

  const open = useCallback((params) => {
    // params: { locationId, title, thumbs, onConfirm? }
    setPlace(params || null);
    setTimeout(() => {
      modalRef.current?.present();
    }, 0);
  }, []);

  const close = useCallback(() => {
    modalRef.current?.dismiss();
    // 모달 닫힌 후 상태 정리
    setTimeout(() => setPlace(null), 0);
  }, []);

  /**
   * LikeSheet 내부에서 이미 API 토글을 수행한 뒤 결과 payload를 올려줌.
   * 여기서는 전역 상태/콜백 전달만 한다. (API 재호출 절대 금지)
   */
  const handleConfirm = useCallback((payload) => {
    const { folderId, locationId, inFolder } = payload || {};
    if (!locationId) return;

    // 전역 맵(선택 사항)
    setLikedMap((p) => ({ ...p, [locationId]: !!inFolder }));

    // ResultsScreen 등에서 open()으로 넘겨준 onConfirm 호출
    if (typeof place?.onConfirm === "function") {
      try {
        place.onConfirm({ folderId, locationId, inFolder });
      } catch (e) {
        console.warn("[LikeSheetProvider] place.onConfirm error:", e?.message || e);
      }
    }
  }, [place]);

  const value = {
    open,
    close,
    likedMap,
    setLikedMap,
    folders,
    loadFolders,
  };

  return (
    <LikeSheetContext.Provider value={value}>
      {children}
      <LikeSheet
        ref={modalRef}
        place={place}
        onClose={close}
        onConfirm={handleConfirm}
      />
    </LikeSheetContext.Provider>
  );
}

export function useLikeSheet() {
  const ctx = useContext(LikeSheetContext);
  if (!ctx) {
    return {
      open: () => console.warn("[LikeSheet] Provider가 감싸져 있지 않습니다."),
      close: () => {},
      likedMap: {},
      setLikedMap: () => {},
      folders: [],
      loadFolders: () => {},
    };
  }
  return ctx;
}