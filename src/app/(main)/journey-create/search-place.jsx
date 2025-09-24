import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from '../../../components/shared/Icon';
import SearchHeader from '../../../components/shared/SearchHeader';

// ====== 설정 ======
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

// ====== 최근 검색 ======
const RECENT_KEY = 'recent_locations_v1';
async function loadRecent() {
  try { const raw = await AsyncStorage.getItem(RECENT_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
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
    const next = list.filter(x => x.label !== label);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch { return loadRecent(); }
}

// ====== 저장 장소 ======
const SAVED_KEY = 'saved_locations_v1';
async function loadSaved() {
  try { const raw = await AsyncStorage.getItem(SAVED_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
async function saveToSaved(item) {
  try {
    const list = await loadSaved();
    const next = [item, ...list.filter(x => x.label !== item.label)].slice(0, 50);
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {}
}
async function removeSaved(label) {
  try {
    const list = await loadSaved();
    const next = list.filter(x => x.label !== label);
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
    return next;
  } catch { return loadSaved(); }
}

// ====== 검색 API 교체: GET /search/locations-lite ======
async function locationsLiteSearch(q, page = 1, limit = 20) {
  if (!q?.trim()) return { items: [], page: 1, limit, total: 0 };
  const url = `${API_BASE}/search/locations?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
  console.log('[locationsLiteSearch] GET', url);
  const res = await fetch(url, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } });
  console.log('[locationsLiteSearch] status', res.status);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // 리스트 화면용 경량 스키마 매핑
  const items = (data.items || []).map(({ location_id, title, address }) => ({
    id: location_id,
    title,
    address,
    // label은 로컬 저장/표시에 사용 (고유성 위해 id 포함)
    label: `${title} · ${address}`,
  }));
  return { items, page: data.page, limit: data.limit, total: data.total };
}

export default function LocationSearchScreen() {
  const router = useRouter();

  const [tab, setTab] = useState('recent');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);

  const [recentW, setRecentW] = useState(0);
  const [savedW, setSavedW] = useState(0);

  useEffect(() => { (async () => setRecent(await loadRecent()))(); }, []);
  useEffect(() => { (async () => setSaved(await loadSaved()))(); }, []);

  const submitSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const { items } = await locationsLiteSearch(q, 1, 20);
      setResults(items);
    } catch (e) {
      setResults([]);
    } finally { setLoading(false); }
  }, [query]);

  const choose = useCallback(async (item) => {
    // 백엔드 응답 구조 기반: title / address 사용
    const name = String(item.title || '').trim();
    const address = String(item.address || '').trim();

    await saveRecent({
      // 로컬 저장용 최소 필드
      id: item.id,
      title: name,
      address,
      label: name,
    });

    router.push({
      pathname: "/journey-create/rate",
      params: {
        savedName: name,
        savedAddress: address,
        savedCategory: "",
        // 필요시 location_id 전달
        locationId: String(item.id ?? ''),
      },
    });
  }, [router]);

  const setCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      if (!(await Location.hasServicesEnabledAsync())) return;

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = pos.coords;
      const [geo] = await Location.reverseGeocodeAsync(coords);
      const label = [geo?.city || geo?.region, geo?.district, geo?.name]
        .filter(Boolean).join(' ')
        || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;

      const item = { label, title: label, address: '', id: undefined };
      await saveRecent(item);
      router.back();
    } catch {}
  }, [router]);

  const renderRow = ({ item }) => (
    <Pressable style={styles.row} onPress={() => choose(item)}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} className="text-body-0 font-pretendardMedium">{item.title}</Text>
        <Text numberOfLines={1} className="text-caption-1 font-pretendardLight" style={{ color: '#666' }}>
          {item.address}
        </Text>
      </View>
    </Pressable>
  );

  const renderStoredRow = (listType) => ({ item }) => {
    <View style={styles.storedRow}>
      <Pressable style={{ flex: 1 }} onPress={() => choose(item)}>
        <Text numberOfLines={1} className="text-body-0 font-pretendardLight">{item.name}</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          if (listType === 'recent') setRecent(await removeRecent(item.label));
          else setSaved(await removeSaved(item.label));
        }}
        hitSlop={10}
      >
        <Icon name="close" width={20} height={20} color="#AFAFAF" />
      </Pressable>
    </View>
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 검색 헤더 */}
      <SearchHeader
        query={query}
        setQuery={setQuery}
        onSubmit={submitSearch}
        onBack={() => router.back()}
        rightAction={{
          icon: 'my-location',
          onPress: setCurrentLocation,
          tooltip: '현재 위치로',
        }}
      />

      {/* 헤더 밑 구분 영역 */}
      <View style={{
        height: 10,
        backgroundColor: "#F4F4F4",
        marginTop: 12,
        marginHorizontal: -20,
        overflow: "hidden",
      }}>
        <LinearGradient
          colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 1, height: 4 }}
          pointerEvents="none"
        />
      </View>

      {/* 결과 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(it, i) => `${it.id ?? it.label}-${i}`}
          renderItem={renderRow}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text className="text-gray700 text-body-2 font-pretendardMedium">검색 결과</Text>
            </View>
          )}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* 탭 */}
          <View style={styles.tabWrap}>
            <View style={styles.tabGrayLine} />

            <Pressable onPress={() => setTab('recent')} style={styles.tabBtnLeft} hitSlop={8}>
              <Text
                onLayout={(e) => setRecentW(e.nativeEvent.layout.width)}
                className={tab === 'recent'
                  ? 'text-black text-heading-2 font-pretendardSemiBold'
                  : 'text-gray500 text-heading-2 font-pretendardSemiBold'}
              >
                최근 검색
              </Text>
              {tab === 'recent' && (
                <View style={[styles.activeUnderline, { width: recentW, left: 25 }]} />
              )}
            </Pressable>

            <Pressable onPress={() => setTab('saved')} style={styles.tabBtnRight} hitSlop={8}>
              <Text
                onLayout={(e) => setSavedW(e.nativeEvent.layout.width)}
                className={tab === 'saved'
                  ? 'text-black text-heading-2 font-pretendardSemiBold'
                  : 'text-gray500 text-heading-2 font-pretendardSemiBold'}
              >
                저장 장소
              </Text>
              {tab === 'saved' && (
                <View style={[styles.activeUnderline, { width: savedW }]} />
              )}
            </Pressable>
          </View>

          {/* 목록 */}
          {tab === 'recent' ? (
            <FlatList
              data={recent}
              keyExtractor={(it, i) => `recent-${i}`}
              renderItem={renderStoredRow('recent')}
              contentContainerStyle={{ paddingTop: 27 }}
              ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text className="text-gray400">최근 검색이 없어요.</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={saved}
              keyExtractor={(it, i) => `saved-${i}`}
              renderItem={renderStoredRow('saved')}
              ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text className="text-gray400">저장한 장소가 없어요.</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  sep: { height: 1, backgroundColor: '#E5E5E5', marginLeft: 24 },
  storedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 9,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  tabWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 9,
  },
  tabGrayLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: '#D4D4D4',
  },
  tabBtnLeft: { paddingLeft: 25, paddingRight: 10, position: 'relative' },
  tabBtnRight: { marginLeft: 25, paddingRight: 10, position: 'relative' },
  activeUnderline: { position: 'absolute', bottom: -10, height: 3, backgroundColor: '#000' },
});