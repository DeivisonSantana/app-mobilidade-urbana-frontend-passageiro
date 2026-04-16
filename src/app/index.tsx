import { useAuth } from "@/context/AuthProvider";
import { Redirect } from "expo-router";
import { View } from "react-native";
import Splash from "./splash";

export default function Index() {
  const { user, loading } = useAuth();

  // Enquanto está carregando, mostra splash
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Splash
        />
      </View>
    );
  }

  // Se autenticado, vai para home, senão para login
  return <Redirect href={user ? "/(main)/home" : "/login"} />;
}