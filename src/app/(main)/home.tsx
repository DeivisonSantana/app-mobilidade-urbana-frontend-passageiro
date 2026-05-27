// app/home.tsx
import FolhaEscolherOferta from "@/components/corrida/FolhaEscolherOferta";
import ViagemComParada from "@/components/corrida/ViagemComParada";
import FolhaInferior from "@/components/FolhaInferior";
import Map from "@/components/Map";
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
  const [
    showBuscarEndereco,
    setShowBuscarEndereco,
  ] = useState(false);

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

  // 🔥 NOVO
  const [
    showFolhaEscolherOferta,
    setShowFolhaEscolherOferta,
  ] = useState(false);

  const userInitialRegion =
    useRef<Region | null>(
      null,
    );

  const [
    bottomSheetIndex,
    setBottomSheetIndex,
  ] = useState<number>(0);

  const [mapBottomPadding, setMapBottomPadding] =
    useState(320);

  // 🔥 Estado global do itinerário
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

  // Sincroniza modal com Context
  useEffect(() => {
    setModalVisible(
      showViagemComParada ||
      showFolhaEscolherOferta
    )
  }, [
    showViagemComParada,
    showFolhaEscolherOferta,
    setModalVisible,
  ]);

  // 🔥 ao abrir ViagemComParada,
  // recentraliza no usuário
  useEffect(() => {
    if (
      showViagemComParada &&
      userInitialRegion.current
    ) {
      const offsetLatitude =
        0.0064;

      setRegion({
        ...userInitialRegion.current,
        latitude:
          userInitialRegion.current
            .latitude -
          offsetLatitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [showViagemComParada]);

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

        // 🔥 injeta origem automaticamente
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

  // 🔥 CANCELA CORRIDA
  // limpa mapa + rota + itinerário
  const handleCancelarViagem =
    useCallback(() => {
      setShowViagemComParada(false);

      setShowFolhaEscolherOferta(
        false,
      );

      // 🔥 limpa rota mas mantém origem
      setItinerario((prev) => [
        prev[0],
        {
          name: "",
          formattedAddress: "",
          latitude: 0,
          longitude: 0,
          distancia: "0km",
          order: 1,
        },
      ]);

      // 🔥 recentraliza usuário
      if (userInitialRegion.current) {
        const offsetLatitude =
          0.0064;

        setRegion({
          ...userInitialRegion.current,
          latitude:
            userInitialRegion.current
              .latitude -
            offsetLatitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }, []);

  // 🔥 NOVO
  // prossegue fluxo sem limpar mapa
  const handleProsseguirViagem =
    useCallback(() => {
      setShowViagemComParada(
        false,
      );

      setShowFolhaEscolherOferta(
        true,
      );
    }, []);

  // 🔥 NOVO
  // voltar da oferta para edição
  const handleVoltarParaEdicao =
    useCallback(() => {
      setShowFolhaEscolherOferta(
        false,
      );

      setShowViagemComParada(
        true,
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

  // 🔥 partida
  const partida =
    itinerarioMapa.length > 0
      ? itinerarioMapa[0]
      : null;

  // 🔥 destino
  const destino =
    itinerarioMapa.length > 1
      ? itinerarioMapa[
      itinerarioMapa.length - 1
      ]
      : null;

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
        mapBottomPadding={
          mapBottomPadding
        }
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

      {/* 🔥 botão voltar */}
      {(showViagemComParada ||
        showFolhaEscolherOferta) &&
        !showBuscarEndereco && (
          <TouchableOpacity
            onPress={
              showFolhaEscolherOferta
                ? handleVoltarParaEdicao
                : handleCancelarViagem
            }
            activeOpacity={0.8}
            style={styles.backFloatingButton}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color="#000"
            />
          </TouchableOpacity>
        )}

      {/* 🔥 FolhaInferior */}
      {!showViagemComParada &&
        !showFolhaEscolherOferta && (
          <FolhaInferior
            onSheetChange={
              handleSheetStateChange
            }
            onAdicionarParada={
              handleAdicionarParada
            }
          />
        )}

      {/* 🔥 ViagemComParada */}
      <ViagemComParada
        onMapPaddingChange={
          setMapBottomPadding
        }
        onShowBuscarEndereco={
          setShowBuscarEndereco
        }
        visible={
          showViagemComParada
        }
        onClose={
          handleCancelarViagem
        }
        onConfirmar={
          handleProsseguirViagem
        }
        itinerario={
          itinerario
        }
        setItinerario={
          setItinerario
        }
      />

      {/* 🔥 FolhaEscolherOferta */}
      {showFolhaEscolherOferta && (
        <FolhaEscolherOferta
          onSheetChange={
            handleSheetStateChange
          }
          partida={partida}
          destino={destino}
          onClose={
            handleVoltarParaEdicao
          }
        />
      )}
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

    backFloatingButton: {
      position: "absolute",

      top: 40,

      left: 18,

      width: 48,

      height: 48,

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