export function computeSubphase(condition /* "SUNNY"|"CLOUDY"|"RAIN"|"SNOW" */, now = new Date()) {
    const h = now.getHours(); // 0~23, 로컬
    switch (condition) {
      case "SUNNY":
        if (h <= 8) return "morning";     // 0–7
        if (h <= 20) return "day";        // 8–15
        return "night";                   // 16–23
      case "CLOUDY":
        return h <= 18 ? "am" : "pm";     // 12h
      case "RAIN":
        return "all";                     // 고정
      case "SNOW":
        return h <= 18 ? "am" : "pm";     // 12h
      default:
        return "day";
    }
  }
  
  export function pickColors(condition, sub) {
    // 안전 폴백
    const is = (obj, k) => obj && Object.prototype.hasOwnProperty.call(obj, k);
    // eslint-disable-next-line global-require
    const { PALETTE } = require("./palette");
    const set = PALETTE[condition] || PALETTE.SUNNY;
    // SUNNY/CLOUDY/SNOW는 sub키, RAIN은 all
    if (is(set, sub)) return set[sub];
    if (is(set, "all")) return set.all;
    // 최후 폴백
    return ["#B9E09D", "#419833"];
  }
  
  export function pickEffects(condition, sub) {
    return {
      showStars: condition === "SUNNY" && sub === "night",
      showRain:  condition === "RAIN",
      showSnow:  condition === "SNOW",
    };
  }