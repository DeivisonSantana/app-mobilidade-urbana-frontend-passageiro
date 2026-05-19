// components/ParaOndeVamos.tsx

import EnderecosRecentes from "@/components/corrida/EnderecosRecentes";
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

interface EnderecoItem {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string | number;
  order: number;
}

const InputsIntinearioInicial: EnderecoItem[] = [
  {
    name: "",
    formattedAddress: "",
    latitude: 0,
    longitude: 0,
    distancia: 0,
    order: 0,
  },
  {
    name: "",
    formattedAddress: "",
    latitude: 0,
    longitude: 0,
    distancia: 0,
    order: 1,
  },
];

// Lista base estática padrão
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
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  const [isMounted, setIsMounted] = useState(visible);

  const [listaEnderecos, setListaEnderecos] = useState(enderecosRecentes);

  const [loading, setLoading] = useState(false);

  // 🔹 NOVO ESTADO DINÂMICO DOS INPUTS
  const [inputsIntinerario, setInputsIntinerario] = useState<EnderecoItem[]>(
    InputsIntinearioInicial,
  );

  // 🔹 INPUT ATUAL SELECIONADO
  const [inputSelecionado, setInputSelecionado] = useState<number>(1);

  // 🔹 refs dinâmicos
  const inputRefs = useRef<TextInput[]>([]);

  // 🔹 Reorganiza os orders
  const reorganizarOrders = (lista: EnderecoItem[]) => {
    return lista.map((item, index) => ({
      ...item,
      order: index,
    }));
  };

  // 🔹 Adicionar parada
  const adicionarParada = () => {
    setInputsIntinerario((prev) => {
      const novaLista = [...prev];

      novaLista.splice(novaLista.length - 1, 0, {
        name: "",
        formattedAddress: "",
        latitude: 0,
        longitude: 0,
        distancia: 0,
        order: 0,
      });

      return reorganizarOrders(novaLista);
    });
  };

  // 🔹 Remover parada
  const removerParada = (index: number) => {
    if (index === 0) return;
    if (index === inputsIntinerario.length - 1) return;

    setInputsIntinerario((prev) => {
      const novaLista = prev.filter((_, i) => i !== index);

      return reorganizarOrders(novaLista);
    });
  };

  // 🔹 Mover parada para cima
  const moverParaCima = (index: number) => {
    if (index <= 1) return;

    setInputsIntinerario((prev) => {
      const novaLista = [...prev];

      [novaLista[index - 1], novaLista[index]] = [
        novaLista[index],
        novaLista[index - 1],
      ];

      return reorganizarOrders(novaLista);
    });
  };

  // 🔹 Mover parada para baixo
  const moverParaBaixo = (index: number) => {
    if (index >= inputsIntinerario.length - 2) return;

    setInputsIntinerario((prev) => {
      const novaLista = [...prev];

      [novaLista[index], novaLista[index + 1]] = [
        novaLista[index + 1],
        novaLista[index],
      ];

      return reorganizarOrders(novaLista);
    });
  };

  // 🔹 Atualizar texto do input
  const atualizarInput = (texto: string, index: number) => {
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

  // 🔹 Skeleton animation
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

  // 🔹 Carregar origem salva
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

  // 🔹 Buscar endereço
  const buscarEnderecoApi = async (texto: string) => {
    if (!texto || texto.trim().length === 0) {
      setListaEnderecos(enderecosRecentes);
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

        setListaEnderecos([novoEnderecoObjeto, ...enderecosRecentes]);
      }
    } catch (error) {
      console.log("Erro ao buscar endereço no backend:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 debounce baseado no input selecionado
  useEffect(() => {
    const textoAtual = inputsIntinerario[inputSelecionado]?.name || "";

    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        buscarEnderecoApi(textoAtual);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [inputsIntinerario, inputSelecionado]);

  // 🔹 Selecionar endereço
  const handleSelecionarEndereco = (item: (typeof enderecosRecentes)[0]) => {
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

    console.log("📍 Endereço Selecionado com Sucesso!");

    console.log("📦 Itinerário Atualizado:", {
      inputsIntinerario,
    });
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

          setListaEnderecos(enderecosRecentes);

          setLoading(false);
        }
      });
    }
  }, [visible, translateX, overlayOpacity, duration]);

  if (!isMounted) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
      {/* Overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
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

        {/* INPUTS DINÂMICOS */}
        <View style={styles.searchContainer}>
          <View style={styles.lineContainer}>
            {inputsIntinerario.map((_, index) => (
              <React.Fragment key={index}>
                <View
                  style={[
                    styles.circleTop,
                    index === inputsIntinerario.length - 1
                      ? styles.circleBottom
                      : null,
                  ]}
                />

                {index !== inputsIntinerario.length - 1 && (
                  <View style={styles.verticalLine} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.inputsContainer}>
            {inputsIntinerario.map((item, index) => {
              const isOrigem = index === 0;

              const isDestino = index === inputsIntinerario.length - 1;

              const isParada = !isOrigem && !isDestino;

              return (
                <View
                  key={index}
                  style={[
                    styles.searchInput,
                    isDestino && styles.searchInputDestination,
                  ]}
                >
                  <Ionicons
                    name={
                      isOrigem
                        ? "navigate-outline"
                        : isDestino
                          ? "flag-outline"
                          : "pause-outline"
                    }
                    size={18}
                    color={isDestino ? "#FF5500" : "#666"}
                  />

                  <TextInput
                    ref={(ref) => {
                      if (ref) {
                        inputRefs.current[index] = ref;
                      }
                    }}
                    style={styles.input}
                    placeholder={
                      isOrigem
                        ? "Local de partida"
                        : isDestino
                          ? "Para onde você vai?"
                          : "Parada"
                    }
                    placeholderTextColor="#999"
                    value={item.name}
                    onFocus={() => setInputSelecionado(index)}
                    onChangeText={(texto) => atualizarInput(texto, index)}
                  />

                  {/* CONTROLES DE PARADA */}
                  {isParada && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <TouchableOpacity onPress={() => moverParaCima(index)}>
                        <Ionicons name="chevron-up" size={18} color="#777" />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => moverParaBaixo(index)}>
                        <Ionicons name="chevron-down" size={18} color="#777" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removerParada(index)}
                        style={{
                          marginLeft: 8,
                        }}
                      >
                        <Ionicons name="close" size={20} color="#777" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            {/* ADICIONAR PARADA */}
            <TouchableOpacity
              style={{
                marginTop: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={adicionarParada}
            >
              <Ionicons name="add" size={18} color="#666" />

              <Text
                style={{
                  marginLeft: 6,
                  color: "#666",
                  fontWeight: "600",
                }}
              >
                Adicionar parada
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTA / SKELETON LOAD COMPONENTIZADO */}
        <EnderecosRecentes
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
    flexDirection: "row",
    marginBottom: 24,
  },

  lineContainer: {
    alignItems: "center",
    marginRight: 14,
    paddingTop: 10,
  },

  circleTop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#666",
  },

  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#DDD",
    marginVertical: 4,
  },

  circleBottom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5500",
  },

  inputsContainer: {
    flex: 1,
  },

  searchInput: {
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
  },
});
