import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SafeScreen = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ 
        // paddingTop: insets.top, 
        paddingBottom: insets.bottom, 
        paddingLeft: insets.left,
        paddingRight: insets.right,
        flex: 1, 
        backgroundColor: "#FFFFFF" }}>
      {children}
    </View>
  );
};
export default SafeScreen;