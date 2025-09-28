import React, { useMemo } from "react";
import { WebView } from "react-native-webview";

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;

const PIN_COLOR = "#62974F";

export default function MapView({
  lat = 37.248492,
  lng = 127.076754,
  name = "",
  markers = [], // [{ id?, lat, lng, name?, label? }, ...]
}) {
  const HTML = useMemo(() => {
    // RN -> WebView로 넘길 데이터: 인덱스로 색상 할당해서 color 필드 포함
    const data = Array.isArray(markers)
      ? markers
          .map((m, i) => ({
            id: m.id ?? String(i),
            lat: Number(m.lat),
            lng: Number(m.lng),
            name: String(m.name ?? ""),
            label: String(m.label ?? i + 1),
            liked: !!m.liked,
          }))
          .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng))
      : [];

    const markersJSON = JSON.stringify(data);
    const singleColor = PIN_COLOR;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0,
                 minimum-scale=1.0, user-scalable=no">
  <script type="text/javascript"
    src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}"></script>
  <style>
    html,body{margin:0;padding:0;height:100%}
    #map{position:absolute;inset:0}
  </style>
</head>
<body>
  <div id="map" style="width:100%;height:100%;"></div>

  <script>
    var map;

    // fill(색상) 파라미터 추가
    function pinSVG(label, fillColor){
    return \`
      <div style="position:relative; transform: translate(-50%, -100%);
                  filter: drop-shadow(0px 0px 4px rgba(0,0,0,0.5));
                  will-change: filter; pointer-events:none;">
        <svg width="25" height="34" viewBox="0 0 25 34" xmlns="http://www.w3.org/2000/svg">
          <path opacity="1"
            d="M25 12.5C25 22 13 33.5 13 33.5C13 33.5 0 21 0 12.5C0 5.59644 5.59644 0 12.5 0C19.4036 0 25 5.59644 25 12.5Z"
            fill="\${fillColor || "#62974F"}"/>
          <circle cx="12.5" cy="12.5" r="7.5" fill="white"/>
          <text
            x="12.5"
            y="13"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="16"
            font-weight="500"
            fill="#62974F"
            font-family="-apple-system,BlinkMacSystemFont,'Pretendard','Segoe UI',Roboto,'Noto Sans KR',sans-serif"
          >\${label || ""}</text>
        </svg>
      </div>
    \`;
  }

  // 좋아요 핀
  function likedPinSVG(fillColor){
    return \`
      <div style="position:relative; transform: translate(-50%, -50%);
                  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
                  pointer-events:none;">
        <svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
          <!-- 바탕 원 -->
          <circle cx="12.5" cy="12.5" r="12.5" fill="#FFFFFF"/>
          <!-- 하트 (중앙 정렬) -->
          <g transform="translate(4,4) scale(0.708333)">
          <path
            d="m12 21-1.45-1.295C5.4 15.125 2 12.093 2 8.395
               2 5.364 4.42 3 7.5 3c1.74 0 3.41.795 4.5 2.04A6.062 6.062 0 0 1 16.5 3
               C19.58 3 22 5.364 22 8.395c0 3.698-3.4 6.73-8.55 11.31L12 21Z"
            fill="#EE7A13"/>
          </g>
        </svg>
    </div>
    \`;
  }

    function init() {
      var markerData = ${markersJSON};
      var hasMany = Array.isArray(markerData) && markerData.length > 0;

      // 단일 모드 (기존 lat/lng/name 사용)
      if (!hasMany) {
        var center = new naver.maps.LatLng(${lat}, ${lng});
        var shiftedCenter = new naver.maps.LatLng(${lat}-0.003, ${lng});
        map = new naver.maps.Map('map', {
          center: shiftedCenter,
          zoom: 16
        });
        new naver.maps.Marker({
          position: center,
          map: map,
          title: ${JSON.stringify(String(name || ""))},
          icon: {
            content: pinSVG("", "${singleColor}"),
            size: new naver.maps.Size(25,34),
            anchor: new naver.maps.Point(12,34)
          }
        });
        return;
      }

      // 다중 마커 모드
      var first = markerData[0];
      map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(first.lat, first.lng),
        zoom: 11
      });

      var bounds = new naver.maps.LatLngBounds();
      markerData.forEach(function(m){
        var pos = new naver.maps.LatLng(m.lat, m.lng);
        bounds.extend(pos);
        new naver.maps.Marker({
          position: pos,
          map: map,
          title: m.name || "",
          icon: {
            content: m.liked
              ? likedPinSVG("${singleColor}")  // 하트 마커
              : pinSVG(m.label || "", "${singleColor}"), // 번호 마커
            size: new naver.maps.Size(25,34),
            anchor: new naver.maps.Point(12,34)
          }
        });
      });

      // 자동 영역 맞춤
      if (markerData.length === 1) {
        map.setCenter(new naver.maps.LatLng(first.lat, first.lng));
        map.setZoom(11);
      } else {
        try {
          map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
        } catch (_) {}
      }
    }

    init();

    // (유지) RN → WebView 이동 메시지
    document.addEventListener("message", function(e){
      try{
        var msg = JSON.parse(e.data);
        if(msg.type === "moveTo" && msg.lat && msg.lng){
          var p = new naver.maps.LatLng(msg.lat, msg.lng);
          map.setCenter(p);
        }
      }catch(_){}
    });
  </script>
</body>
</html>
`;
  }, [lat, lng, name, markers]);

  return (
    <WebView
      source={{ html: HTML, baseUrl: "http://localhost:8081" }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}
