import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

export default function Splash() {
  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-b from-black to-slate-900">
      <View className="items-center">
        {/* Ícone principal */}
        <View className="mb-6 rounded-full bg-blue-600 p-6">
          <MaterialCommunityIcons name="car" size={80} color="#ffffff" />
        </View>
        
        {/* Animação de carregamento */}
        <View className="flex-row items-center gap-2">
          <View 
            className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"
            
          />
          <View 
            className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"
          
          />
          <View 
            className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"
           
          />
        </View>
      </View>
    </View>
  );
}
