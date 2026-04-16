// app/home.tsx
import FolhaInferior from "@/components/FolhaInferior";
import Map from "@/components/Map";
import MenuInferior from "@/components/MenuInferior";
import ParaOndeVamos from "@/components/ParaOndeVamos";
import SideMenu from "@/components/SideMenu";
import { useAuth } from "@/context/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Region } from "react-native-maps";

export default function Home() {
  const { user, loading: authLoading, usuario } = useAuth();
  const router = useRouter();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [abaSelecionanda, setAbaSelecionada] = useState("corrida");
  const [region, setRegion] = useState<Region | null>(null);
  const [showParaOndeVamos, setShowParaOndeVamos] = useState(false);
  const userInitialRegion = useRef<Region | null>(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState<number>(0);
  const drawerWidth = Math.round(Dimensions.get("window").width * 0.78);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: showSideMenu ? 0 : -drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showSideMenu, drawerWidth, translateX]);

  const closeMenu = useCallback(() => {
    setShowSideMenu(false);
  }, []);

  const handleMenuOpen = () => {
    setShowSideMenu(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const handleUserLocationFound = useCallback((userRegion: Region) => {
    userInitialRegion.current = {
      ...userRegion,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    const offsetLatitude = 0.0064;
    const adjustedRegion: Region = {
      ...userRegion,
      latitude: userRegion.latitude - offsetLatitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(adjustedRegion);
  }, []);

  const handleSheetStateChange = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Verificando autenticação...</Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="#fff" />
      <View style={styles.headerFloating}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Pressable onPress={handleMenuOpen} style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=2" }}
                  style={styles.avatarBadge}
                />
              </View>
              <View style={styles.notificationDot} />
            </Pressable>
            <Text style={styles.greetingText}>
              Olá, {usuario?.nome?.split(" ")[0] || "Usuário"}!
            </Text>
          </View>

          <Pressable style={styles.scanButton}>
            <Ionicons name="scan-outline" size={28} color="#000" />
          </Pressable>
        </View>
      </View>

      <Map
        region={region}
        onRegionChange={setRegion}
        onUserLocationFound={handleUserLocationFound}
        bottomSheetIndex={bottomSheetIndex}
      />

      {showSideMenu && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowSideMenu(false)}
        />
      )}

      <SideMenu visible={showSideMenu} onClose={closeMenu} drawerWidth={280} />

      <FolhaInferior
        onPressInput={() => setShowParaOndeVamos(true)}
        onSheetChange={handleSheetStateChange}
      />

      <ParaOndeVamos
        visible={showParaOndeVamos}
        onClose={() => setShowParaOndeVamos(false)}
      />

      <MenuInferior
        abaSelecionanda={abaSelecionanda}
        setAbaSelecionada={setAbaSelecionada}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerFloating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "#BDC3C7",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  scanButton: {
    padding: 8,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
    zIndex: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  avatarBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#eee",
  },
});
