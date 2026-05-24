// app/home.tsx
import FolhaInferior from "@/components/FolhaInferior";
import Map from "@/components/Map";
import ViagemComParada from "@/components/corrida/ViagemComParada";
import { useAuth } from "@/context/AuthProvider";
import { useUi } from "@/context/UiContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Region } from "react-native-maps";

export interface EnderecoItem {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string;
  order: number;
}

const itinerarioInicial: EnderecoItem[] = [
  {
    name: "",
    formattedAddress: "",
    latitude: 0,
    longitude: 0,
    distancia: "0km",
    order: 0,
  },
  {
    name: "",
    formattedAddress: "",
    latitude: 0,
    longitude: 0,
    distancia: "0km",
    order: 1,
  },
];

export default function Home() {
  const { user, loading: authLoading } =
    useAuth();

  const { setModalVisible } =
    useUi();

  const router = useRouter();

  const [region, setRegion] =
    useState<Region | null>(
      null,
    );

  const [
    showViagemComParada,
    setShowViagemComParada,
  ] = useState(false);

  const userInitialRegion =
    useRef<Region | null>(
      null,
    );

  const [
    bottomSheetIndex,
    setBottomSheetIndex,
  ] = useState<number>(0);

  // 🔥 NOVO: Estado global do itinerário
  const [
    itinerario,
    setItinerario,
  ] = useState<
    EnderecoItem[]
  >(itinerarioInicial);

  useEffect(() => {
    if (
      !authLoading &&
      !user
    ) {
      router.replace(
        "/login",
      );
    }
  }, [
    user,
    authLoading,
    router,
  ]);

  // Sincroniza o estado do modal com o Context
  useEffect(() => {
    setModalVisible(
      showViagemComParada,
    );
  }, [
    showViagemComParada,
    setModalVisible,
  ]);

  const handleUserLocationFound =
    useCallback(
      (
        userRegion: Region,
        addressName?: string,
      ) => {
        userInitialRegion.current =
          {
            ...userRegion,
            latitudeDelta:
              0.01,
            longitudeDelta:
              0.01,
          };

        const offsetLatitude =
          0.0064;

        const adjustedRegion: Region =
          {
            ...userRegion,
            latitude:
              userRegion.latitude -
              offsetLatitude,
            latitudeDelta:
              0.01,
            longitudeDelta:
              0.01,
          };

        setRegion(
          adjustedRegion,
        );

        // 🔥 injeta origem automaticamente no itinerário
        if (addressName) {
          setItinerario(
            (prev) =>
              prev.map(
                (
                  item,
                  index,
                ) =>
                  index === 0
                    ? {
                        ...item,
                        name:
                          addressName,
                        formattedAddress:
                          addressName,
                        latitude:
                          userRegion.latitude,
                        longitude:
                          userRegion.longitude,
                      }
                    : item,
              ),
          );
        }
      },
      [],
    );

  const handleSheetStateChange =
    useCallback(
      (
        index: number,
      ) => {
        setBottomSheetIndex(
          index,
        );
      },
      [],
    );

  const handleAdicionarParada =
    useCallback(() => {
      setShowViagemComParada(
        true,
      );
    }, []);

  const handleCloseViagemComParada =
    useCallback(() => {
      setShowViagemComParada(
        false,
      );
    }, []);

  // 🔥 lista operacional do mapa
  const itinerarioMapa =
    useMemo(() => {
      return itinerario.filter(
        (item) =>
          item.name &&
          item.latitude &&
          item.longitude,
      );
    }, [itinerario]);

  if (authLoading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#000"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Verificando
          autenticação...
        </Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <View
      style={
        styles.container
      }
    >
      <Map
        region={region}
        onRegionChange={
          setRegion
        }
        onUserLocationFound={
          handleUserLocationFound
        }
        bottomSheetIndex={
          bottomSheetIndex
        }
        itinerario={
          itinerarioMapa
        }
      />

      {/* 🔥 BOTÃO FLUTUANTE IGUAL 99 */}
      {showViagemComParada && (
        <TouchableOpacity
          onPress={
            handleCloseViagemComParada
          }
          activeOpacity={
            0.8
          }
          style={
            styles.backFloatingButton
          }
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color="#000"
          />
        </TouchableOpacity>
      )}

      {/* FolhaInferior só aparece quando ViagemComParada NÃO está visível */}
      {!showViagemComParada && (
        <FolhaInferior
          onSheetChange={
            handleSheetStateChange
          }
          onAdicionarParada={
            handleAdicionarParada
          }
        />
      )}

      <ViagemComParada
        visible={
          showViagemComParada
        }
        onClose={
          handleCloseViagemComParada
        }
        itinerario={
          itinerario
        }
        setItinerario={
          setItinerario
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#fff",
    },

    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: "#666",
    },

    // 🔥 NOVO
    backFloatingButton: {
      position: "absolute",

      top: 58,

      left: 18,

      width: 56,

      height: 56,

      borderRadius: 28,

      backgroundColor:
        "#FFF",

      justifyContent:
        "center",

      alignItems: "center",

      zIndex: 999,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.18,

      shadowRadius: 6,

      elevation: 8,
    },
  });