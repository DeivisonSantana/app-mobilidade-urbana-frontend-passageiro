// app/home.tsx
import FolhaInferior from "@/components/FolhaInferior";
import Map from "@/components/Map";
import ParaOndeVamos from "@/components/ParaOndeVamos";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Region } from "react-native-maps";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [region, setRegion] = useState<Region | null>(null);
  const [showParaOndeVamos, setShowParaOndeVamos] = useState(false);
  const userInitialRegion = useRef<Region | null>(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState<number>(0);

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
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Verificando autenticação...</Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Map
        region={region}
        onRegionChange={setRegion}
        onUserLocationFound={handleUserLocationFound}
        bottomSheetIndex={bottomSheetIndex}
      />

      <FolhaInferior
        onSheetChange={handleSheetStateChange}
      />

      <ParaOndeVamos
        visible={showParaOndeVamos}
        onClose={() => setShowParaOndeVamos(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
