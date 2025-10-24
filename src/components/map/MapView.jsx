import React, { useMemo } from "react";
import { WebView } from "react-native-webview";

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;

// 기본 단일 모드 색 (다중 모드는 팔레트로 결정)
const PIN_COLOR = "#62974F";

export default function MapView({
  lat = 37.248492,
  lng = 127.076754,
  name = "",
  markers = [], // [{ id?, lat, lng, name?, label?, liked? }, ...]
}) {
  const HTML = useMemo(() => {
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
    function darken(hex, amt){
      hex = hex.replace(/^#/, "");
      if (hex.length === 3) hex = hex.split("").map(c => c+c).join("");
      const num = parseInt(hex, 16);
      let r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amt));
      let g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
      let b = Math.max(0, Math.min(255, (num & 0xff) + amt));
      return "#" + [r,g,b].map(v => v.toString(16).padStart(2,"0")).join("");
    }

    // 번호 핀
    function pinSVG(label, fillColor, strokeColor){
      return \`
        <div style="position:relative; transform: translate(-50%, -100%);
                    filter: drop-shadow(0px 0px 4px rgba(0,0,0,0.5));
                    will-change: filter; pointer-events:none;">
          <svg width="27" height="36" viewBox="0 0 27 36" xmlns="http://www.w3.org/2000/svg">
            <path opacity="0.7"
              d="M25 12.5C25 22 13 33.5 13 33.5C13 33.5 0 21 0 12.5C0 5.59644 5.59644 0 12.5 0C19.4036 0 25 5.59644 25 12.5Z"
              fill="\${fillColor || "#62974F"}"
              stroke="#FFFFFF"
              stroke-width="1.2"
            />
            <circle cx="12.5" cy="12.5" r="7.5" fill="white"/>
            <text
              x="12.5"
              y="13"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="14"
              font-weight="500"
              fill="\${fillColor || "#62974F"}"
              font-family="-apple-system,BlinkMacSystemFont,'Pretendard','Segoe UI',Roboto,'Noto Sans KR',sans-serif"
            >\${label || ""}</text>
          </svg>
        </div>
      \`;
    }

    // 좋아요 핀 (원 + 하트). 하트 색을 팔레트 색과 맞춤
    function likedPinSVG(heartColor){
      return \`
        <div style="position:relative; transform: translate(-50%, -50%);
                    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
                    pointer-events:none;">
          <svg width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12.5" cy="12.5" r="12.5" fill="#FFFFFF"/>
            <g transform="translate(4,4) scale(0.708333)">
              <path
                d="m12 21-1.45-1.295C5.4 15.125 2 12.093 2 8.395
                   2 5.364 4.42 3 7.5 3c1.74 0 3.41.795 4.5 2.04A6.062 6.062 0 0 1 16.5 3
                   C19.58 3 22 5.364 22 8.395c0 3.698-3.4 6.73-8.55 11.31L12 21Z"
                fill="\${heartColor || "#EE7A13"}"/>
            </g>
          </svg>
        </div>
      \`;
    }

    // 다중 마커용 색 팔레트 (1,2,3…에 매핑)
    var PALETTE = ["#62974F", "#117C73", "#00196A"];
    var HEART_COLOR = "#EE7A13"; // 좋아요(하트) 색상 통일: 주황

    function colorForMarker(m, i){
      // label이 숫자면 1→0, 2→1 …로 매핑, 아니면 index 사용
      var n = parseInt(m.label, 10);
      var idx = isNaN(n) ? i : Math.max(0, n - 1);
      return PALETTE[idx % PALETTE.length];
    }

    function init() {
      var markerData = ${markersJSON};
      if (window.ReactNativeWebView) {
           try { window.ReactNativeWebView.postMessage(JSON.stringify({
             type: "debug-markers", count: (markerData||[]).length,
             first: (markerData||[])[0] || null
           })); } catch(_) {}
         }
      var hasMany = Array.isArray(markerData) && markerData.length > 0;

      // 단일 마커
      if (!hasMany) {
        var center = new naver.maps.LatLng(${lat}, ${lng});
        var shiftedCenter = new naver.maps.LatLng(${lat}-0.003, ${lng});
        map = new naver.maps.Map('map', { center: shiftedCenter, zoom: 16 });
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

      // 다중 마커
      var first = markerData[0];
      map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(first.lat, first.lng),
        zoom: 11
      });

      var bounds = new naver.maps.LatLngBounds();
      markerData.forEach(function(m, i){
        var pos = new naver.maps.LatLng(m.lat, m.lng);
        bounds.extend(pos);

        var fill = colorForMarker(m, i);
        var stroke = darken(fill, -30);

        new naver.maps.Marker({
          position: pos,
          map: map,
          title: m.name || "",
          icon: {
            content: m.liked
              ? likedPinSVG(HEART_COLOR)           // ✅ 좋아요: 하트 색상 주황으로 고정
              : pinSVG(m.label || "", fill, stroke), // 번호 핀: 팔레트 + 테두리
            size: new naver.maps.Size(25,34),
            anchor: new naver.maps.Point(12,34)
          }
        });
      });

      // 영역 맞춤
      if (markerData.length === 1) {
        map.setCenter(new naver.maps.LatLng(first.lat, first.lng));
        map.setZoom(11);
      } else {
        try { map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 }); } catch(_) {}
      }
    }

    init();

    // RN -> WebView 이동 메시지
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
      onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === "debug-markers") {
            console.log("[debug-markers]", msg);
          }
        } catch (e) {
          console.log("[webview-msg]", event.nativeEvent.data);
        }
      }}
    />
  );
}
