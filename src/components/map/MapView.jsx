import React, { useMemo } from 'react';
import { WebView } from 'react-native-webview';

export default function MapView({ lat = 37.248492, lng = 127.076754, name = "" }) {
  const HTML = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0,
                 minimum-scale=1.0, user-scalable=no">
  <!-- 네이버 지도 JS -->
  <script type="text/javascript"
    src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${"9avrw4jz0c"}"></script>
  <style>
    html,body{margin:0;padding:0;height:100%}
    #map{position:absolute;inset:0}
  </style>
</head>
<body>
  <div id="map" style="width:100%;height:100%;"></div>

  <script>
    var map, marker;

    function init() {
      var center = new naver.maps.LatLng(${lat}, ${lng});
      var shiftedCenter = new naver.maps.LatLng(${lat}-0.003, ${lng});

      map = new naver.maps.Map('map', {
        center: shiftedCenter,
        zoom: 16
      });

      // === 커스텀 SVG 마커 ===
      marker = new naver.maps.Marker({
        position: center,
        map: map,
        title: ${JSON.stringify(String(name || ""))},
        icon: {
          content: \`
            <svg width="28" height="33" viewBox="0 0 28 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.0001 0C21.7321 0 28.0001 6.26801 28.0001 14C28.0001 20.6726 23.3317 26.2538 17.0831 27.6582L14.0001 33L10.9161 27.6582C4.66799 26.2534 0.00012207 20.6723 0.00012207 14C0.00012207 6.26801 6.26814 0 14.0001 0Z" fill="#6A8042"/>
            </svg>
          \`,
          size: new naver.maps.Size(28, 33),
          anchor: new naver.maps.Point(14, 33) // 하단 꼭짓점이 좌표에 꽂히도록
        }
      });
    }
    init();

    // RN -> WebView 메시지로 마커/카메라 이동 지원
    document.addEventListener("message", function(e){
      try{
        var msg = JSON.parse(e.data);
        if(msg.type === "moveTo" && msg.lat && msg.lng){
          var p = new naver.maps.LatLng(msg.lat, msg.lng);
          map.setCenter(p);
          marker.setPosition(p);
        }
      }catch(_){}
    });
  </script>
</body>
</html>
`, [lat, lng, name]);

  return (
    <WebView
      source={{ html: HTML, baseUrl: 'http://localhost:8081' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}