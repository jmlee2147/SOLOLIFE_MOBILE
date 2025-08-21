import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function HomePage() {
  const router = useRouter();

  return (
    <View className="items-center justify-center flex-1 bg-white">
      <Text className="mb-6 text-xl font-bold">Home</Text>
      <Button
        title="장소 추천 받기"
        onPress={() => router.push('home/recommend')}
      />
      <View className="h-4" />
      <Button
        title="루트 만들기"
        onPress={() => router.push('home/route')}
      />
    </View>
  );
}