// components/ParaOndeVamos.tsx

import EnderecosRecentes, {
  EnderecosRecentesRef,
} from "@/components/corrida/EnderecosRecentes";
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
  onAdicionarParada?: () => void; // Nova prop para comunicar o clique do botão +
}

interface EnderecoItem {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string;
  order: number;
}

const InputsIntinearioInicial: EnderecoItem[] = [
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

const enderecosRecentes = [
  {
    name: "Rua Portuguesa, 6244",
    formattedAddress:
      "Rua Portuguesa, 6244 - Conjunto Jamari, Porto Velho - RO, 76812-612, Brasil",
    latitude: -8.7601,
    longitude: -63.9002,
    distancia: "5.4km",
  },
  {
    name: "Rua Jobu Miró, 3287",
    formattedAddress:
      "Rua Jobu Miró, 3287 - Flodoaldo Pontes Pinto, Porto Velho - RO, 76820-608, Brasil",
    latitude: -8.7523,
    longitude: -63.8891,
    distancia: "3.2km",
  },
  {
    name: "Rua Brasília, 2930",
    formattedAddress:
      "Rua Brasília, 2930 - São Cristóvão, Porto Velho - RO, 76804-070, Brasil",
    latitude: -8.7488,
    longitude: -63.8734,
    distancia: "7km",
  },
];

export default function ParaOndevamos({
  visible,
  onClose,
  duration = 300,
  onAdicionarParada, // Recebe a nova prop
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  const enderecosRecentesRef = useRef<EnderecosRecentesRef>(null);

  const [isMounted, setIsMounted] = useState(visible);
  const [listaEnderecos, setListaEnderecos] = useState(enderecosRecentes);
  const [loading, setLoading] = useState(false);
  const [inputsIntinerario, setInputsIntinerario] = useState<EnderecoItem[]>(
    InputsIntinearioInicial,
  );
  const [inputSelecionado, setInputSelecionado] = useState<number>(1);

  const inputRefs = useRef<TextInput[]>([]);

  // Método associado ao botão "+" de adicionar parada
  const handleAdicionarParada = () => {
    // Fecha o componente ParaOndeVamos primeiro
    onClose();
    // Depois chama o callback para abrir o ViagemComParada
    if (onAdicionarParada) {
      onAdicionarParada();
    }
  };

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation | null = null;

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
      if (animationLoop) animationLoop.stop();
    };
  }, [loading]);

  const carregarLocalizacaoSalva = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const locationData = JSON.parse(cached);
        setInputsIntinerario((prev) =>
          prev.map((item, index) =>
            index === 0
              ? {
                  ...item,
                  name: locationData.formattedAddress || "Localização Atual",
                  formattedAddress: locationData.formattedAddress || "",
                }
              : item,
          ),
        );
      }
    } catch (error) {
      console.log("Erro ao recuperar endereço para o input:", error);
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
      const response = await api.get("/buscar-endereco", {
        params: { endereco: texto },
      });

      if (response.data) {
        const { name, formattedAddress, latitude, longitude } = response.data;
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
      console.log("Erro ao buscar endereço no backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const textoAtual = inputsIntinerario[inputSelecionado]?.name || "";
    const itemAtual = inputsIntinerario[inputSelecionado];

    if (itemAtual && itemAtual.formattedAddress !== "") {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        buscarEnderecoApi(textoAtual);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [inputsIntinerario, inputSelecionado]);

  const handleSelecionarEndereco = async (item: {
    name: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    distancia: string;
  }) => {
    setInputsIntinerario((prev) =>
      prev.map((input, index) =>
        index === inputSelecionado
          ? {
              ...input,
              name: item.name,
              formattedAddress: item.formattedAddress,
              latitude: item.latitude,
              longitude: item.longitude,
            }
          : input,
      ),
    );

    if (enderecosRecentesRef.current) {
      await enderecosRecentesRef.current.salvarEnderecoNoCache(item);
    }

    setListaEnderecos([]);
    console.log("📍 Endereço Selecionado e Gravado em Cache com Sucesso!");
  };

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
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
          setInputsIntinerario(InputsIntinearioInicial);
          setListaEnderecos([]);
          setLoading(false);
        }
      });
    }
  }, [visible, translateX, overlayOpacity, duration]);

  if (!isMounted) return null;

  return (
    <View style={[{ flex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, { zIndex: 30 }]}>
      {/* Overlay */}
      <Pressable style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]} onPress={onClose}>
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            {
              backgroundColor: "rgba(0,0,0,0.25)",
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
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.userContainer}>
              <View style={styles.userPill}>
                <Ionicons name="person-circle" size={28} color="#666" />
                <Text style={styles.userName}>Diogo</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </View>
            </View>
          </View>

          <View style={{ width: 24 }} />
        </View>

        <View style={{ padding: 10 }} />

        {/* Título */}
        <Text style={styles.title}>Para onde vamos?</Text>

        {/* INPUTS FIXOS (ORIGEM E DESTINO) */}
        <View style={styles.searchContainer}>
          {inputsIntinerario.map((item, index) => {
            const isOrigem = index === 0;
            const isDestino = index === 1;

            return (
              <View key={index} style={styles.rowContainer}>
                {/* TIMELINE */}
                <View style={styles.lineContainer}>
                  <View style={styles.markerWrapper}>
                    {isOrigem ? (
                      <View style={styles.startOuterCircle}>
                        <View style={styles.startInnerCircle} />
                      </View>
                    ) : (
                      <View style={styles.startOuterSquare}>
                        <View style={styles.startInnerSquare} />
                      </View>
                    )}
                  </View>

                  {isOrigem && <View style={styles.verticalLine} />}
                </View>

                {/* INPUT */}
                <View
                  style={[
                    styles.searchInput,
                    isDestino && styles.searchInputDestination,
                  ]}
                >
                  <TextInput
                    ref={(ref) => {
                      if (ref) {
                        inputRefs.current[index] = ref;
                      }
                    }}
                    style={styles.input}
                    placeholder={
                      isOrigem ? "Local de partida" : "Para onde você vai?"
                    }
                    placeholderTextColor="#999"
                    value={item.name}
                    onFocus={() => setInputSelecionado(index)}
                    onChangeText={(texto) => {
                      setInputsIntinerario((prev) =>
                        prev.map((inp, idx) =>
                          idx === index
                            ? { ...inp, name: texto, formattedAddress: "" }
                            : inp,
                        ),
                      );
                    }}
                  />

                  {isDestino && (
                    <TouchableOpacity
                      onPress={handleAdicionarParada}
                      style={styles.addButtonInline}
                    >
                      <Ionicons name="add" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* HISTÓRICO */}
        <EnderecosRecentes
          ref={enderecosRecentesRef}
          loading={loading}
          skeletonOpacity={skeletonOpacity}
          listaEnderecos={listaEnderecos}
          onSelecionarEndereco={handleSelecionarEndereco}
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
  searchContainer: {
    flexDirection: "column",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  lineContainer: {
    alignItems: "center",
    marginRight: 14,
    width: 24,
    position: "relative",
  },
  markerWrapper: {
    width: 24,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  startOuterCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  startInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111",
  },
  startOuterSquare: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FF5500",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  startInnerSquare: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#FF5500",
  },
  verticalLine: {
    position: "absolute",
    width: 2,
    top: 38,
    bottom: -18,
    backgroundColor: "#DDD",
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  searchInputDestination: {
    borderBottomColor: "#FFD7BF",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
    color: "#111",
    fontWeight: "500",
    paddingRight: 10,
  },
  addButtonInline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
