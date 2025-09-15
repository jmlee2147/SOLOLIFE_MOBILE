import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Icon from '../../../components/shared/Icon';
import SearchHeader from '../../../components/shared/SearchHeader';

// ---- 간단한 최근 검색 저장소 ----
const RECENT_KEY = 'recent_locations_v1';
async function loadRecent() {
  try { const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveRecent(newItem) {
  try {
    const list = await loadRecent();
    const next = [newItem, ...list.filter(x => x.label !== newItem.label)].slice(0, 10);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}
async function removeRecent(label) {
  try {
    const list = await loadRecent();
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list.filter(x => x.label !== label)));
    return loadRecent();
  } catch { return loadRecent(); }
}

// ---- OSM(Nominatim) 검색(임시) ----
async function geocodeSearch(q) {
  if (!q?.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'ko' }});
  const data = await res.json();
  return (data || []).map(item => ({
    label: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  }));
}

export default function LocationSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => setRecent(await loadRecent()))(); }, []);

  const submitSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const list = await geocodeSearch(q);
      setResults(list);
    } finally { setLoading(false); }
  }, [query]);

  const choose = useCallback(async (item) => {
    await saveRecent(item);
    DeviceEventEmitter.emit('location:selected', item); // ← 기존 이벤트 흐름 유지
    router.back();
  }, [router]);

  const setCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = pos.coords;
      const [geo] = await Location.reverseGeocodeAsync(coords);
      const label = [geo?.city || geo?.region, geo?.district, geo?.name].filter(Boolean).join(' ')
        || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      const item = { label, latitude: coords.latitude, longitude: coords.longitude };
      await saveRecent(item);
      DeviceEventEmitter.emit('location:selected', item);
      router.back();
    } catch {}
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 검색 가능한 전용 헤더 */}
      <SearchHeader
        query={query}
        setQuery={setQuery}
        onSubmit={submitSearch}
        onBack={() => router.back()}
      />
      <View style={styles.headerShadow} pointerEvents="none" />
      <View style={styles.sectionDivider} />

      {/* 검색 바 아래 UI (현 위치 pill + 보조 검색 버튼영역 유지하고 싶으면 유지) */}
      <View style={styles.searchBarWrap}>
        <Pressable onPress={setCurrentLocation} style={styles.currentPill}>
          <Icon name="location" width={24} height={24} color="#EE7A13" />
          <Text className="ml-[6px] text-body-0 font-pretendardMedium">현 위치로 주소 설정하기</Text>
        </Pressable>
      </View>

      {/* 결과 리스트 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(it, i) => `${it.label}-${i}`}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => choose(item)}>
              <Text numberOfLines={2} className="text-body-0 font-pretendardRegular">{item.label}</Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <Text className="text-body-2 font-pretendardMedium text-gray700 pl-[25px] mb-4">최근 검색</Text>
          <FlatList
            data={recent}
            keyExtractor={(it, i) => `${it.label}-${i}`}
            renderItem={({ item }) => (
              <View style={styles.recentRow}>
                <Pressable style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => choose(item)}>
                  <Text numberOfLines={1} className="text-body-0 font-pretendardLight">{item.label}</Text>
                </Pressable>
                <Pressable
                  onPress={async () => setRecent(await removeRecent(item.label))}
                  hitSlop={10}
                >
                  <Icon name="close" width={20} height={20} color="#AFAFAF" />
                </Pressable>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    headerShadow: {
        height: 12,                
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        zIndex: 1,
      },
  sectionDivider: {
    height: 10,
    backgroundColor: '#F4F4F4',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 0,
  },
  searchBarWrap: { paddingHorizontal: 24, paddingTop: 21, paddingBottom: 12 },
  currentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#AFAFAF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginBottom: 12,
  },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12, height: 42,
  },
  input: { flex: 1, marginHorizontal: 8, paddingVertical: 0 },
  searchBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 6 },

  sectionTitle: { paddingHorizontal: 24, paddingVertical: 10, color: '#6B7280' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  rowText: { marginLeft: 8, flex: 1, color: '#111827' },
  recentRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 19,
},
});