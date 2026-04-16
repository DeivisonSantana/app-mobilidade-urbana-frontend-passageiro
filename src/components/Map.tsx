// components/Map.tsx
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Region, UserLocationChangeEvent } from "react-native-maps";

interface MapProps {
  region: Region | null;
  onRegionChange: (region: Region) => void;
  onUserLocationFound?: (region: Region) => void;
  bottomSheetIndex?: number; // 👈 nova prop
}

// Região inicial vazia - será substituída pela localização do usuário
const emptyRegion: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.01, // 🔹 atualizado para manter consistência com home.tsx
  longitudeDelta: 0.01,
};

export default function Map({
  region,
  onRegionChange,
  onUserLocationFound,
  bottomSheetIndex, // 👈 recebendo o valor
}: MapProps) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);

  // 🔹 guarda a região original do usuário para aplicar offsets conforme o BottomSheet
  const userInitialRegion = useRef<Region | null>(null);
  const [mapAdjusted, setMapAdjusted] = useState(false);

  // Solicitar permissão de localização
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        console.log("Solicitando permissão de localização...");

        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          setLocationPermission(true);
          console.log("Permissão concedida, obtendo localização...");

          // Obter localização atual
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          console.log("Localização obtida:", location.coords);

          // 🔹 Aplicando a mesma lógica de offset do home.tsx
          const offsetLatitude = 0.0064;
          const userRegion: Region = {
            latitude: location.coords.latitude - offsetLatitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          userInitialRegion.current = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setUserLocation(userRegion);
          setHasInitialLocation(true);

          // Notificar o componente pai sobre a localização encontrada
          if (onUserLocationFound) {
            onUserLocationFound(userInitialRegion.current);
          }

          // Centralizar no usuário
          if (mapRef.current) {
            mapRef.current.animateToRegion(userRegion, 1000);
          }
        } else {
          console.log("Permissão de localização negada");
          setLocationPermission(false);
          Alert.alert(
            "Localização Necessária",
            "Este app precisa da sua localização para funcionar corretamente. Por favor, permita o acesso à localização nas configurações do seu dispositivo.",
            [{ text: "OK" }],
          );
        }
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        setLocationPermission(false);
        Alert.alert(
          "Erro de Localização",
          "Não foi possível obter sua localização. Verifique se o GPS está ativado.",
          [{ text: "OK" }],
        );
      } finally {
        setIsLoading(false);
        console.log("Loading finalizado");
      }
    })();
  }, [onUserLocationFound]); // Corrigido: incluída a dependência

  // Atualizar localização do usuário quando ele se move
  const handleUserLocationChange = (event: UserLocationChangeEvent) => {
    const { coordinate } = event.nativeEvent;
    if (coordinate) {
      const newUserRegion = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01, // 🔹 atualizado
        longitudeDelta: 0.01,
      };
      setUserLocation(newUserRegion);
    }
  };

  // Centralizar no usuário
  const centerOnUser = async () => {
    console.log("➡️ centerOnUser chamado!");
    if (userInitialRegion.current && mapRef.current) {
      const offsetLatitude = 0.0064;
      const regionWithOffset = {
        ...userInitialRegion.current,
        latitude: userInitialRegion.current.latitude - offsetLatitude,
      };
      mapRef.current.animateToRegion(regionWithOffset, 1000);
    } else if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    } else {
      // Tentar obter localização novamente
      try {
        setIsLoading(true);
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const offsetLatitude = 0.0064;
        const newUserRegion = {
          latitude: location.coords.latitude - offsetLatitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setUserLocation(newUserRegion);
        if (mapRef.current) {
          mapRef.current.animateToRegion(newUserRegion, 1000);
        }
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        Alert.alert("Erro", "Não foi possível obter sua localização");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 👇 NOVO useEffect: reage à mudança de estado do BottomSheet
  useEffect(() => {
    if (bottomSheetIndex === undefined || !userInitialRegion.current) return;

    console.log("🗺️ BottomSheet mudou para índice:", bottomSheetIndex);

    // Índice 1 corresponde ao snap point superior ("80%")
    if (bottomSheetIndex) {
      const largerOffset = 0.045;
      const zoomedLatitudeDelta = 0.055;
      const zoomedLongitudeDelta = 0.055;

      const newRegion: Region = {
        ...userInitialRegion.current,
        latitude: userInitialRegion.current.latitude - largerOffset,
        latitudeDelta: zoomedLatitudeDelta,
        longitudeDelta: zoomedLongitudeDelta,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      setMapAdjusted(true);
    } else if (bottomSheetIndex === 0 && mapAdjusted) {
      const initialOffset = 0.0064;
      const initialRegion: Region = {
        ...userInitialRegion.current,
        latitude: userInitialRegion.current.latitude - initialOffset,
        latitudeDelta: userInitialRegion.current.latitudeDelta ?? 0.01,
        longitudeDelta: userInitialRegion.current.longitudeDelta ?? 0.01,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(initialRegion, 1000);
      }
      setMapAdjusted(false);
    }
  }, [bottomSheetIndex, mapAdjusted]);

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
        <MaterialIcons name="location-searching" size={48} color="#007AFF" />
        <Text style={styles.loadingText}>Obtendo sua localização...</Text>
      </View>
    );
  }

  // Se não tem permissão, mostrar erro
  if (!locationPermission) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
        <MaterialIcons name="location-off" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>
          Permissão de localização necessária
        </Text>
        <Text style={styles.errorSubtext}>
          Ative a localização nas configurações do seu dispositivo para usar o
          app
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            setLocationPermission(false);
            // Recarregar o componente
            setTimeout(() => {
              setIsLoading(false);
            }, 100);
          }}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Se tem permissão mas não conseguiu localização inicial (caso raro)
  if (locationPermission && !hasInitialLocation) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
        <MaterialIcons name="location-disabled" size={48} color="#FF9500" />
        <Text style={styles.errorText}>Não foi possível obter localização</Text>
        <Text style={styles.errorSubtext}>
          Verifique se o GPS está ativado e tente novamente
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={centerOnUser}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={region || userLocation || emptyRegion}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onUserLocationChange={handleUserLocationChange}
        followsUserLocation={false}
        mapType="standard"
      />
      <TouchableOpacity
        className="absolute top-32 bottom-32 right-2 rounded-full bg-white w-12 h-12 items-center justify-center z-20"
        onPress={centerOnUser}
        disabled={isLoading}
      >
        <MaterialIcons
          name="my-location"
          size={24}
          color={isLoading ? "#ccc" : "#007AFF"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    fontWeight: "bold",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
