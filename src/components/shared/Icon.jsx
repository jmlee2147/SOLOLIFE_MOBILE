import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

const icons = {
  book: ({ width = 24, height = 24, ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
      <G clipPath="url(#clip0)">
        <Rect x="5" y="5" width="14" height="15" fill="#6A8042" />
        <Path
          d="M7.55556 3C6.61256 3 5.70819 3.37928 5.0414 4.05442C4.3746 4.72955 4 5.64522 4 6.6V17.4C4 18.3548 4.3746 19.2705 5.0414 19.9456C5.70819 20.6207 6.61256 21 7.55556 21H20V3H7.55556ZM11.1111 5.7H17.3333V7.5H11.1111V5.7ZM5.77778 17.4C5.77778 16.9226 5.96508 16.4648 6.29848 16.1272C6.63187 15.7896 7.08406 15.6 7.55556 15.6H18.2222V19.2H7.55556C7.08406 19.2 6.63187 19.0104 6.29848 18.6728C5.96508 18.3352 5.77778 17.8774 5.77778 17.4Z"
          fill="#B3B56C"
        />
      </G>
      <Defs>
        <ClipPath id="clip-book">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  cafe: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fillRule="evenodd" clipPath="url(#a)" clipRule="evenodd">
        <Path
          fill="#6A8042"
          d="M5 10h14.4c.955 0 1.87.383 2.546 1.065A3.655 3.655 0 0 1 23 13.636c0 .965-.38 1.89-1.054 2.572a3.582 3.582 0 0 1-2.546 1.065H18V20H5V10Zm13 5.454v-3.636h1.4c.477 0 .935.192 1.273.533a1.828 1.828 0 0 1 0 2.571 1.79 1.79 0 0 1-1.273.532H18Z"
        />
        <Path
          fill="#B3B56C"
          d="M9.515 4.667a.752.752 0 0 0-.55.244.864.864 0 0 0-.228.589c0 .221.082.433.228.59a.752.752 0 0 0 .55.243V8a2.257 2.257 0 0 1-1.65-.732A2.594 2.594 0 0 1 7.182 5.5c0-.663.246-1.299.683-1.768A2.257 2.257 0 0 1 9.515 3v1.667Zm3.89.833c0-.221.081-.433.227-.59a.753.753 0 0 1 .55-.243V3c-.306 0-.61.065-.893.19-.283.126-.54.31-.757.542a2.517 2.517 0 0 0-.506.811 2.655 2.655 0 0 0 0 1.914c.117.303.29.579.506.81.217.233.474.417.757.543.283.125.587.19.893.19V6.333a.753.753 0 0 1-.55-.244.865.865 0 0 1-.228-.589Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-cafe">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  calendar: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#D5D5D5" d="M3 5h18v13H3V5Z" />
        <Path stroke="#2C81E5" strokeWidth={2} d="M3 6h18" />
        <Path stroke="#D5D5D5" strokeWidth={2} d="M18 3v3M6 3v3" />
        <Path
          fill="#ACACAC"
          d="M5 9h2v2H5zM5 13h2v2H5zM9 9h2v2H9zM9 13h2v2H9zM13 9h2v2h-2zM13 13h2v2h-2zM17 9h2v2h-2zM17 13h2v2h-2z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-calendar">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  camera: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#6A8042"
          d="M8.256 2h7.488l1.363 2.842H22V20H2V4.842h4.893L8.256 2Z"
        />
        <Circle cx={12} cy={12} r={5} fill="#fff" />
        <Circle cx={12} cy={12} r={3} fill="#6A8042" />
        <Circle cx={20} cy={7} r={1} fill="#fff" />
      </G>
      <Defs>
        <ClipPath id="clip-camera">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  clock: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#6A8042"
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        />
        <Path fill="#6A8042" d="M12 7v5.25L16 14" />
        <Path stroke="#fff" strokeWidth={2} d="M12 7v5.25L16 14" />
      </G>
      <Defs>
        <ClipPath id="clip-clock">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>

  ),
  heart: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#6A8042"
          d="m12 21-1.45-1.295C5.4 15.125 2 12.093 2 8.395 2 5.364 4.42 3 7.5 3c1.74 0 3.41.795 4.5 2.04A6.062 6.062 0 0 1 16.5 3C19.58 3 22 5.364 22 8.395c0 3.698-3.4 6.73-8.55 11.31L12 21Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-heart">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
  </Svg>
  ),
  home: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#B3B56C" d="m7 20 5-7 5 7H7Z" />
        <Path
          fill="#6A8042"
          d="M2 21v-4.65l8.75-11.8L9 2.2 10.6 1 12 2.875 13.4 1 15 2.2l-1.75 2.35L22 16.35V21H2Zm6.225-2h7.55L12 13.725 8.225 19Z"
        />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  journey: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#B3B56C" d="M4 20h10.91L20 14.91V4H4v16Z" />
        <Path
          fill="#6A8042"
          d="M14.91 14.91V20L20 14.91h-5.09ZM11 13v-3l8.13-8L22 5l-8.13 8H11Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-journey">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  location: ({ width = 24, height = 24, color = "#B3B56C", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <Circle cx={12} cy={10} r={3} fill="#fff" />
      <Path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 1 1 16 0Z"
        fill={color}
      />
      <Path fill="#fff" d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </Svg>
  ),
  map: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#B3B56C"
          d="M8.667 20 2 17.507V3l6.667 2.267L15.333 3 22 4.587V20l-6.667-1.133L8.667 20Z"
        />
        <Path fill="#6A8042" d="M8.667 5.267 15.333 3v15.867L8.667 20V5.267Z" />
      </G>
      <Defs>
        <ClipPath id="clip-map">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  park: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#B3B56C" d="M10 16h4v6h-4z" />
        <Path fill="#6A8042" d="m3 18 4-6H5l7-10 7 10h-2l4 6H3Z" />
      </G>
      <Defs>
        <ClipPath id="clip-park">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  photo: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#B3B56C" d="M2 17V4h16v13H2Z" />
        <Path fill="#6A8042" d="M5 20V7h16v13H5Z" />
        <Circle cx={18} cy={10} r={1} fill="#F5F5F5" />
        <Path fill="#fff" d="m11 12-4 6h8l-4-6Z" />
        <Path fill="#fff" d="M16.5 14 14 18h5l-2.5-4Z" />
      </G>
      <Defs>
        <ClipPath id="clip-photo">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  profile: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fill="#6A8042" clipPath="url(#a)">
        <Path d="M12 20c2.233 0 4.125-.775 5.675-2.325C19.225 16.125 20 14.233 20 12c0-.4-.025-.787-.075-1.162a4.861 4.861 0 0 0-.275-1.088 9.093 9.093 0 0 1-2.15.25 9.786 9.786 0 0 1-4.3-.975A9.983 9.983 0 0 1 9.75 6.3a9.868 9.868 0 0 1-2.287 3.388A9.746 9.746 0 0 1 4 11.85V12c0 2.233.775 4.125 2.325 5.675C7.875 19.225 9.767 20 12 20Zm0 2a9.744 9.744 0 0 1-3.9-.787 10.083 10.083 0 0 1-3.175-2.138c-.9-.9-1.612-1.959-2.137-3.175A9.75 9.75 0 0 1 2 12c0-1.384.262-2.684.788-3.9a10.152 10.152 0 0 1 2.137-3.175A10.04 10.04 0 0 1 8.1 2.788 9.787 9.787 0 0 1 12 2a9.696 9.696 0 0 1 3.9.788 10.13 10.13 0 0 1 3.175 2.137A10.105 10.105 0 0 1 21.213 8.1 9.688 9.688 0 0 1 22 12a9.816 9.816 0 0 1-.788 3.9 10.002 10.002 0 0 1-2.137 3.175c-.901.898-1.96 1.61-3.175 2.138A9.645 9.645 0 0 1 12 22Z" />
        <Circle cx={8} cy={13} r={1} />
        <Circle cx={16} cy={13} r={1} />
      </G>
      <Defs>
        <ClipPath id="clip-profile">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  restaurant: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fill="#6A8042" clipPath="url(#a)">
        <Path d="M6 12.947c-.53 0-1.04-.188-1.414-.524A1.7 1.7 0 0 1 4 11.158V4h2v4.474h1V4h2v4.474h1V4h2V11.158c0 .475-.21.93-.586 1.265a2.125 2.125 0 0 1-1.414.524V21H6v-8.053ZM20 13.842V21h-4v-5.368h-2V6.684c0-.712.316-1.394.879-1.898A3.188 3.188 0 0 1 17 4h3v9.842Z" />
      </G>
      <Defs>
        <ClipPath id="clip-restaurant">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  search: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#2C81E5" strokeWidth={2} clipPath="url(#a)">
        <Path
          fill="#ACCDFF"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
        />
        <Path d="m21 21-4.5-4.5" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  shop: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
    <G clipPath="url(#a)">
      <Path fill="#B3B56C" d="M9 12h11v8H9zM4 12h3v8H4z" />
      <Path fill="#6A8042" d="M5.813 4h12.375L21 9.79V15H3V9.79L5.813 4Z" />
      <Path fill="#FFFADD" d="M6 11h2v4H6v-4ZM11 11h2v4h-2zM16 11h2v4h-2z" />
    </G>
    <Defs>
      <ClipPath id="clip-shop">
        <Path fill="#fff" d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>

  ),

  heart_inactive: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#D4D4D4"
          d="m12 21-1.45-1.295C5.4 15.125 2 12.093 2 8.395 2 5.364 4.42 3 7.5 3c1.74 0 3.41.795 4.5 2.04A6.062 6.062 0 0 1 16.5 3C19.58 3 22 5.364 22 8.395c0 3.698-3.4 6.73-8.55 11.31L12 21Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-heart_inactive">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  home_inactive: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#D4D4D4" d="m7 20 5-7 5 7H7Z" />
        <Path
          fill="#AFAFAF"
          d="M2 21v-4.65l8.75-11.8L9 2.2 10.6 1 12 2.875 13.4 1 15 2.2l-1.75 2.35L22 16.35V21H2Zm6.225-2h7.55L12 13.725 8.225 19Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-home_inactive">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  journey_inactive: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
      <Path fill="#D4D4D4" d="M4 20h10.91L20 14.91V4H4v16Z" />
      <Path
        fill="#AFAFAF"
        d="M14.91 14.91V20L20 14.91h-5.09ZM11 13v-3l8.13-8L22 5l-8.13 8H11Z"
      />
      </G>
      <Defs>
        <ClipPath id="clip-journey_inactive">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  map_inactive: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
      <Path
        fill="#D4D4D4"
        d="M8.667 20 2 17.507V3l6.667 2.267L15.333 3 22 4.587V20l-6.667-1.133L8.667 20Z"
      />
      <Path fill="#AFAFAF" d="M8.667 5.267 15.333 3v15.867L8.667 20V5.267Z" />
      </G>
      <Defs>
        <ClipPath id="clip-map_inactive">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  profile_inactive: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fill="#D4D4D4" clipPath="url(#a)">
      <Path d="M12 20c2.233 0 4.125-.775 5.675-2.325C19.225 16.125 20 14.233 20 12c0-.4-.025-.787-.075-1.162a4.861 4.861 0 0 0-.275-1.088 9.096 9.096 0 0 1-2.15.25 9.786 9.786 0 0 1-4.3-.975A9.983 9.983 0 0 1 9.75 6.3a9.868 9.868 0 0 1-2.287 3.388A9.746 9.746 0 0 1 4 11.85V12c0 2.233.775 4.125 2.325 5.675C7.875 19.225 9.767 20 12 20Zm0 2a9.744 9.744 0 0 1-3.9-.787 10.083 10.083 0 0 1-3.175-2.138c-.9-.9-1.612-1.959-2.137-3.175A9.75 9.75 0 0 1 2 12c0-1.384.262-2.684.788-3.9a10.152 10.152 0 0 1 2.137-3.175A10.04 10.04 0 0 1 8.1 2.788 9.787 9.787 0 0 1 12 2a9.696 9.696 0 0 1 3.9.788 10.13 10.13 0 0 1 3.175 2.137A10.105 10.105 0 0 1 21.213 8.1 9.688 9.688 0 0 1 22 12a9.816 9.816 0 0 1-.788 3.9 10.002 10.002 0 0 1-2.137 3.175c-.901.898-1.96 1.61-3.175 2.138A9.645 9.645 0 0 1 12 22Z" />
      <Circle cx={8} cy={13} r={1} />
      <Circle cx={16} cy={13} r={1} />
      </G>
      <Defs>
        <ClipPath id="clip-profile_inactive">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),

  bookmark: ({ width = 24, height = 24, strokeColor = "#000", fillColor = "none", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        d="M20 3v16.426l-7.575-3.554-.425-.2-.425.2L4 19.426V3h16Z"
        stroke={strokeColor}       
        strokeWidth={2}
        fill={fillColor}          
      />
    </Svg>
  ),
  circle_check: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
      />
      <Path d="M8 10.575 11.385 14 16 9" />
      </G>
      <Defs>
        <ClipPath id="clip-circle-check">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  circle_check2: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path d="M21 11.177v.828a9 9 0 1 1-5.337-8.226" />
        <Path d="m21 5-8.5 8.5L8 9" />
      </G>
      <Defs>
        <ClipPath id="cliip-circle-check2">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  circle_close: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        />
        <Path d="m8 8 8 8M16 8l-8 8" />
      </G>
      <Defs>
        <ClipPath id="clip-circle-close">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  circle: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        />
      </G>
      <Defs>
        <ClipPath id="clip-circle">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  close: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path d="m4 4 16 16M20 4 4 20" />
      </G>
      <Defs>
        <ClipPath id="clip-close">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  double_left_arrow: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path d="m13 21-8-9 8-9" />
        <Path d="m19 21-8-9 8-9" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  down_arrow: ({ width = 24, height = 24, style, ...props}) => (
    <Svg width={width}
      height={height}
      viewBox="0 0 24 24"
      style={style}
      {...props}
      fill="none">
      <Path stroke="#000" strokeWidth={2} d="m21 8-9 8-9-8" />
    </Svg>
  ),
  home_header: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path strokeLinecap="round" d="m3 9 9-7 9 7v13.5H3V9Z" />
        <Path d="M9 22V12h6v10" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  left_arrow: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path stroke="#000" strokeWidth={2} d="m16 21-8-9 8-9" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  menu: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <Path stroke="#000" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  ),
  notification: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <Defs>
        <ClipPath id="clip">
          <Path d="M12 3c4.142 0 7.5 3.134 7.5 7v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8c0-3.866 3.358-7 7.5-7Z" />
        </ClipPath>
      </Defs>

      <G clipPath="url(#clip)">
        <Path
          fill="#000"
          d="M12 3v2c3.17 0 5.5 2.366 5.5 5h4c0-5.098-4.386-9-9.5-9v2Zm7.5 7h-2v8h4v-8h-2Zm-1 9v-2h-13v4h13v-2Zm-14-1h2v-8h-4v8h2Zm0-8h2c0-2.634 2.33-5 5.5-5V1c-5.114 0-9.5 3.902-9.5 9h2Zm1 9v-2a1 1 0 0 1 1 1h-4a3 3 0 0 0 3 3v-2Zm14-1h-2a1 1 0 0 1 1-1v4a3 3 0 0 0 3-3h-2Z"
        />
      </G>

      <Path
        stroke="#000"
        strokeWidth={2}
        d="M14.5 19.5c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2"
      />
    </Svg>
  ),
  options: ({ width = 24, height = 24, stroke = "none", fill = "#000", ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...props}>
      <G fill={fill}>
        <Circle cx={12} cy={5} r={1.5} />
        <Circle cx={12} cy={12} r={1.5} />
        <Circle cx={12} cy={19} r={1.5} />
      </G>
    </Svg>
  ),
  previous: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path d="M21 12H5M12 21l-8-9 8-9" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  refresh: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path d="M3 6v5h5M21 18v-5h-5" />
        <Path d="M18.946 9.333a8.072 8.072 0 0 0-2.05-3.312 7.174 7.174 0 0 0-3.266-1.824 6.797 6.797 0 0 0-3.672.118 7.266 7.266 0 0 0-3.162 2.03L3 10.222m18 3.556-3.796 3.877a7.265 7.265 0 0 1-3.163 2.03 6.797 6.797 0 0 1-3.67.118 7.174 7.174 0 0 1-3.267-1.824 8.072 8.072 0 0 1-2.05-3.312" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  reset: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G stroke="#000" strokeWidth={2} clipPath="url(#a)">
        <Path d="M4 4v6h6" />
        <Path d="M5 14.658a8.038 8.038 0 0 0 3.204 4.002 8.416 8.416 0 0 0 5.035 1.327 8.368 8.368 0 0 0 4.846-1.88 7.965 7.965 0 0 0 2.71-4.332 7.79 7.79 0 0 0-.514-5.045A8.092 8.092 0 0 0 16.75 5a8.44 8.44 0 0 0-5.131-.921C9 4.436 7.857 5.714 6.714 6.858" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  star: ({ width = 16, height = 16, ...props}) => (
    <Svg width={16} height={16} fill="none" {...props}>
      <Path
        fill="#EE7A13"
        d="M7.103 1.817a1 1 0 0 1 1.794 0l1.221 2.475a1 1 0 0 0 .753.548l2.732.397a1 1 0 0 1 .555 1.705L12.18 8.87a1 1 0 0 0-.288.885l.467 2.721a1 1 0 0 1-1.451 1.054l-2.444-1.284a1 1 0 0 0-.93 0L5.09 13.529a1 1 0 0 1-1.45-1.054l.466-2.72a1 1 0 0 0-.288-.886L1.843 6.942a1 1 0 0 1 .554-1.705l2.732-.397a1 1 0 0 0 .753-.548l1.221-2.475Z"
      />
    </Svg>
  ),
  heart_outline: ({ width = 24, height = 24, ...props}) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          stroke="#AFAFAF"
          strokeWidth={2}
          d="M16.5 4C19.047 4 21 5.936 21 8.396c0 1.513-.688 2.973-2.112 4.683-1.436 1.723-3.508 3.57-6.103 5.879v.001l-.785.7-.784-.7-.001-.001-1.847-1.65c-1.745-1.575-3.18-2.937-4.256-4.229C3.687 11.37 3 9.91 3 8.396 3 5.936 4.953 4 7.5 4c1.445 0 2.842.665 3.747 1.7l.753.859.753-.86A5.062 5.062 0 0 1 16.5 4Z"
        />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  checkbox: ({ width = 24, height = 24, ...props}) => (
    <Svg width={10} height={9} fill="none" {...props}>
      <Path stroke="#fff" strokeWidth={2} d="m1 4.35 2.333 2.4L8.5 1.5" />
    </Svg>
  ),
  comment_fill: ({ width = 24, height = 24, ...props}) => (
    <Svg width={22} height={22} fill="none" {...props}>
      <Path
        fill="#D4D4D4"
        d="M20.167 10.49a8.535 8.535 0 0 1-.917 3.871 8.657 8.657 0 0 1-7.74 4.787 8.535 8.535 0 0 1-3.871-.916l-5.806 1.935 1.935-5.806a8.536 8.536 0 0 1-.916-3.87 8.657 8.657 0 0 1 4.787-7.74 8.535 8.535 0 0 1 3.87-.918h.51a8.637 8.637 0 0 1 8.148 8.149v.509Z"
      />
    </Svg>
  ),
  smile: ({ width = 24, height = 24, ...props}) => (
    <Svg width={22} height={22} fill="none" {...props}>
      <Path
        fill="#D4D4D4"
        d="M11 20.167a9.167 9.167 0 1 0 0-18.334 9.167 9.167 0 0 0 0 18.334Z"
      />
      <Path
        stroke="#F4F4F4"
        strokeLinejoin="round"
        strokeWidth={1.664}
        d="M7.333 12.833S8.708 14.667 11 14.667s3.667-1.834 3.667-1.834"
      />
      <Path
        stroke="#F4F4F4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.664}
        d="M8.25 8.25h.01M13.75 8.25h.01"
      />
    </Svg>
  ),
};

const Icon = ({ name, width, height, style, ...props }) => {
  if (!icons[name]) {
    console.warn(`Icon "${name}" does not exist`);
    return null;
  }
  const SvgIcon = icons[name];
  return <SvgIcon width={width} height={height} style={style} {...props} />;
};

export default Icon;