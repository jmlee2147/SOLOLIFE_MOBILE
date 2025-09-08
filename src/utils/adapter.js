import { CATEGORY } from "../config/category.config";

/**
 * 백엔드에 보낼 category 문자열 규칙
 * - subcategory가 있으면 서브카테고리 "한글 라벨"
 * - 없으면 루트 카테고리 "한글 라벨"
 */

export function resolveCategoryForAPI(catKey, subKey) {
  if (!catKey) return "";
  const cat = CATEGORY[catKey];
  if (!cat) return String(catKey);

  if (subKey && cat.subcategories?.[subKey]?.label) {
    return cat.subcategories[subKey].label;
  }
  return cat.label ?? String(catKey);
}

/**
 * UI에서 전달한 공통/개별 키워드를 백엔드 요청 바디로 변환
 * - 우리 UI: 공통 무드(MOODS) = uiCommon  → API: keywords
 * - 우리 UI: 개별 키워드(카테고리 전용) = uiSpecific → API: moods
 */
export function toRecommendationBody({ catKey, subKey, uiCommon = [], uiSpecific = [] }) {
  return {
    category: resolveCategoryForAPI(catKey, subKey),
    keywords: uiCommon,     // 공통 무드
    moods: uiSpecific,      // 개별 키워드
  };
}