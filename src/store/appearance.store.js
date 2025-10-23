import { apiToHeroSlots } from "@utils/appearance.adapters";
import { create } from "zustand";

const DEFAULT_HERO = { characterId: "base_f", slotBg1: "tent", slotBg23: ["tree", "tree"] };

export const useAppearanceStore = create((set) => ({
  heroSlots: DEFAULT_HERO,
  setHeroSlots: (slots) => set({ heroSlots: { ...slots } }),
  setFromApi: (api) => set({ heroSlots: apiToHeroSlots(api) }),
}));