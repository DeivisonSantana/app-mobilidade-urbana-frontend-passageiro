// components/Map.tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Region, UserLocationChangeEvent } from "react-native-maps";

interface MapProps {
  region: Region | null;
  onRegionChange: (region: Region) => void;
  onUserLocationFound?: (region: Region) => void;
  bottomSheetIndex?: number;
}

// Região padrão (São Paulo)
const DEFAULT_REGION: Region = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CACHE_KEY = "@last_user_location";
const OFFSET_LATITUDE = 0.0064;

export default function Map({
  region,
  onRegionChange,
  onUserLocationFound,
  bottomSheetIndex,
}: MapProps) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const userInitialRegion = useRef<Region | null>(null);
  const [mapAdjusted, setMapAdjusted] = useState(false);
  const locationWatchSubscription = useRef<Location.LocationSubscription | null>(null);

  // Carregar localização do cache
  const loadCachedLocation = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const location = JSON.parse(cached);
        console.log("📍 Usando localização em cache:", location);
        
        const cachedRegion: Region = {
          latitude: location.latitude - OFFSET_LATITUDE,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setUserLocation(cachedRegion);
        userInitialRegion.current = location;
        setHasInitialLocation(true);
        
        if (onUserLocationFound) {
          onUserLocationFound(location);
        }
        return true;
      }
    } catch (error) {
      console.log("Erro ao carregar cache:", error);
    }
    return false;
  }, [onUserLocationFound]);

  // Inicialização otimizada
  useEffect(() => {
    let isMounted = true;

    const initializeLocation = async () => {
      try {
        setIsLoading(true);
        
        // Passo 1: Carrega cache imediatamente
        const hasCache = await loadCachedLocation();
        
        if (hasCache && isMounted) {
          setIsLoading(false);
        }

        // Passo 2: Verifica permissão sem solicitar primeiro
        let { status } = await Location.getForegroundPermissionsAsync();
        
        if (status !== "granted") {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
        }

        if (!isMounted) return;

        if (status === "granted") {
          setLocationPermission(true);
          
          // Passo 3: Usa watchPositionAsync para obter localização em tempo real
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (location) => {
              if (!isMounted) return;
              
              const userRegion: Region = {
                latitude: location.coords.latitude - OFFSET_LATITUDE,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };

              const originalRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };

              // Só atualiza se for a primeira localização real
              if (!userInitialRegion.current) {
                setUserLocation(userRegion);
                userInitialRegion.current = originalRegion;
                setHasInitialLocation(true);
                
                // Salva no cache
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify(originalRegion));
                
                if (onUserLocationFound) {
                  onUserLocationFound(originalRegion);
                }

                // Centraliza no usuário quando o mapa estiver pronto
                if (mapRef.current && isMapReady) {
                  mapRef.current.animateToRegion(userRegion, 1000);
                }
                
                if (isMounted) {
                  setIsLoading(false);
                }
              }
            }
          );
          
          locationWatchSubscription.current = subscription;
          
          // Timeout para não ficar carregando para sempre
          setTimeout(() => {
            if (isMounted && !userInitialRegion.current) {
              setIsLoading(false);
            }
          }, 3000);
          
        } else {
          setLocationPermission(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
        setLocationPermission(false);
        setIsLoading(false);
      }
    };

    initializeLocation();

    // Cleanup
    return () => {
      isMounted = false;
      if (locationWatchSubscription.current) {
        locationWatchSubscription.current.remove();
      }
    };
  }, [loadCachedLocation, onUserLocationFound, isMapReady]);

  // Atualizar localização do usuário quando ele se move
  const handleUserLocationChange = (event: UserLocationChangeEvent) => {
    const { coordinate } = event.nativeEvent;
    if (coordinate && userInitialRegion.current) {
      const newUserRegion = {
        latitude: coordinate.latitude - OFFSET_LATITUDE,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setUserLocation(newUserRegion);
    }
  };

  // Centralizar no usuário
  const centerOnUser = async () => {
    console.log("➡️ centerOnUser chamado!");
    if (userInitialRegion.current && mapRef.current) {
      const regionWithOffset = {
        ...userInitialRegion.current,
        latitude: userInitialRegion.current.latitude - OFFSET_LATITUDE,
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

        const newUserRegion = {
          latitude: location.coords.latitude - OFFSET_LATITUDE,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        const originalRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setUserLocation(newUserRegion);
        userInitialRegion.current = originalRegion;
        setHasInitialLocation(true);
        
        if (mapRef.current) {
          mapRef.current.animateToRegion(newUserRegion, 1000);
        }
        
        // Salva no cache
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(originalRegion));
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        Alert.alert("Erro", "Não foi possível obter sua localização");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // BottomSheet adjustment effect
  useEffect(() => {
    if (bottomSheetIndex === undefined || !userInitialRegion.current) return;

    console.log("🗺️ BottomSheet mudou para índice:", bottomSheetIndex);

    if (bottomSheetIndex === 1) {
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
      const initialRegion: Region = {
        ...userInitialRegion.current,
        latitude: userInitialRegion.current.latitude - OFFSET_LATITUDE,
        latitudeDelta: userInitialRegion.current.latitudeDelta ?? 0.01,
        longitudeDelta: userInitialRegion.current.longitudeDelta ?? 0.01,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(initialRegion, 1000);
      }
      setMapAdjusted(false);
    }
  }, [bottomSheetIndex, mapAdjusted]);

  // Se não tem permissão, mostrar erro
  if (locationPermission === false) {
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
            setLocationPermission(null);
            // Recarregar a lógica
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mapa sempre renderizado
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={region || userLocation || DEFAULT_REGION}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={locationPermission === true}
        showsMyLocationButton={false}
        onUserLocationChange={handleUserLocationChange}
        followsUserLocation={false}
        mapType="standard"
        onMapReady={() => setIsMapReady(true)}
      />
      
      {/* Loading overlay - aparece apenas se necessário */}
      {isLoading && !userLocation && (
        <View style={styles.loadingOverlay}>
          <MaterialIcons name="location-searching" size={32} color="#007AFF" />
          <Text style={styles.loadingText}>Buscando localização...</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnUser}
        disabled={isLoading && !userLocation}
      >
        <MaterialIcons
          name="my-location"
          size={24}
          color={isLoading && !userLocation ? "#ccc" : "#007AFF"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
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
  locationButton: {
    position: 'absolute',
    top: 128, // top-32 em pontos
    right: 8, // right-2 em pontos
    borderRadius: 999,
    backgroundColor: 'white',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});