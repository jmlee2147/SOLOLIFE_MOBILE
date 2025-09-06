import * as Linking from "expo-linking";

/**
 * 네이버 길찾기 열기 (앱 우선 → 웹 폴백)
 * mode: 'car' | 'walk' | 'transit'
 */
export async function openNaverDirections({ lat, lng, name, mode = "car" }) {
  const encodedName = encodeURIComponent(name || "");

  // 네이버 지도 앱 스킴
  let appUrl = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.your.app`;
  if (mode === "walk") {
    appUrl = `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.your.app`;
  } else if (mode === "transit") {
    appUrl = `nmap://route/publicTransit?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=com.your.app`;
  }

  // 웹 폴백 (네이버 지도 Directions)
  const webUrl = `https://map.naver.com/v5/directions/-/-/${lng},${lat},${encodedName}`;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch (_) {
    // ignore → 웹 폴백
  }
  await Linking.openURL(webUrl);
}