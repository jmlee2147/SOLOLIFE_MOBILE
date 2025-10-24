import React from "react";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Mask,
  Path,
  Rect,
} from "react-native-svg";

const icons = {
  book: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#clip0)">
        <Rect x="5" y="5" width="14" height="15" fill="#62974F" />
        <Path
          d="M7.55556 3C6.61256 3 5.70819 3.37928 5.0414 4.05442C4.3746 4.72955 4 5.64522 4 6.6V17.4C4 18.3548 4.3746 19.2705 5.0414 19.9456C5.70819 20.6207 6.61256 21 7.55556 21H20V3H7.55556ZM11.1111 5.7H17.3333V7.5H11.1111V5.7ZM5.77778 17.4C5.77778 16.9226 5.96508 16.4648 6.29848 16.1272C6.63187 15.7896 7.08406 15.6 7.55556 15.6H18.2222V19.2H7.55556C7.08406 19.2 6.63187 19.0104 6.29848 18.6728C5.96508 18.3352 5.77778 17.8774 5.77778 17.4Z"
          fill="#93B56C"
        />
      </G>
      <Defs>
        <ClipPath id="clip-book">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  cafe: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fillRule="evenodd" clipPath="url(#a)" clipRule="evenodd">
        <Path
          fill="#62974F"
          d="M5 10h14.4c.955 0 1.87.383 2.546 1.065A3.655 3.655 0 0 1 23 13.636c0 .965-.38 1.89-1.054 2.572a3.582 3.582 0 0 1-2.546 1.065H18V20H5V10Zm13 5.454v-3.636h1.4c.477 0 .935.192 1.273.533a1.828 1.828 0 0 1 0 2.571 1.79 1.79 0 0 1-1.273.532H18Z"
        />
        <Path
          fill="#93B56C"
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
  calendar: ({
    width = 24,
    height = 24,
    strokeColor = "#2C81E5",
    ...props
  }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#a)">
        <Path fill="#D5D5D5" d="M3 5h18v13H3V5Z" />
        <Path stroke={strokeColor} strokeWidth={2} d="M3 6h18" />
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
  camera: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#62974F"
          d="M8.256 2h7.488l1.363 2.842H22V20H2V4.842h4.893L8.256 2Z"
        />
        <Circle cx={12} cy={12} r={5} fill="#fff" />
        <Circle cx={12} cy={12} r={3} fill="#62974F" />
        <Circle cx={20} cy={7} r={1} fill="#fff" />
      </G>
      <Defs>
        <ClipPath id="clip-camera">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  clock: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#62974F"
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        />
        <Path fill="#62974F" d="M12 7v5.25L16 14" />
        <Path stroke="#fff" strokeWidth={2} d="M12 7v5.25L16 14" />
      </G>
      <Defs>
        <ClipPath id="clip-clock">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  heart: ({ width = 24, height = 24, color = "#62974F", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#a)">
        <Path
          fill={color}
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
  home: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#93B56C" d="m7 20 5-7 5 7H7Z" />
        <Path
          fill="#62974F"
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
  journey: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#93B56C" d="M4 20h10.91L20 14.91V4H4v16Z" />
        <Path
          fill="#62974F"
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
  location: ({ width = 24, height = 24, color = "#93B56C", ...props }) => (
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
  map: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path
          fill="#93B56C"
          d="M8.667 20 2 17.507V3l6.667 2.267L15.333 3 22 4.587V20l-6.667-1.133L8.667 20Z"
        />
        <Path fill="#62974F" d="M8.667 5.267 15.333 3v15.867L8.667 20V5.267Z" />
      </G>
      <Defs>
        <ClipPath id="clip-map">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  park: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#93B56C" d="M10 16h4v6h-4z" />
        <Path fill="#62974F" d="m3 18 4-6H5l7-10 7 10h-2l4 6H3Z" />
      </G>
      <Defs>
        <ClipPath id="clip-park">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  photo: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#93B56C" d="M2 17V4h16v13H2Z" />
        <Path fill="#62974F" d="M5 20V7h16v13H5Z" />
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
  profile: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fill="#62974F" clipPath="url(#a)">
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
  restaurant: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G fill="#62974F" clipPath="url(#a)">
        <Path d="M6 12.947c-.53 0-1.04-.188-1.414-.524A1.7 1.7 0 0 1 4 11.158V4h2v4.474h1V4h2v4.474h1V4h2V11.158c0 .475-.21.93-.586 1.265a2.125 2.125 0 0 1-1.414.524V21H6v-8.053ZM20 13.842V21h-4v-5.368h-2V6.684c0-.712.316-1.394.879-1.898A3.188 3.188 0 0 1 17 4h3v9.842Z" />
      </G>
      <Defs>
        <ClipPath id="clip-restaurant">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  search: ({ width = 24, height = 24, ...props }) => (
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
  shop: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <G clipPath="url(#a)">
        <Path fill="#93B56C" d="M9 12h11v8H9zM4 12h3v8H4z" />
        <Path fill="#62974F" d="M5.813 4h12.375L21 9.79V15H3V9.79L5.813 4Z" />
        <Path fill="#FFFADD" d="M6 11h2v4H6v-4ZM11 11h2v4h-2zM16 11h2v4h-2z" />
      </G>
      <Defs>
        <ClipPath id="clip-shop">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),

  heart_inactive: ({ width = 24, height = 24, ...props }) => (
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
  home_inactive: ({ width = 24, height = 24, ...props }) => (
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
  journey_inactive: ({ width = 24, height = 24, ...props }) => (
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
  map_inactive: ({ width = 24, height = 24, ...props }) => (
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
  profile_inactive: ({ width = 24, height = 24, ...props }) => (
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

  bookmark: ({
    width = 24,
    height = 24,
    strokeColor = "#000",
    fillColor = "none",
    ...props
  }) => (
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
  circle_check: ({ width = 24, height = 24, color = "#000", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G stroke={color} strokeWidth={2} clipPath="url(#a)">
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
  circle_check2: ({ width = 24, height = 24, ...props }) => (
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
  circle_close: ({ width = 24, height = 24, ...props }) => (
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
  circle: ({ width = 24, height = 24, ...props }) => (
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
  close: ({ width = 24, height = 24, style, color = "#000", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      style={style}
      {...props}
      fill="none"
    >
      <G stroke={color} strokeWidth={2} clipPath="url(#clip-close)">
        <Path d="m4 4 16 16M20 4 4 20" />
      </G>
      <Defs>
        <ClipPath id="clip-close">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  double_left_arrow: ({ width = 24, height = 24, ...props }) => (
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
  down_arrow: ({ width = 24, height = 24, style, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      style={style}
      {...props}
      fill="none"
    >
      <Path stroke="#000" strokeWidth={2} d="m21 8-9 8-9-8" />
    </Svg>
  ),
  home_header: ({ width = 24, height = 24, ...props }) => (
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
  left_arrow: ({
    width = 24,
    height = 24,
    color = "#000",
    flip = false,
    strokeWidth = 2,
    style,
    ...props
  }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      style={[flip && { transform: [{ scaleX: -1 }] }, style]}
      {...props}
    >
      <Path
        d="M16 21L8 12L16 3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  menu: ({ width = 24, height = 24, ...props }) => (
    <Svg width={24} height={24} fill="none" {...props}>
      <Path stroke="#000" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  ),
  notification: ({ width = 24, height = 24, ...props }) => (
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
  options: ({
    width = 24,
    height = 24,
    stroke = "none",
    fill = "#000",
    ...props
  }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...props}>
      <G fill={fill}>
        <Circle cx={12} cy={5} r={1.5} />
        <Circle cx={12} cy={12} r={1.5} />
        <Circle cx={12} cy={19} r={1.5} />
      </G>
    </Svg>
  ),
  previous: ({
    width = 24,
    height = 24,
    flip = false,
    style,
    color = "#000",
    ...props
  }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      style={[flip && { transform: [{ scaleX: -1 }] }, style]}
      {...props}
    >
      <G stroke={color} strokeWidth={2} clipPath="url(#a)">
        <Path d="M21 12H5M12 21l-8-9 8-9" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  refresh: ({ width = 24, height = 24, ...props }) => (
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
  reset: ({ width = 24, height = 24, ...props }) => (
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
  star: ({
    width = 16,
    height = 16,
    color = "#EE7A13", // 기본값은 기존 주황색
    style,
    ...props
  }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16" // 원본 좌표계 지정
      fill="none"
      style={style}
      {...props}
    >
      <Path
        fill={color}
        d="M7.103 1.817a1 1 0 0 1 1.794 0l1.221 2.475a1 1 0 0 0 .753.548l2.732.397a1 1 0 0 1 .555 1.705L12.18 8.87a1 1 0 0 0-.288.885l.467 2.721a1 1 0 0 1-1.451 1.054l-2.444-1.284a1 1 0 0 0-.93 0L5.09 13.529a1 1 0 0 1-1.45-1.054l.466-2.72a1 1 0 0 0-.288-.886L1.843 6.942a1 1 0 0 1 .554-1.705l2.732-.397a1 1 0 0 0 .753-.548l1.221-2.475Z"
      />
    </Svg>
  ),
  heart_outline: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
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
  checkbox: ({ width = 24, height = 24, ...props }) => (
    <Svg width={10} height={9} fill="none" {...props}>
      <Path stroke="#fff" strokeWidth={2} d="m1 4.35 2.333 2.4L8.5 1.5" />
    </Svg>
  ),
  comment_fill: ({ width = 24, height = 24, ...props }) => (
    <Svg width={22} height={22} fill="none" {...props}>
      <Path
        fill="#D4D4D4"
        d="M20.167 10.49a8.535 8.535 0 0 1-.917 3.871 8.657 8.657 0 0 1-7.74 4.787 8.535 8.535 0 0 1-3.871-.916l-5.806 1.935 1.935-5.806a8.536 8.536 0 0 1-.916-3.87 8.657 8.657 0 0 1 4.787-7.74 8.535 8.535 0 0 1 3.87-.918h.51a8.637 8.637 0 0 1 8.148 8.149v.509Z"
      />
    </Svg>
  ),
  smile: ({ width = 24, height = 24, ...props }) => (
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
  location_outline: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        stroke="#6B6B6B"
        d="m12 19.667-.277.416.277.184.277-.184-.277-.416Zm0 0 .277.415h.001l.001-.001.004-.003.015-.01c.012-.008.031-.02.054-.037l.199-.14a20.793 20.793 0 0 0 2.813-2.464C16.883 15.822 18.5 13.534 18.5 11a6.5 6.5 0 0 0-12.992-.322L5.5 11c0 2.534 1.617 4.822 3.137 6.427a20.79 20.79 0 0 0 2.812 2.463c.085.062.152.109.199.141l.054.037.015.01.004.003h.002l.277-.414Z"
      />
      <Path
        stroke="#6B6B6B"
        d="M12.001 8.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
      />
    </Svg>
  ),
  time: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        stroke="#6B6B6B"
        d="M12 5.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Z"
      />
      <Path stroke="#6B6B6B" d="M12 8.4V12l2.1 2.1" />
    </Svg>
  ),
  phone: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        stroke="#6B6B6B"
        d="M9.016 5.5v.001a1.707 1.707 0 0 1 1.672 1.312l.03.153v.005c.071.54.204 1.07.395 1.582a1.702 1.702 0 0 1-.384 1.798l-.002.001-.49.489a9.144 9.144 0 0 0 2.912 2.906l.49-.49.004-.001a1.707 1.707 0 0 1 1.8-.384h-.002c.512.19 1.045.323 1.586.395h.004a1.708 1.708 0 0 1 1.468 1.717h.001v1.805l-.009.177a1.7 1.7 0 0 1-.545 1.086 1.71 1.71 0 0 1-1.306.441h-.01a12.456 12.456 0 0 1-5.424-1.927 12.252 12.252 0 0 1-3.768-3.761 12.404 12.404 0 0 1-1.93-5.44l-.001-.008a1.702 1.702 0 0 1 1.01-1.711c.217-.096.451-.146.688-.146h1.81Z"
      />
    </Svg>
  ),
  price: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        stroke="#6B6B6B"
        d="m16.91 7.5.161.008c.803.08 1.429.759 1.429 1.583v6.546c0 .878-.712 1.59-1.59 1.59H7.09c-.878 0-1.59-.712-1.59-1.59V9.09c0-.879.712-1.591 1.59-1.591h9.82ZM6 11.273h12"
      />
    </Svg>
  ),
  next_circle: ({ width = 53, height = 53, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 53 53"
      fill="none"
      {...props}
    >
      <Path
        fill="#62974F"
        stroke="#62974F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M26.5 1.5c13.807 0 25 11.193 25 25s-11.193 25-25 25-25-11.193-25-25 11.193-25 25-25Z"
      />
      <Path
        stroke="#fff"
        strokeWidth={3}
        d="M15 27h21.333M27 15l10.667 12L27 39"
      />
    </Svg>
  ),
  share: ({ width = 17, height = 17, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 17 17"
      fill="none"
      {...props}
    >
      <Path
        stroke="#000"
        d="M12.75 9.208v5.667H2.125V4.25h5.667M10.625 2.125h4.25v4.25"
      />
      <Path stroke="#000" strokeLinejoin="round" d="m7.083 9.917 7.792-7.792" />
    </Svg>
  ),
  grid: ({ width = 21, height = 21, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 21 21"
      fill="none"
      {...props}
    >
      <Path
        fill="#D4D4D4"
        d="M0 0h9.8v9.8H0V0ZM0 11.2h9.8V21H0v-9.8ZM11.2 0H21v9.8h-9.8V0ZM11.2 11.2H21V21h-9.8v-9.8Z"
      />
    </Svg>
  ),
  list: ({ width = 24, height = 19, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        fill="#D4D4D4"
        d="M0 0h23.385v4.385H0zM0 7.308h23.385v4.385H0zM0 14.615h23.385V19H0z"
      />
    </Svg>
  ),
  triangle: ({ width = 8, height = 8, ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 8 9" fill="none" {...props}>
      <Path fill="#000" d="M0 4.5 7.5.17v8.66L0 4.5Z" />
    </Svg>
  ),
  write: ({ width = 27, height = 26, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 27 26"
      fill="none"
      {...props}
    >
      <Path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.67}
        d="M13.338 24.47h12.338M19.507 1.852a2.908 2.908 0 1 1 4.112 4.112L6.483 23.1 1 24.47l1.37-5.483L19.508 1.852Z"
      />
    </Svg>
  ),
  search_outline: ({ width = 21, height = 20, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 21 20"
      fill="none"
      {...props}
    >
      <Path
        stroke="#AFAFAF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.535 14.167c3.3 0 5.974-2.612 5.974-5.834 0-3.221-2.675-5.833-5.974-5.833-3.3 0-5.975 2.612-5.975 5.833 0 3.222 2.675 5.834 5.975 5.834Z"
      />
      <Path stroke="#AFAFAF" strokeWidth={2} d="m17.923 17.5-5.121-5" />
    </Svg>
  ),
  camera_outline: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#a)">
        <Path
          stroke="#000"
          strokeWidth={2}
          d="m15.486 4 1.229 2.587.271.571H22V22H2V7.158h5.014l.271-.571L8.514 4h6.972Z"
        />
        <Circle
          cx={12.078}
          cy={14.078}
          r={4.033}
          stroke="#000"
          strokeWidth={2}
        />
        <Circle cx={18.118} cy={11.059} r={1.007} fill="#000" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  gallery_outline: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#a)">
        <Path stroke="#000" strokeWidth={2} d="M21.863 7v15h-20V7h20Z" />
        <Circle cx={17.523} cy={10.837} r={1.052} fill="#000" />
        <Path fill="#000" d="M9.638 13.078 5.49 19.3h8.296l-4.148-6.222Z" />
        <Path fill="#000" d="M15.114 14.908 12.37 19.3h5.49l-2.745-4.392Z" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  lock: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G stroke="#000" clipPath="url(#a)">
        <Path strokeWidth={2} d="M1.65 9.053h20.367v14.105H1.65z" />
        <Circle cx={11.833} cy={15.658} r={1} fill="#000" strokeWidth={0.684} />
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.833 1.79c-2.718 0-4.92 1.891-4.92 4.225v2.932h9.84V6.015c0-2.334-2.202-4.225-4.92-4.225Z"
        />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  happy: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G
        stroke="#62974F"
        strokeLinejoin="round"
        strokeWidth={2}
        clipPath="url(#a)"
      >
        <Path
          strokeLinecap="round"
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        />
        <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <Path strokeLinecap="round" d="M9 9h.01M15 9h.01" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  funny: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G stroke="#62974F" strokeWidth={2} clipPath="url(#a)">
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10ZM9 9h.01M15 9h.01"
        />
        <Path d="M15 12H9s.723 5 3 5 3-5 3-5Z" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  sad: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#a)">
        <Path
          stroke="#62974F"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        />
        <Path
          fill="#62974F"
          d="M6.136 13c-.5-1 .5-2.5 1-3 .5.5 1.5 2 1 3-.357.714-1.5 1-2 0Z"
        />
        <Path
          stroke="#62974F"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 9h.01M15 9h.01"
        />
        <Path
          stroke="#62974F"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 17s-1.5-2-4-2-4 2-4 2"
        />
      </G>
    </Svg>
  ),
  surprise: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G stroke="#62974F" strokeWidth={2} clipPath="url(#a)">
        <Path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10ZM9 9h.01M15 9h.01"
        />
        <Ellipse cx={12} cy={14.5} rx={2} ry={2.5} />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  warn: ({ width = 22, height = 22, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 22 22"
      fill="none"
      {...props}
    >
      <Circle cx={10.522} cy={10.522} r={10.522} fill="#EE7A13" />
      <Path
        stroke="#fff"
        strokeWidth={2.104}
        d="M10.523 4.209v8.418M10.523 14.731v2.105"
      />
    </Svg>
  ),

  success: ({ width = 22, height = 22, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 22 22"
      fill="none"
      {...props}
    >
      <Circle cx={10.523} cy={10.522} r={10.522} fill="#EE7A13" />
      <Path
        stroke="#fff"
        strokeWidth={2.166}
        d="m4.952 9.904 4.951 4.023 6.809-7.118"
      />
    </Svg>
  ),
  star_outline: ({ width = 16, height = 16, color = "#000", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <Path
        stroke={color}
        strokeWidth={0.87}
        d="M7.493 2.01a.565.565 0 0 1 1.014 0l1.222 2.475c.209.424.613.717 1.08.785l2.732.397a.565.565 0 0 1 .313.964l-1.977 1.927c-.338.33-.492.805-.412 1.27l.466 2.72a.565.565 0 0 1-.82.597l-2.443-1.286a1.436 1.436 0 0 0-1.336 0l-2.443 1.286a.565.565 0 0 1-.82-.596l.466-2.72c.08-.466-.074-.942-.412-1.271L2.146 6.63a.565.565 0 0 1 .313-.964l2.732-.397c.468-.068.871-.361 1.08-.785L7.493 2.01Z"
      />
    </Svg>
  ),
  share2: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        stroke="#AFAFAF"
        strokeWidth={2}
        d="M18.222 12.889V20H4V5.778h7.111M13.778 10.222 20 4M14.667 4H20v5.333"
      />
    </Svg>
  ),
  edit: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G clipPath="url(#a)">
        <Path
          fill="#000"
          d="m2.83 13.047 3.987 3.987L16.44 7.41l-3.987-3.987zM12.75 3.14l3.91 3.91 1.132-1.132-3.91-3.91zM6.535 17.315l-3.91-3.91-.592 4.503 4.502-.593Z"
        />
        <Path
          stroke="#000"
          strokeLinecap="square"
          strokeWidth={2}
          d="M3 20h18"
        />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  check_active: ({ width = 23, height = 23, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 23 23"
      fill="none"
      {...props}
    >
      <G strokeWidth={2.444} clipPath="url(#a)">
        <Path
          fill="#62974F"
          stroke="#62974F"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.5 19.75a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Z"
        />
        <Path stroke="#FFF" d="m7.834 10.194 3.103 3.14 4.23-4.584" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M.5.5h22v22H.5z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  check_inactive: ({ width = 23, height = 23, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 23 23"
      fill="none"
      {...props}
    >
      <G strokeWidth={2.444} clipPath="url(#a)">
        <Path
          fill="#fff"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.5 19.75a8.25 8.25 0 1 0 0-16.5 8.25 8.25 0 0 0 0 16.5Z"
        />
        <Path stroke="#D4D4D4" d="m7.834 10.194 3.103 3.14 4.23-4.584" />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M.5.5h22v22H.5z" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  plus_circle: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path stroke="#AFAFAF" d="M11.933 6.6v10.666M17.266 11.933H6.6" />
      <Path
        stroke="#AFAFAF"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18A8.485 8.485 0 1 0 18 6 8.485 8.485 0 0 0 6 18Z"
      />
    </Svg>
  ),
  gacha: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G filter="url(#a)">
        <Mask id="b" fill="#fff">
          <Path d="m21.084 4.017 2.008 2.009v7.029H3.008v-7.03l2.01-2.008h16.066Z" />
        </Mask>
        <Path
          fill="#62974F"
          d="m21.084 4.017 2.008 2.009v7.029H3.008v-7.03l2.01-2.008h16.066Z"
        />
        <Path
          fill="#93B56C"
          d="m21.084 4.017 1.06-1.06-.44-.44h-.62v1.5Zm2.008 2.009h1.5v-.622l-.44-.44-1.06 1.062Zm0 7.029v1.5h1.5v-1.5h-1.5Zm-20.084 0h-1.5v1.5h1.5v-1.5Zm0-7.03-1.06-1.06-.44.44v.62h1.5Zm2.01-2.008v-1.5h-.622l-.44.44 1.061 1.06Zm16.066 0-1.061 1.06 2.009 2.01 1.06-1.061 1.06-1.061-2.008-2.009-1.06 1.06Zm2.008 2.009h-1.5v7.029h3v-7.03h-1.5Zm0 7.029v-1.5H3.008v3h20.084v-1.5Zm-20.084 0h1.5v-7.03h-3v7.03h1.5Zm0-7.03L4.07 7.087l2.009-2.009-1.06-1.06-1.062-1.06-2.008 2.008 1.06 1.06Zm2.01-2.008v1.5h16.066v-3H5.017v1.5Z"
          mask="url(#b)"
        />
        <Path fill="#93B56C" d="M23.092 20.084H3.008v-9.038h20.084v9.038Z" />
        <Path fill="#62974F" d="M3.008 11.046h20.084v2.008H3.008z" />
        <Path fill="#62974F" d="M10.038 12.05h6.025v4.017h-6.025V12.05Z" />
        <Circle cx={13.05} cy={14.059} r={1.004} fill="#93B56C" />
      </G>
      <Defs></Defs>
    </Svg>
  ),
  gacha_inactive: ({ width = 24, height = 24, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G filter="url(#a)">
        <Mask id="b" fill="#fff">
          <Path d="m21.084 4.017 2.008 2.009v7.029H3.008v-7.03l2.01-2.008h16.066Z" />
        </Mask>
        <Path
          fill="#AFAFAF"
          d="m21.084 4.017 2.008 2.009v7.029H3.008v-7.03l2.01-2.008h16.066Z"
        />
        <Path
          fill="#D4D4D4"
          d="m21.084 4.017 1.06-1.06-.44-.44h-.62v1.5Zm2.008 2.009h1.5v-.622l-.44-.44-1.06 1.062Zm0 7.029v1.5h1.5v-1.5h-1.5Zm-20.084 0h-1.5v1.5h1.5v-1.5Zm0-7.03-1.06-1.06-.44.44v.62h1.5Zm2.01-2.008v-1.5h-.622l-.44.44 1.061 1.06Zm16.066 0-1.061 1.06 2.009 2.01 1.06-1.061 1.06-1.061-2.008-2.009-1.06 1.06Zm2.008 2.009h-1.5v7.029h3v-7.03h-1.5Zm0 7.029v-1.5H3.008v3h20.084v-1.5Zm-20.084 0h1.5v-7.03h-3v7.03h1.5Zm0-7.03L4.07 7.087l2.009-2.009-1.06-1.06-1.062-1.06-2.008 2.008 1.06 1.06Zm2.01-2.008v1.5h16.066v-3H5.017v1.5Z"
          mask="url(#b)"
        />
        <Path fill="#D4D4D4" d="M23.092 20.084H3.008v-9.038h20.084v9.038Z" />
        <Path fill="#AFAFAF" d="M3.008 11.046h20.084v2.008H3.008z" />
        <Path fill="#AFAFAF" d="M10.038 12.05h6.025v4.017h-6.025V12.05Z" />
        <Path
          stroke="#D4D4D4"
          d="M13.05 13.554a.505.505 0 1 1 0 1.01.505.505 0 0 1 0-1.01Z"
        />
      </G>
      <Defs></Defs>
    </Svg>
  ),
  camp: ({ width = 47, height = 35, color = "#D4D4D4", ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 47 35"
      fill="none"
      {...props}
    >
      <Path
        fill={color}
        d="m13.472 4.437 18.826-3.5a.921.921 0 0 1 1 .51L45.15 26.311a.921.921 0 0 1-.53 1.267l-18.451 6.4-13.285-3.52-11.271-2.915a.921.921 0 0 1-.57-1.35L13.471 4.438Z"
      />
      <Path
        stroke="#fff"
        strokeWidth={1.843}
        d="m13.472 4.437 18.826-3.5a.921.921 0 0 1 1 .51L45.15 26.311a.921.921 0 0 1-.53 1.267l-18.451 6.4M13.472 4.437l12.697 29.541M13.472 4.437 1.043 26.193a.921.921 0 0 0 .57 1.35l11.27 2.914m13.286 3.521-13.285-3.52m0 0V18.055"
      />
    </Svg>
  ),
  skip: ({ width = 13, height = 14, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 13 14"
      fill="none"
      {...props}
    >
      <Path fill="#93B56C" d="M12.5 14h-2V0h2v14Zm-2-7L0 13.928V.072L10.5 7Z" />
    </Svg>
  ),
  next_triangle: ({ width = 15, height = 20, ...props }) => (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 15 20"
      fill="none"
      {...props}
    >
      <Path fill="#E7C192" d="M15 9.96 0 19.92V.002L15 9.96Z" />
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
