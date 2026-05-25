// components/Map.tsx
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MapView, {
  Marker,
  Region,
  UserLocationChangeEvent,
} from "react-native-maps";

import MapViewDirections from "react-native-maps-directions";
interface EnderecoItem {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string;
  order: number;
}

interface MapProps {
  region: Region | null;

  onRegionChange: (
    region: Region,
  ) => void;

  // 🔥 recebe endereço formatado
  onUserLocationFound?: (
    region: Region,
    addressName?: string,
  ) => void;

  bottomSheetIndex?: number;

  // 🔥 NOVO
  itinerario?: EnderecoItem[];

  mapBottomPadding?: number;

}

// Região padrão (São Paulo)
const DEFAULT_REGION: Region = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const CACHE_KEY =
  "@last_user_location";

const OFFSET_LATITUDE = 0.0064;

export default function Map({
  mapBottomPadding = 320,
  region,
  onRegionChange,
  onUserLocationFound,
  bottomSheetIndex,

  // 🔥 NOVO
  itinerario = [],
}: MapProps) {
  const mapRef =
    useRef<MapView>(null);

  const [
    userLocation,
    setUserLocation,
  ] = useState<Region | null>(
    null,
  );

  const [
    locationPermission,
    setLocationPermission,
  ] = useState<
    boolean | null
  >(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    hasInitialLocation,
    setHasInitialLocation,
  ] = useState(false);

  const [isMapReady, setIsMapReady] =
    useState(false);

  const userInitialRegion =
    useRef<Region | null>(null);

  const [mapAdjusted, setMapAdjusted] =
    useState(false);

  const locationWatchSubscription =
    useRef<Location.LocationSubscription | null>(
      null,
    );

  // 🔥 NOVO
  // renderiza rota automaticamente
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    // 🔥 se existir apenas origem
    // volta pro usuário
    if (
      itinerario.length <= 1 &&
      userInitialRegion.current
    ) {
      const offsetLatitude =
        0.0064;

      mapRef.current.animateToRegion(
        {
          ...userInitialRegion.current,
          latitude:
            userInitialRegion.current
              .latitude -
            offsetLatitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800,
      );

      return;
    }

    // 🔥 rota normal
    if (itinerario.length >= 2) {
      const coordinates =
        itinerario.map((item) => ({
          latitude: item.latitude,
          longitude: item.longitude,
        }));

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          coordinates,
          {
            edgePadding: {
              top: 180,
              right: 60,
              bottom:
                mapBottomPadding,
              left: 60,
            },
            animated: true,
          },
        );
      }, 300);
    }
  }, [
    itinerario,
    mapBottomPadding,
  ]);

  // 🗺️ Executa em paralelo
  const fetchAddressInBackground =
    async (
      lat: number,
      lon: number,
      currentRegion: Region,
    ) => {
      try {
        const reverseGeocode =
          await Location.reverseGeocodeAsync(
            {
              latitude: lat,
              longitude: lon,
            },
          );

        let formattedAddress =
          "Localização Atual";

        if (
          reverseGeocode &&
          reverseGeocode.length > 0
        ) {
          const address =
            reverseGeocode[0];

          const rua =
            address.street || "";

          const numero =
            address.streetNumber
              ? `, ${address.streetNumber}`
              : "";

          formattedAddress = rua
            ? `${rua}${numero}`
            : address.district ||
            "Minha Localização";
        }

        const updatedRegionWithAddress =
        {
          ...currentRegion,
          formattedAddress:
            formattedAddress,
        };

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify(
            updatedRegionWithAddress,
          ),
        );

        if (onUserLocationFound) {
          onUserLocationFound(
            updatedRegionWithAddress,
            formattedAddress,
          );
        }
      } catch (error) {
        console.log(
          "Erro na geocodificação reversa:",
          error,
        );

        const fallbackRegion = {
          ...currentRegion,
          formattedAddress:
            "Localização Atual",
        };

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify(
            fallbackRegion,
          ),
        );
      }
    };

  // Carregar cache
  const loadCachedLocation =
    useCallback(async () => {
      try {
        const cached =
          await AsyncStorage.getItem(
            CACHE_KEY,
          );

        if (cached) {
          const location =
            JSON.parse(cached);

          const cachedRegion: Region =
          {
            latitude:
              location.latitude -
              OFFSET_LATITUDE,

            longitude:
              location.longitude,

            latitudeDelta: 0.01,

            longitudeDelta: 0.01,
          };

          setUserLocation(
            cachedRegion,
          );

          userInitialRegion.current =
            location;

          setHasInitialLocation(
            true,
          );

          if (
            onUserLocationFound
          ) {
            onUserLocationFound(
              location,
              location.formattedAddress ||
              "Localização Atual",
            );
          }

          fetchAddressInBackground(
            location.latitude,
            location.longitude,
            location,
          );

          return true;
        }
      } catch (error) {
        console.log(
          "Erro ao carregar cache:",
          error,
        );
      }

      return false;
    }, [onUserLocationFound]);

  // Inicialização
  useEffect(() => {
    let isMounted = true;

    const initializeLocation =
      async () => {
        try {
          setIsLoading(true);

          const hasCache =
            await loadCachedLocation();

          if (
            hasCache &&
            isMounted
          ) {
            setIsLoading(false);
          }

          let { status } =
            await Location.getForegroundPermissionsAsync();

          if (
            status !==
            "granted"
          ) {
            const {
              status: newStatus,
            } =
              await Location.requestForegroundPermissionsAsync();

            status = newStatus;
          }

          if (!isMounted) return;

          if (
            status ===
            "granted"
          ) {
            setLocationPermission(
              true,
            );

            const subscription =
              await Location.watchPositionAsync(
                {
                  accuracy:
                    Location.Accuracy.Balanced,

                  timeInterval: 5000,

                  distanceInterval: 10,
                },

                (location) => {
                  if (
                    !isMounted
                  )
                    return;

                  const userRegion: Region =
                  {
                    latitude:
                      location.coords
                        .latitude -
                      OFFSET_LATITUDE,

                    longitude:
                      location.coords
                        .longitude,

                    latitudeDelta: 0.01,

                    longitudeDelta: 0.01,
                  };

                  const originalRegion =
                  {
                    latitude:
                      location.coords
                        .latitude,

                    longitude:
                      location.coords
                        .longitude,

                    latitudeDelta: 0.01,

                    longitudeDelta: 0.01,
                  };

                  if (
                    !userInitialRegion.current
                  ) {
                    setUserLocation(
                      userRegion,
                    );

                    userInitialRegion.current =
                      originalRegion;

                    setHasInitialLocation(
                      true,
                    );

                    AsyncStorage.setItem(
                      CACHE_KEY,
                      JSON.stringify(
                        originalRegion,
                      ),
                    );

                    if (
                      onUserLocationFound
                    ) {
                      onUserLocationFound(
                        originalRegion,
                        "Localização Atual",
                      );
                    }

                    if (
                      mapRef.current &&
                      isMapReady
                    ) {
                      mapRef.current.animateToRegion(
                        userRegion,
                        1000,
                      );
                    }

                    if (
                      isMounted
                    ) {
                      setIsLoading(
                        false,
                      );
                    }

                    fetchAddressInBackground(
                      originalRegion.latitude,
                      originalRegion.longitude,
                      originalRegion,
                    );
                  }
                },
              );

            locationWatchSubscription.current =
              subscription;

            setTimeout(() => {
              if (
                isMounted &&
                !userInitialRegion.current
              ) {
                setIsLoading(
                  false,
                );
              }
            }, 3000);
          } else {
            setLocationPermission(
              false,
            );

            setIsLoading(false);
          }
        } catch (error) {
          console.error(
            "Erro na inicialização:",
            error,
          );

          setLocationPermission(
            false,
          );

          setIsLoading(false);
        }
      };

    initializeLocation();

    return () => {
      isMounted = false;

      if (
        locationWatchSubscription.current
      ) {
        locationWatchSubscription.current.remove();
      }
    };
  }, [
    loadCachedLocation,
    onUserLocationFound,
    isMapReady,
  ]);

  // Atualiza localização
  const handleUserLocationChange =
    (
      event: UserLocationChangeEvent,
    ) => {
      const { coordinate } =
        event.nativeEvent;

      if (
        coordinate &&
        userInitialRegion.current
      ) {
        const newUserRegion = {
          latitude:
            coordinate.latitude -
            OFFSET_LATITUDE,

          longitude:
            coordinate.longitude,

          latitudeDelta: 0.01,

          longitudeDelta: 0.01,
        };

        setUserLocation(
          newUserRegion,
        );
      }
    };

  // Centralizar usuário
  const centerOnUser =
    async () => {
      if (
        userInitialRegion.current &&
        mapRef.current
      ) {
        const regionWithOffset =
        {
          ...userInitialRegion.current,

          latitude:
            userInitialRegion
              .current
              .latitude -
            OFFSET_LATITUDE,
        };

        mapRef.current.animateToRegion(
          regionWithOffset,
          1000,
        );
      } else if (
        userLocation &&
        mapRef.current
      ) {
        mapRef.current.animateToRegion(
          userLocation,
          1000,
        );
      } else {
        try {
          setIsLoading(true);

          let location =
            await Location.getCurrentPositionAsync(
              {
                accuracy:
                  Location.Accuracy.Balanced,
              },
            );

          const newUserRegion = {
            latitude:
              location.coords
                .latitude -
              OFFSET_LATITUDE,

            longitude:
              location.coords
                .longitude,

            latitudeDelta: 0.01,

            longitudeDelta: 0.01,
          };

          const originalRegion = {
            latitude:
              location.coords.latitude,

            longitude:
              location.coords.longitude,

            latitudeDelta: 0.01,

            longitudeDelta: 0.01,
          };

          setUserLocation(
            newUserRegion,
          );

          userInitialRegion.current =
            originalRegion;

          setHasInitialLocation(
            true,
          );

          if (mapRef.current) {
            mapRef.current.animateToRegion(
              newUserRegion,
              1000,
            );
          }

          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify(
              originalRegion,
            ),
          );

          fetchAddressInBackground(
            originalRegion.latitude,
            originalRegion.longitude,
            originalRegion,
          );
        } catch (error) {
          console.error(
            "Erro ao obter localização:",
            error,
          );

          Alert.alert(
            "Erro",
            "Não foi possível obter sua localização",
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

  // BottomSheet adjustment
  useEffect(() => {
    if (
      bottomSheetIndex ===
      undefined ||
      !userInitialRegion.current
    )
      return;

    if (
      bottomSheetIndex === 1
    ) {
      const largerOffset =
        0.045;

      const zoomedLatitudeDelta =
        0.055;

      const zoomedLongitudeDelta =
        0.055;

      const newRegion: Region =
      {
        ...userInitialRegion.current,

        latitude:
          userInitialRegion
            .current.latitude -
          largerOffset,

        latitudeDelta:
          zoomedLatitudeDelta,

        longitudeDelta:
          zoomedLongitudeDelta,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          newRegion,
          1000,
        );
      }

      setMapAdjusted(true);
    } else if (
      bottomSheetIndex === 0 &&
      mapAdjusted
    ) {
      const initialRegion: Region =
      {
        ...userInitialRegion.current,

        latitude:
          userInitialRegion
            .current.latitude -
          OFFSET_LATITUDE,

        latitudeDelta:
          userInitialRegion
            .current
            .latitudeDelta ??
          0.01,

        longitudeDelta:
          userInitialRegion
            .current
            .longitudeDelta ??
          0.01,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          initialRegion,
          1000,
        );
      }

      setMapAdjusted(false);
    }
  }, [
    bottomSheetIndex,
    mapAdjusted,
  ]);

  if (
    locationPermission ===
    false
  ) {
    return (
      <View
        style={
          styles.errorContainer
        }
      >
        <MaterialIcons
          name="location-off"
          size={48}
          color="#FF3B30"
        />

        <Text
          style={styles.errorText}
        >
          Permissão de localização
          necessária
        </Text>

        <Text
          style={
            styles.errorSubtext
          }
        >
          Ative a localização nas
          configurações do seu
          dispositivo para usar o
          app
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        StyleSheet.absoluteFill
      }
    >
      <MapView
        ref={mapRef}
        style={
          StyleSheet.absoluteFill
        }
        region={
          region ||
          userLocation ||
          DEFAULT_REGION
        }
        onRegionChangeComplete={
          onRegionChange
        }
        showsUserLocation={
          locationPermission ===
          true
        }
        showsMyLocationButton={
          false
        }
        onUserLocationChange={
          handleUserLocationChange
        }
        followsUserLocation={
          false
        }
        mapType="standard"
        onMapReady={() =>
          setIsMapReady(true)
        }
      >
        {/* 🔥 MARKERS */}
        {itinerario.map(
          (item, index) => (
            <Marker
              key={`${item.latitude}-${item.longitude}-${index}`}
              coordinate={{
                latitude:
                  item.latitude,
                longitude:
                  item.longitude,
              }}
              title={item.name}
              description={
                item.formattedAddress
              }
            />
          ),
        )}

        {/* 🔥 POLYLINE */}
        {/* 🔥 ROTA REAL */}
        {itinerario.length >= 2 && (
          <MapViewDirections
            origin={{
              latitude: itinerario[0].latitude,
              longitude: itinerario[0].longitude,
            }}
            destination={{
              latitude:
                itinerario[
                  itinerario.length - 1
                ].latitude,
              longitude:
                itinerario[
                  itinerario.length - 1
                ].longitude,
            }}
            waypoints={itinerario
              .slice(1, -1)
              .map((item) => ({
                latitude: item.latitude,
                longitude: item.longitude,
              }))}
            apikey={
              process.env
                .EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string
            }
            strokeWidth={4}
            strokeColor="#111827"
            optimizeWaypoints={true}
          />
        )}
      </MapView>

      {isLoading &&
        !userLocation && (
          <View
            style={
              styles.loadingOverlay
            }
          >
            <MaterialIcons
              name="location-searching"
              size={32}
              color="#007AFF"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Buscando
              localização...
            </Text>
          </View>
        )}

      <TouchableOpacity
        style={
          styles.locationButton
        }
        onPress={centerOnUser}
        disabled={
          isLoading &&
          !userLocation
        }
      >
        <MaterialIcons
          name="my-location"
          size={24}
          color={
            isLoading &&
              !userLocation
              ? "#ccc"
              : "#007AFF"
          }
        />
      </TouchableOpacity>
    </View>
  );
}

const styles =
  StyleSheet.create({
    errorContainer: {
      ...StyleSheet.absoluteFillObject,

      justifyContent:
        "center",

      alignItems: "center",

      backgroundColor:
        "#f8f8f8",

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

      backgroundColor:
        "white",

      paddingHorizontal: 16,

      paddingVertical: 10,

      borderRadius: 24,

      flexDirection: "row",

      alignItems: "center",

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

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

      backgroundColor:
        "white",

      width: 48,

      height: 48,

      borderRadius: 24,

      justifyContent:
        "center",

      alignItems: "center",

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.25,

      shadowRadius: 3.84,

      elevation: 5,

      zIndex: 20,
    },
  });