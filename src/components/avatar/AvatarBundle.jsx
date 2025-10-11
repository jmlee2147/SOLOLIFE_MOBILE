import { characters } from "@assets/characters";
import { OBJECTS } from "@assets/objects";
import { CANVAS, SLOT_LAYOUT, SLOT_SIZES } from "@assets/slots/layout";
import { canPlaceObject } from "@utils/slots";
import React from "react";
import { Image, View } from "react-native";

function FixedImage({ source, slot }) {
  if (!source) return null;
  const { w, h } = SLOT_SIZES[slot];
  const { left, right, top, bottom, z } = SLOT_LAYOUT[slot] || {};
  return (
    <Image
      source={source}
      style={{
        position: "absolute",
        ...(left   !== undefined ? { left }   : {}),
        ...(right  !== undefined ? { right }  : {}),
        ...(top    !== undefined ? { top }    : {}),
        ...(bottom !== undefined ? { bottom } : {}),
        width: w,
        height: h,
        zIndex: z,
      }}
      resizeMode="contain"
    />
  );
}

export default function AvatarBundle({ slots = {} }) {
  const srcBg1 = canPlaceObject(slots.bg1, "bg1") ? OBJECTS[slots.bg1]?.src : null;
  const srcBg2 = canPlaceObject(slots.bg2, "bg2") ? OBJECTS[slots.bg2]?.src : null;
  const srcBg3 = canPlaceObject(slots.bg3, "bg3") ? OBJECTS[slots.bg3]?.src : null;

  const charKey = slots?.character;
  const srcChar = charKey && characters[charKey] ? characters[charKey] : null;

  return (
    <View style={{ width: CANVAS.width, height: CANVAS.height }}>
      <FixedImage source={srcBg1} slot="bg1" />
      <FixedImage source={srcBg2} slot="bg2" />
      <FixedImage source={srcBg3} slot="bg3" />
      <FixedImage source={srcChar} slot="character" />
    </View>
  );
}