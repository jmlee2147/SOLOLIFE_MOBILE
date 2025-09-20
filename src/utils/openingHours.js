export function getTodayIdx() {
    // JS: 0=일 ~ 6=토 (Google open.day도 동일)
    return new Date().getDay();
  }
  
  function getKoreanWeekdayName(idx) {
    return ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"][idx];
  }
  
  export function formatHHmm(hhmm) {
    if (!hhmm || !/^\d{4}$/.test(String(hhmm))) return "";
    const hh = hhmm.slice(0, 2);
    const mm = hhmm.slice(2);
    const n = Number(hh);
    const ampm = n >= 12 ? "오후" : "오전";
    const h12 = ((n + 11) % 12) + 1;
    return `${ampm} ${h12}:${mm}`;
  }
  
  export function getTodayPeriod(opening_hours) {
    const periods = opening_hours?.periods;
    if (!Array.isArray(periods)) return null;
    const today = getTodayIdx();
    // 같은 요일 여러 구간 가능 → 우선 첫 구간 사용
    const seg = periods.find((p) => p?.open?.day === today);
    if (!seg?.open?.time || !seg?.close?.time) return null;
    return { open: seg.open.time, close: seg.close.time };
  }
  
  // weekday_text에서 오늘 줄 파싱 (월→일/일→토 어떤 순서여도 안전)
  export function getHoursFromWeekdayText(opening_hours) {
    const list = opening_hours?.weekday_text;
    if (!Array.isArray(list) || list.length === 0) return null;
    const todayName = getKoreanWeekdayName(getTodayIdx()); // "월요일" 등
    const line = list.find((s) => typeof s === "string" && s.startsWith(todayName));
    if (!line) return null;
    const colon = line.indexOf(":");
    if (colon < 0) return null;
    const right = line.slice(colon + 1).trim();
    if (!right) return null;
    // "~" → "-" 통일
    return right.replace(/\s*~\s*/g, " - ");
  }
  
  /**
   * opening_hours 요약
   * - 시간이 있으면: hoursText = "오전 9:30 - 오후 10:30", hasHours=true
   * - 시간이 없고 open_now만 있으면: hoursText=null, openNow=true/false → 상태만 표시
   * - 둘 다 없으면: hoursText=null, openNow=null
   */
  export function getOpenBadge(opening_hours) {
    if (!opening_hours) return { openNow: null, hoursText: null, hasHours: false };
  
    const period = getTodayPeriod(opening_hours);
    const hoursText = period
      ? `${formatHHmm(period.open)} - ${formatHHmm(period.close)}`
      : getHoursFromWeekdayText(opening_hours) || null;
  
    const hasHours = !!hoursText;
    const openNow = (typeof opening_hours.open_now === "boolean")
      ? opening_hours.open_now
      : null;
  
    return { openNow, hoursText, hasHours };
  }