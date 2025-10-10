export const CHARACTERS = [
  // 🧭 기본형
  {
    id: "base_f",
    name: "탐험가",
    gender: "female",
    file: "base_explorer_female",
    theme: "base",
  },
  {
    id: "base_m",
    name: "탐험가",
    gender: "male",
    file: "base_explorer_male",
    theme: "base",
  },

  // 🌸 계절
  {
    id: "spring_f",
    name: "햇살 탐험가",
    gender: "female",
    file: "spring_explorer_female",
    theme: "season",
  },
  {
    id: "spring_m",
    name: "햇살 탐험가",
    gender: "male",
    file: "spring_explorer_male",
    theme: "season",
  },
  {
    id: "summer_f",
    name: "바캉스 탐험가",
    gender: "female",
    file: "summer_explorer_female",
    theme: "season",
  },
  {
    id: "summer_m",
    name: "바캉스 탐험가",
    gender: "male",
    file: "summer_explorer_male",
    theme: "season",
  },
  {
    id: "autumn_f",
    name: "단풍 탐험가",
    gender: "female",
    file: "autumn_explorer_female",
    theme: "season",
  },
  {
    id: "autumn_m",
    name: "단풍 탐험가",
    gender: "male",
    file: "autumn_explorer_male",
    theme: "season",
  },
  {
    id: "winter_f",
    name: "눈꽃 탐험가",
    gender: "female",
    file: "winter_explorer_female",
    theme: "season",
  },
  {
    id: "winter_m",
    name: "눈꽃 탐험가",
    gender: "male",
    file: "winter_explorer_male",
    theme: "season",
  },

  // 📚 취미
  {
    id: "reading_f",
    name: "서재 탐험가",
    gender: "female",
    file: "reading_explorer_female",
    theme: "hobby",
  },
  {
    id: "reading_m",
    name: "서재 탐험가",
    gender: "male",
    file: "reading_explorer_male",
    theme: "hobby",
  },
  {
    id: "photo_f",
    name: "필름 탐험가",
    gender: "female",
    file: "photo_explorer_female",
    theme: "hobby",
  },
  {
    id: "photo_m",
    name: "필름 탐험가",
    gender: "male",
    file: "photo_explorer_male",
    theme: "hobby",
  },
  {
    id: "coffee_f",
    name: "라떼 탐험가",
    gender: "female",
    file: "coffee_explorer_female",
    theme: "hobby",
  },
  {
    id: "coffee_m",
    name: "라떼 탐험가",
    gender: "male",
    file: "coffee_explorer_male",
    theme: "hobby",
  },

  // 🎃 할로윈
  {
    id: "halloween_f",
    name: "할로윈 탐험가",
    gender: "female",
    file: "halloween_explorer_female",
    theme: "halloween",
  },
  {
    id: "halloween_m",
    name: "할로윈 탐험가",
    gender: "male",
    file: "halloween_explorer_male",
    theme: "halloween",
  },
  {
    id: "ghost_f",
    name: "유령 탐험가",
    gender: "female",
    file: "ghost_explorer_female",
    theme: "halloween",
  },
  {
    id: "ghost_m",
    name: "유령 탐험가",
    gender: "male",
    file: "ghost_explorer_male",
    theme: "halloween",
  },
  {
    id: "dracula_f",
    name: "드라큘라 탐험가",
    gender: "female",
    file: "dracula_explorer_female",
    theme: "halloween",
  },
  {
    id: "dracula_m",
    name: "드라큘라 탐험가",
    gender: "male",
    file: "dracula_explorer_male",
    theme: "halloween",
  },

  // 🎄 크리스마스
  {
    id: "santa_f",
    name: "산타 탐험가",
    gender: "female",
    file: "santa_explorer_female",
    theme: "christmas",
  },
  {
    id: "santa_m",
    name: "산타 탐험가",
    gender: "male",
    file: "santa_explorer_male",
    theme: "christmas",
  },
  {
    id: "eve_f",
    name: "이브 탐험가",
    gender: "female",
    file: "eve_explorer_female",
    theme: "christmas",
  },
  {
    id: "eve_m",
    name: "이브 탐험가",
    gender: "male",
    file: "eve_explorer_male",
    theme: "christmas",
  },
  {
    id: "rudolph_f",
    name: "루돌프 탐험가",
    gender: "female",
    file: "rudolph_explorer_female",
    theme: "christmas",
  },
  {
    id: "rudolph_m",
    name: "루돌프 탐험가",
    gender: "male",
    file: "rudolph_explorer_male",
    theme: "christmas",
  },
];

export const THEME_LABELS = {
  base: "탐험가",
  season: "계절",
  hobby: "취미",
  halloween: "할로윈",
  christmas: "크리스마스",
};

export const getCharacterImageKey = (fileBase, owned) =>
  owned ? fileBase : `${fileBase}_gray`;
