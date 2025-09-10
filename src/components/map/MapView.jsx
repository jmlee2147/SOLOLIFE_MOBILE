import React, { useMemo } from 'react';
import { WebView } from 'react-native-webview';

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
// 원하는 색상 팔레트 (인덱스 순환)
const COLORS = ["#62974F", "#B3B56C", "#DBDCC1"];

export default function MapView({
  lat = 37.248492,
  lng = 127.076754,
  name = "",
  markers = [],           // [{ id?, lat, lng, name?, label? }, ...]
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
            color: COLORS[i % COLORS.length],        // ⬅️ 인덱스별 색상
          }))
          .filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng))
      : [];

    const markersJSON = JSON.stringify(data);
    const singleColor = COLORS[0]; // 단일 마커 모드 기본 색

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
    function pinSVG(label, fill){
      return \`
        <div style="position:relative; transform: translate(-50%, -100%);
                    filter: drop-shadow(0px 0px 6px rgba(0,0,0,0.2));
                    will-change: filter; pointer-events:none;">
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C21.732 0 28 6.268 28 14c0 6.673-4.668 12.254-10.917 13.658L14 33l-3.083-5.342C4.668 26.254 0 20.673 0 14 0 6.268 6.268 0 14 0Z" fill="\${fill || '#62974F'}"/>
          <text
            x="14"
            y="16"                             
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="16"
            font-weight="700"
            fill="#ffffff"
            font-family="-apple-system,BlinkMacSystemFont,'Pretendard','Segoe UI',Roboto,'Noto Sans KR',sans-serif"
          >\${label || ''}</text>
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
            content: pinSVG("1", "${singleColor}"),
            size: new naver.maps.Size(28,33),
            anchor: new naver.maps.Point(14,33)
          }
        });
        return;
      }

      // 다중 마커 모드
      var first = markerData[0];
      map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(first.lat, first.lng),
        zoom: 15
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
            content: pinSVG(m.label || "", m.color || "${singleColor}"),
            size: new naver.maps.Size(28,33),
            anchor: new naver.maps.Point(14,33)
          }
        });
      });

      // 자동 영역 맞춤
      if (markerData.length === 1) {
        map.setCenter(new naver.maps.LatLng(first.lat, first.lng));
        map.setZoom(16);
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
      source={{ html: HTML, baseUrl: 'http://localhost:8081' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}