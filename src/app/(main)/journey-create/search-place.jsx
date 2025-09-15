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

// 최근 검색
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

// 저장 장소
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

// 검색 API
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
      const list = await geocodeSearch(q);
      setResults(list);
    } finally { setLoading(false); }
  }, [query]);

  const choose = useCallback(async (item) => {
    await saveRecent(item);
    // item.label 전체가 주소일 수 있으니, 적절히 name/address 나눠서 넘겨도 좋고
    // 일단 name: 첫 콤마 앞, address: 전체처럼 보이게 처리 예시
    const [first, ...rest] = String(item.label).split(",");
    const name = first.trim();
    const address = rest.join(",").trim();
  
    router.push({
      pathname: "/journey-create/rate",
      params: {
        savedName: name,
        savedAddress: address,
        savedCategory: "",
      },
    });
  }, [router]);

  const setCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      if (!(await Location.hasServicesEnabledAsync())) return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = pos.coords;
      const [geo] = await Location.reverseGeocodeAsync(coords);
      const label = [geo?.city || geo?.region, geo?.district, geo?.name]
        .filter(Boolean).join(' ')
        || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      const item = { label, latitude: coords.latitude, longitude: coords.longitude };

      await saveRecent(item);
      router.back();
    } catch {}
  }, [router]);

  const renderRow = ({ item }) => (
    <Pressable style={styles.row} onPress={() => choose(item)}>
      <Text numberOfLines={2} className="text-body-0 font-pretendardRegular">{item.label}</Text>
    </Pressable>
  );

  const renderStoredRow = (listType) => ({ item }) => (
    <View style={styles.storedRow}>
      <Pressable style={{ flex: 1 }} onPress={() => choose(item)}>
        <Text numberOfLines={1} className="text-body-0 font-pretendardLight">{item.label}</Text>
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
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 검색 헤더 */}
      <SearchHeader
        query={query}
        setQuery={setQuery}
        onSubmit={submitSearch}
        onBack={() => router.back()}
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
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1,
            height: 4,
          }}
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
          keyExtractor={(it, i) => `${it.label}-${i}`}
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

            <Pressable
              onPress={() => setTab('recent')}
              style={styles.tabBtnLeft}
              hitSlop={8}
            >
              <Text
                onLayout={(e) => setRecentW(e.nativeEvent.layout.width)}
                className={tab === 'recent'
                  ? 'text-black text-heading-2 font-pretendardSemiBold'
                  : 'text-gray500 text-heading-2 font-pretendardSemiBold'}
              >
                최근 검색
              </Text>
              {tab === 'recent' && (
                <View style={[styles.activeUnderline, { width: recentW, left: 25, }]} />
              )}
            </Pressable>

            <Pressable
              onPress={() => setTab('saved')}
              style={styles.tabBtnRight}
              hitSlop={8}
            >
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
  tabBtnLeft: {
    paddingLeft: 25,
    paddingRight: 10,
    position: 'relative',
  },
  tabBtnRight: {
    marginLeft: 25,
    paddingRight: 10,
    position: 'relative',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -10,
    height: 3,
    backgroundColor: '#000',
  },
});