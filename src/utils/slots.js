import { OBJECTS } from "@assets/objects";
import { SLOT_ACCEPT } from "@assets/slots/rules";

export function canPlaceObject(key, slot) {
  const obj = OBJECTS[key];
  if (!obj) return false;
  const allowed = SLOT_ACCEPT[slot] ?? [];
  return allowed.includes(obj.group);
}

export function selectableObjectsFor(slot) {
  const allowed = SLOT_ACCEPT[slot] ?? [];
  return Object.entries(OBJECTS)
    .filter(([, v]) => allowed.includes(v.group))
    .map(([key, v]) => ({ key, ...v })); // { key, src, group, label }
}