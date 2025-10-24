import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiToHeroSlots } from "@utils/appearance.adapters";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_HERO = { characterId: "base_f", slotBg1: "tent", slotBg23: ["tree", "tree"] };

export const useAppearanceStore = create(
  persist(
    (set) => ({
      heroSlots: DEFAULT_HERO,
      setHeroSlots: (slots) => set({ heroSlots: { ...slots } }),
      setFromApi: (api) => set({ heroSlots: apiToHeroSlots(api) }),
    }),
    {
      name: "appearance-store-v1", // 저장 키 이름
      storage: createJSONStorage(() => AsyncStorage), // React Native AsyncStorage 사용
      partialize: (state) => ({ heroSlots: state.heroSlots }), // heroSlots만 저장
    }
  )
);