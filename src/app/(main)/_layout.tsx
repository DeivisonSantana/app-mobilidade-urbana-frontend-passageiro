// app/_layout.tsx
import MenuInferior from "@/components/MenuInferior";
import SideMenu from "@/components/SideMenu";
import { useAuth } from "@/context/AuthProvider";
import { UiProvider, useUi } from "@/context/UiContext";
import { Ionicons } from "@expo/vector-icons";
import { Slot, useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Componente interno que usa o UiContext
function MainLayoutContent() {
  const { user } = useAuth();
  const { isModalVisible } = useUi();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const drawerWidth = Math.round(Dimensions.get("window").width * 0.78);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: showSideMenu ? 0 : -drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [showSideMenu, drawerWidth, translateX]);

  const closeMenu = () => {
    setShowSideMenu(false);
  };

  const handleMenuOpen = () => {
    setShowSideMenu(true);
  };

  const router = useRouter();
  const segments = useSegments();
  const [abaSelecionanda, setAbaSelecionada] = useState("corrida");

  useEffect(() => {
    const currentSegment = segments[segments.length - 1];

    if (currentSegment === "entregas") {
      setAbaSelecionada("entrega");
    } else if (currentSegment === "pay") {
      setAbaSelecionada("pay");
    } else {
      setAbaSelecionada("corrida");
    }
  }, [segments]);

  const handleTabPress = (tabKey: string) => {
    if (tabKey === "entrega") {
      router.push("/entregas");
      return;
    }

    if (tabKey === "corrida") {
      router.push("/home");
      return;
    }

    if (tabKey === "pay") {
      router.push("/(payment)/pay");
      return;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header condicional - só aparece se NÃO houver modal visível */}
      {!isModalVisible && (
        <View style={styles.headerFloating}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Pressable onPress={handleMenuOpen} style={styles.avatarContainer}>
                {user?.foto ? (
                  <Image
                    source={{
                      uri: user.foto,
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person-circle" size={40} color="#c4c4c4" />
                  </View>
                )}

                <View style={styles.notificationDot} />
              </Pressable>

              <Text style={styles.greetingText}>
                Olá, {user?.name?.split(" ")[0] || "Usuário"}!
              </Text>
            </View>

            <Pressable style={styles.scanButton}>
              <Ionicons name="scan-outline" size={28} color="#000" />
            </Pressable>
          </View>
        </View>
      )}

      {showSideMenu && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowSideMenu(false)}
        />
      )}

      <SideMenu visible={showSideMenu} onClose={closeMenu} drawerWidth={280} />

      <Slot />

      <MenuInferior
        abaSelecionanda={abaSelecionanda}
        setAbaSelecionada={setAbaSelecionada}
        onPressTab={handleTabPress}
      />
    </View>
  );
}

// Componente principal
export default function RootLayout() {
  return (
    <UiProvider>
      <MainLayoutContent />
    </UiProvider>
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
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
  },

  notificationDot: {
    position: "absolute",
    top: 0.5,
    right: 0.5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 2,
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
});