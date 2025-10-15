import { CHARACTERS } from "@assets/characters/CHARACTERS";
import { OBJECTS } from "@assets/objects";

// file키 → API character_id (e.g. base_explorer_female → base_f)
const FILE_TO_ID = CHARACTERS.reduce((m, c) => ((m[c.file] = c.id), m), {});

export function customizeToApiPayload(slots) {
  const character_id = FILE_TO_ID[slots.character] ?? null;
  const bg1only = slots.bg1 ?? null;
  const bg23 = [slots.bg2, slots.bg3]
    .filter(Boolean)
    .filter((k) => OBJECTS[k]?.group === "bg23")
    .slice(0, 2);

  return {
    character_id, // string|null
    assets: { "bg1-only": bg1only, bg23 }, // 항상 이 형태로
  };
}

export function apiToHeroSlots(api) {
  return {
    characterId: api?.current_character_id ?? null,
    slotBg1: api?.current_assets?.["bg1-only"] ?? null,
    slotBg23: Array.isArray(api?.current_assets?.bg23)
      ? api.current_assets.bg23.slice(0, 2)
      : [],
  };
}