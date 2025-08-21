import { Stack } from 'expo-router'
import { Text, View } from 'react-native'

export default function NotFoundPage() {
  //? Render(s)
  return (
    <>
      <Stack.Screen
        options={{
          title: '404 Not Found!',
          headerBackTitleVisible: false,
        }}
      />
      <View className="flex flex-col items-center justify-center h-full py-8 bg-white gap-y-6">
        <Text className="text-base font-semibold text-black">404 Not Found!</Text>
      </View>
    </>
  )
}