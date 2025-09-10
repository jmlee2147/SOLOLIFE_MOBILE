// 공통 무드
export const MOODS = [
    "사람많은",
    "한적한",
    "넓은",
    "아늑한",
    "조용한",
    "활기찬",
    "밝은",
    "어두운",
];

export const CATEGORY = {
    cafe: {
      label: "카페",
      desc: "카페인 수혈!",
      keywords: ["사진찍기 좋은", "콘센트 많은"],
    },
    activity: {
      label: "활동",
      desc: "다양한 체험과 활동",
      subcategories: {
        experience: { label: "체험", keywords: [] },
        exhibition: { label: "전시/박물관", keywords: ["사진찍기 좋은"] },
        trail: { label: "산책/등산", keywords: ["자전거 도로가 있는"] },
        library: { label: "도서관", keywords: [] },
        other: { label: "기타", keywords: [] },
      },
    },
    shopping: {
      label: "쇼핑",
      desc: "내 마음에 쏙 들어!",
      subcategories: {
        clothing: { label: "옷", keywords: ["빈티지"] },
        prop: { label: "소품샵", keywords: [] },
        bookstore: { label: "서점", keywords: ["동네책방"] },
        other: { label: "기타", keywords: [] },
      },
    },
    food: {
      label: "먹거리",
      desc: "맛있는 행복",
      subcategories: {
        restaurant: { label: "음식점", keywords: ["1인석", "오마카세"] },
        bar: { label: "술집", keywords: ["바", "이자카야"] },
      },
    },
  };

  // 상위(편의) 카테고리 → 백엔드 실제 카테고리(여러개)
  export const EDIT_CATEGORY_MAP = {
    "카페": ["카페"],

    "쇼핑": ["옷", "소품샵", "서점", "기타"],

    "먹거리": ["음식점", "술집"],

    "체험": ["체험"],

    "전시": ["전시/박물관"],

    "독서/자기개발": ["도서관"],

    "산책": ["산책/등산"],
  };
  
  // 한글 라벨  내부 key 매핑
  export function resolveCategoryKeyByLabel(label) {
    const entry = Object.entries(CATEGORY).find(([, v]) => v.label === label);
    return entry?.[0];
  };