import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function NotFound() {
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
      <Text style={{ fontSize:18, fontWeight:"700", marginBottom:8 }}>페이지를 찾을 수 없습니다.</Text>
      <Link href="/home" style={{ fontSize:16, textDecorationLine:"underline" }}>홈으로 가기</Link>
    </View>
  );
}