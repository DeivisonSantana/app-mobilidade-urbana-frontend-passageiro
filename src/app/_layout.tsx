// app/_layout.tsx
import { AuthProvider } from "@/context/AuthProvider";
import "@/styles/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack
         
        >
          <Stack.Screen name="index" options={{
            headerShown: false
          }}/>
          <Stack.Screen name="splash"  options={{
            headerShown: false
          }}/>
          <Stack.Screen name="login"  options={{
            headerShown: false
          }}/>
          <Stack.Screen name="register"  options={{
            headerShown: false
          }} />
          <Stack.Screen name="(main)"  options={{
            headerShown: false
          }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
