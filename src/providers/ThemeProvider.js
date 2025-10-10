import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getWeatherFromBackend } from "../services/weather"; // 앞서 만든 간단 어댑터
import { computeSubphase, pickColors, pickEffects } from "../theme/phase";

const ThemeCtx = createContext(null);
export const useThemeX = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [state, setState] = useState({
    condition: "CLOUDY",
    subphase: "am",
    colors: ["#C9D2DE", "#EAEFF5"],
    effects: { showStars: false, showRain: false, showSnow: false },
    provider: "init",
    updatedAt: Date.now(),
  });

  // 1) 최초 로드 + 날씨 가져오기
  useEffect(() => {
    (async () => {
      const w = await getWeatherFromBackend();
      const sub = computeSubphase(w.condition, new Date());
      const colors = pickColors(w.condition, sub);
      const effects = pickEffects(w.condition, sub);
      setState({
        condition: w.condition,
        subphase: sub,
        colors,
        effects,
        provider: w.provider,
        updatedAt: Date.now(),
      });
    })();
  }, []);

  // 2) 정각 전환: 매 분 체크 → 다음 정각에 1회 재계산
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      // 매 분 0초에만 수행
      if (now.getMinutes() === 0 && now.getSeconds() < 2) {
        setState(prev => {
          const sub = computeSubphase(prev.condition, now);
          if (sub === prev.subphase) return prev;
          return {
            ...prev,
            subphase: sub,
            colors: pickColors(prev.condition, sub),
            effects: pickEffects(prev.condition, sub),
            updatedAt: Date.now(),
          };
        });
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const value = useMemo(() => state, [state]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}