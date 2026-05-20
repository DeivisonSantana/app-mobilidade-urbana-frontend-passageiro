// components/ParaOndeVamos.tsx

import EnderecosRecentes, {
  EnderecosRecentesRef,
} from "@/components/corrida/EnderecosRecentes";

import InputsItinerario, {
  EnderecoItem,
} from "@/components/corrida/InputsIntinerario";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import React, { useEffect, useRef, useState } from "react";

import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "../Services/api";

const { width } = Dimensions.get("window");

const CACHE_KEY = "@last_user_location";

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

const InputsIntinearioInicial: EnderecoItem[] = [
  {
    id: "origem",
    name: "",
    formattedAddress: "",
    latitude: 0,
    longitude: 0,
    distancia: 0,
    order: 0,
  },
  {
    id: "destino",
    name: "",
    formattedAddress: "",
    latitude: 0,
    longitude: 0,
    distancia: 0,
    order: 1,
  },
];

export default function ParaOndevamos({
  visible,
  onClose,
  duration = 300,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;

  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  const [isMounted, setIsMounted] = useState(visible);

  const [listaEnderecos, setListaEnderecos] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [inputsIntinerario, setInputsIntinerario] = useState<
    EnderecoItem[]
  >(InputsIntinearioInicial);

  const [inputSelecionado, setInputSelecionado] =
    useState<number>(1);

  const inputRefs = useRef<TextInput[]>([]);

  const enderecosRecentesRef =
    useRef<EnderecosRecentesRef>(null);

  const atualizarInput = (
    texto: string,
    index: number,
  ) => {
    setInputsIntinerario((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              name: texto,
            }
          : item,
      ),
    );
  };

  useEffect(() => {
    let animationLoop:
      | Animated.CompositeAnimation
      | null = null;

    if (loading) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),

          Animated.timing(skeletonOpacity, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );

      animationLoop.start();
    } else {
      skeletonOpacity.setValue(0.4);
    }

    return () => {
      if (animationLoop) {
        animationLoop.stop();
      }
    };
  }, [loading]);

  const carregarLocalizacaoSalva = async () => {
    try {
      const cached = await AsyncStorage.getItem(
        CACHE_KEY,
      );

      if (cached) {
        const locationData = JSON.parse(cached);

        setInputsIntinerario((prev) =>
          prev.map((item, index) =>
            index === 0
              ? {
                  ...item,
                  name:
                    locationData.formattedAddress ||
                    "Localização Atual",

                  formattedAddress:
                    locationData.formattedAddress || "",
                }
              : item,
          ),
        );
      }
    } catch (error) {
      console.log(
        "Erro ao recuperar endereço para o input:",
        error,
      );
    }
  };

  const buscarEnderecoApi = async (texto: string) => {
    if (!texto || texto.trim().length === 0) {
      setListaEnderecos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(
        "/buscar-endereco",
        {
          params: {
            endereco: texto,
          },
        },
      );

      if (response.data) {
        const {
          name,
          formattedAddress,
          latitude,
          longitude,
        } = response.data;

        const novoEnderecoObjeto = {
          name,
          formattedAddress,
          latitude,
          longitude,
          distancia: "--",
        };

        setListaEnderecos([novoEnderecoObjeto]);
      }
    } catch (error) {
      console.log(
        "Erro ao buscar endereço no backend:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const textoAtual =
      inputsIntinerario[inputSelecionado]?.name || "";

    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        buscarEnderecoApi(textoAtual);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [
    inputsIntinerario,
    inputSelecionado,
    visible,
  ]);

  const handleSelecionarEndereco = async (
    item: any,
  ) => {
    setInputsIntinerario((prev) =>
      prev.map((input, index) =>
        index === inputSelecionado
          ? {
              ...input,
              name: item.name,
              formattedAddress:
                item.formattedAddress,
              latitude: item.latitude,
              longitude: item.longitude,
            }
          : input,
      ),
    );

    if (enderecosRecentesRef.current) {
      await enderecosRecentesRef.current.salvarEnderecoNoCache(
        {
          name: item.name,
          formattedAddress:
            item.formattedAddress,
          latitude: item.latitude,
          longitude: item.longitude,
          distancia: item.distancia || "--",
        },
      );
    }

    console.log(
      "📍 Endereço Selecionado com Sucesso!",
    );
  };

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        onClose();
        return true;
      }

      return false;
    };

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

    return () => subscription.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      carregarLocalizacaoSalva();

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),

        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          inputRefs.current[1]?.focus();
        }, 100);
      });
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width,
          duration,
          useNativeDriver: true,
        }),

        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);

          setInputsIntinerario(
            InputsIntinearioInicial,
          );

          setListaEnderecos([]);

          setLoading(false);
        }
      });
    }
  }, [
    visible,
    translateX,
    overlayOpacity,
    duration,
  ]);

  if (!isMounted) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 30 },
      ]}
    >
      {/* Overlay */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                "rgba(0,0,0,0.25)",
              opacity: overlayOpacity,
            },
          ]}
        />
      </Pressable>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            zIndex: 31,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="black"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.userContainer}>
              <View style={styles.userPill}>
                <Ionicons
                  name="person-circle"
                  size={28}
                  color="#666"
                />

                <Text style={styles.userName}>
                  Diogo
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#666"
                />
              </View>
            </View>
          </View>

          <View style={{ width: 24 }} />
        </View>

        <View style={{ padding: 10 }} />

        {/* Título */}
        <Text style={styles.title}>
          Para onde vamos?
        </Text>

        {/* INPUTS */}
        <InputsItinerario
          inputsIntinerario={
            inputsIntinerario
          }
          setInputsIntinerario={
            setInputsIntinerario
          }
          atualizarInput={atualizarInput}
        />

        {/* LISTA */}
        <EnderecosRecentes
          ref={enderecosRecentesRef}
          loading={loading}
          skeletonOpacity={skeletonOpacity}
          listaEnderecos={listaEnderecos}
          onSelecionarEndereco={
            handleSelecionarEndereco
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 30,
  },

  backButton: {
    marginTop: 10,
  },

  headerCenter: {
    alignItems: "center",
  },

  userContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 30,
  },

  userPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  userName: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
    marginHorizontal: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 28,
  },
});