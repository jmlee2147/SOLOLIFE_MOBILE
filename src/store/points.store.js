import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyPoints } from "@services/api"; // 없으면 아래 주석 참고
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const usePointsStore = create(
  persist(
    (set, get) => ({
      points: null, // 초기 null: 아직 로딩 전이라는 의미
      loading: false,
      error: null,
      setPoints: (v) => set({ points: typeof v === "number" ? v : 0 }),
      addPoints: (delta) => {
        const cur = get().points ?? 0;
        set({ points: cur + Number(delta || 0) });
      },
      deductPoints: (delta) => {
        const cur = get().points ?? 0;
        set({ points: Math.max(0, cur - Number(delta || 0)) });
      },
      // 서버에서 현재 포인트 가져오기
      loadPoints: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          const p = await getMyPoints(); // 서버에서 number 반환하도록
          set({ points: typeof p === "number" ? p : 0, loading: false });
        } catch (e) {
          set({ error: e, loading: false });
        }
      },
    }),
    {
      name: "points-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ points: s.points }), // 포인트만 영속
    }
  )
);