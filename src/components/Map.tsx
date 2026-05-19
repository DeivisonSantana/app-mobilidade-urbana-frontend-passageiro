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
  // 🔹 Atualizado: Agora aceita receber também o nome formatado do endereço por parâmetro opcional
  onUserLocationFound?: (region: Region, addressName?: string) => void;
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

  // 🗺️ Executa em paralelo de fundo e evita lentidão na UI/Processamento principal do mapa
  const fetchAddressInBackground = async (lat: number, lon: number, currentRegion: Region) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      let formattedAddress = "Localização Atual";

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        console.log(address, 'addressaddressaddress')
        const rua = address.street || "";
        const numero = address.streetNumber ? `, ${address.streetNumber}` : "";
        formattedAddress = rua ? `${rua}${numero}` : (address.district || "Minha Localização");
      }

      console.log("⚡ Endereço resolvido em background:", formattedAddress);

      // Injeta o formattedAddress dentro do objeto de região atualizado
      const updatedRegionWithAddress = {
        ...currentRegion,
        formattedAddress: formattedAddress,
      };

      console.log("📦 Location atualizado com formattedAddress:", updatedRegionWithAddress);
      
      // 🔹 CORREÇÃO AQUI: Salva no cache contendo o formattedAddress injetado!
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updatedRegionWithAddress));

      // Dispara o callback atualizando apenas o texto sem interferir na física do mapa
      if (onUserLocationFound) {
        onUserLocationFound(updatedRegionWithAddress, formattedAddress);
      }

    } catch (error) {
      console.log("Erro na geocodificação reversa em background:", error);
      
      // Mesmo em caso de erro, garante o salvamento para não quebrar os inputs
      const fallbackRegion = { ...currentRegion, formattedAddress: "Localização Atual" };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fallbackRegion));
    }
  };

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
          onUserLocationFound(location, location.formattedAddress || "Localização Atual");
        }

        // Tenta obter o texto do endereço associado ao cache de fundo
        fetchAddressInBackground(location.latitude, location.longitude, location);
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
                
                // Salva no cache inicialmente sem o endereço de texto (será atualizado depois no fetch)
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify(originalRegion));
                
                if (onUserLocationFound) {
                  onUserLocationFound(originalRegion, "Localização Atual");
                }

                // Centraliza no usuário quando o mapa estiver pronto
                if (mapRef.current && isMapReady) {
                  mapRef.current.animateToRegion(userRegion, 1000);
                }
                
                if (isMounted) {
                  setIsLoading(false);
                }

                // Dispara o geocodificador em paralelo sem bloquear a UI principal
                fetchAddressInBackground(originalRegion.latitude, originalRegion.longitude, originalRegion);
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
      // Tentar obter localização novamente se falhar tudo
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
        
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(originalRegion));
        
        // Dispara de fundo
        fetchAddressInBackground(originalRegion.latitude, originalRegion.longitude, originalRegion);
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
      <View style={styles.errorContainer}>
        <MaterialIcons name="location-off" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Permissão de localização necessária</Text>
        <Text style={styles.errorSubtext}>
          Ative a localização nas configurações do seu dispositivo para usar o app
        </Text>
      </View>
    );
  }

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
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#FF3B30",
    fontWeight: "bold",
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  locationButton: {
    position: "absolute",
    bottom: 32,
    right: 16,
    backgroundColor: "white",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
});