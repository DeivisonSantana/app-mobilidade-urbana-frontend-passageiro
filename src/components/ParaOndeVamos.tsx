// components/ParaOndeVamos.tsx

import { InterfaceEndereco } from "@/app/(main)/home";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../Services/api";
const { width } = Dimensions.get("window");
const CACHE_HISTORICO_KEY = "@historico_enderecos";

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
  onAdicionarParada?: () => void;
  // 🔥 NOVAS PROPS CONECTADAS À HOME
  itinerario: InterfaceEndereco[];
  setItinerario: React.Dispatch<React.SetStateAction<InterfaceEndereco[]>>;
}

const enderecosPadrao: InterfaceEndereco[] = [];

export default function ParaOndeVamos({
  visible,
  onClose,
  duration = 300,
  onAdicionarParada,
  itinerario,
  setItinerario,
}: props) {
  const translateX = useRef(new Animated.Value(width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  const [isMounted, setIsMounted] = useState(visible);
  const [listaEnderecos, setListaEnderecos] = useState<InterfaceEndereco[]>([]);
  const [historicoCache, setHistoricoCache] = useState<InterfaceEndereco[]>([]);
  const [loading, setLoading] = useState(false);

  // Controla qual input está ativo (0 para Origem, 1 para Destino)
  const [inputSelecionado, setInputSelecionado] = useState<number>(1);
  const inputRefs = useRef<TextInput[]>([]);

  const listaExibicao =
    listaEnderecos.length > 0 ? listaEnderecos : historicoCache;

  const handleAdicionarParada = () => {
    onClose();
    if (onAdicionarParada) {
      onAdicionarParada();
    }
  };

  // Animação do Skeleton
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

  // Histórico em Cache (AsyncStorage)
  const carregarHistoricoCache = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_HISTORICO_KEY);
      if (cachedData) {
        setHistoricoCache(JSON.parse(cachedData));
      } else {
        setHistoricoCache(enderecosPadrao);
        await AsyncStorage.setItem(
          CACHE_HISTORICO_KEY,
          JSON.stringify(enderecosPadrao),
        );
      }
    } catch (error) {
      console.log("Erro ao carregar histórico do cache:", error);
      setHistoricoCache(enderecosPadrao);
    }
  };

  const salvarEnderecoNoCache = async (novoEndereco: InterfaceEndereco) => {
    try {
      const historicoFiltrado = historicoCache.filter(
        (item) => item.formattedAddress !== novoEndereco.formattedAddress,
      );
      const novoHistorico = [novoEndereco, ...historicoFiltrado];
      const historicoLimitado = novoHistorico.slice(0, 10);

      setHistoricoCache(historicoLimitado);
      await AsyncStorage.setItem(
        CACHE_HISTORICO_KEY,
        JSON.stringify(historicoLimitado),
      );
    } catch (error) {
      console.log("Erro ao salvar endereço no cache:", error);
    }
  };

  const removerEnderecoDoCache = async (
    enderecoParaRemover: InterfaceEndereco,
  ) => {
    try {
      const historicoAtualizado = historicoCache.filter(
        (item) =>
          item.formattedAddress !== enderecoParaRemover.formattedAddress,
      );
      setHistoricoCache(historicoAtualizado);
      await AsyncStorage.setItem(
        CACHE_HISTORICO_KEY,
        JSON.stringify(historicoAtualizado),
      );
    } catch (error) {
      console.log("Erro ao remover endereço do cache:", error);
    }
  };

  // Requisição de busca na API
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
    carregarHistoricoCache();
  }, []);

  // Debounce para escutar as mudanças do itinerário global da Home
  useEffect(() => {
    const textoAtual = itinerario[inputSelecionado]?.name || "";
    const itemAtual = itinerario[inputSelecionado];

    if (itemAtual && itemAtual.formattedAddress !== "") {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (visible) {
        buscarEnderecoApi(textoAtual);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [itinerario, inputSelecionado, visible]);

  // 🔥 Seleção do endereço atualizando o estado global da Home
  const handleSelecionarEndereco = async (item: InterfaceEndereco) => {
    setItinerario((prev) =>
      prev.map((input, index) =>
        index === inputSelecionado
          ? {
            ...input,
            name: item.name,
            formattedAddress: item.formattedAddress,
            latitude: item.latitude,
            longitude: item.longitude,
            order: index,
          }
          : input,
      ),
    );

    await salvarEnderecoNoCache(item);
    setListaEnderecos([]);

    // Se preencheu o destino (index 1), fecha a tela e renderiza a rota no mapa da Home
    if (inputSelecionado === 1) {
      onClose();
    } else {
      // Se alterou a origem (index 0), joga o foco automaticamente para o destino
      setTimeout(() => {
        inputRefs.current[1]?.focus();
      }, 150);
    }
  };

  // Botão Voltar Físico do Android
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

  // Controle de Animações de Entrada/Saída (Drawer Lateral)
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
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
          // Sempre foca no destino ao abrir, a menos que esteja vazio
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
          setListaEnderecos([]);
          setLoading(false);
        }
      });
    }
  }, [visible, translateX, overlayOpacity, duration]);

  if (!isMounted) return null;

  return (
    <View
      style={[
        {
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        { zIndex: 30 },
      ]}
    >
      {/* Overlay */}
      <Pressable
        style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}
        onPress={onClose}
      >
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
        <Text style={styles.title}>Para onde vamos?</Text>

        {/* INPUTS MUDADOS PARA ESCUTAR O ITINERÁRIO GLOBAL */}
        <View style={styles.searchContainer}>
          {itinerario.slice(0, 2).map((item, index) => {
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

                {/* TEXT INPUT CONTROLANDO A HOME */}
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
                      setItinerario((prev) =>
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

        {/* HISTÓRICO / RESULTADOS */}
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* AÇÕES RÁPIDAS */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickButton}>
              <Ionicons name="home" size={16} color="#5F6368" />
              <Text numberOfLines={1} style={styles.quickText}>
                Avenida Bo...
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#B0B0B0" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickButton}>
              <Ionicons name="briefcase" size={16} color="#5F6368" />
              <Text style={styles.quickText}>Trabalho</Text>
              <Ionicons name="chevron-forward" size={14} color="#B0B0B0" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickButton}>
              <Ionicons name="star" size={16} color="#5F6368" />
              <Text style={styles.quickText}>Favoritos</Text>
              <Ionicons name="chevron-forward" size={14} color="#B0B0B0" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* LISTA DINÂMICA */}
          <View style={styles.list}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                <Animated.View
                  key={i}
                  style={[styles.listItem, { opacity: skeletonOpacity }]}
                >
                  <View
                    style={[
                      styles.listIconContainer,
                      { backgroundColor: "#EBEBEB" },
                    ]}
                  />
                  <View style={styles.listContent}>
                    <View
                      style={{
                        width: "60%",
                        height: 14,
                        backgroundColor: "#EBEBEB",
                        borderRadius: 4,
                        marginBottom: 8,
                      }}
                    />
                    <View
                      style={{
                        width: "90%",
                        height: 10,
                        backgroundColor: "#EBEBEB",
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </Animated.View>
              ))
              : listaExibicao.map((endereco, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.listItem}
                  onPress={() => handleSelecionarEndereco(endereco)}
                >
                  <TouchableOpacity
                    style={styles.listIconContainer}
                    onPress={() => removerEnderecoDoCache(endereco)}
                  >
                    <Ionicons name="close" size={14} color="#111" />
                  </TouchableOpacity>

                  <View style={styles.listContent}>
                    <Text style={styles.listText}>{endereco.name}</Text>
                    <Text style={styles.listSubText}>
                      {endereco.formattedAddress}
                    </Text>
                  </View>

                  <Text style={styles.distanceText}>
                    {endereco.distancia}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          {/* FOOTER */}
          <View style={styles.footerButtonsContainer}>
            <TouchableOpacity style={styles.footerButton}>
              <View
                style={[
                  styles.listIconContainer,
                  styles.footerIconContainer,
                ]}
              >
                <Ionicons name="map" size={16} color="#111" />
              </View>
              <Text style={styles.footerButtonText}>
                Definir local no mapa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerButton}>
              <View
                style={[
                  styles.listIconContainer,
                  styles.footerIconContainer,
                ]}
              >
                <Ionicons name="add" size={18} color="#111" />
              </View>
              <Text style={styles.footerButtonText}>
                Inserir mais tarde
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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

  container: {
    width: "100%",
    maxHeight: 600,
  },

  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingTop: 4,
  },

  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },

  quickText: {
    flex: 1,
    fontSize: 14,
    color: "#5F6368",
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginHorizontal: -24,
    marginBottom: 8,
  },

  list: {
    marginTop: 4,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
  },

  listIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },

  listContent: {
    flex: 1,
    paddingRight: 10,
  },

  listText: {
    fontSize: 16,
    color: "#2B2B2B",
    fontWeight: "700",
    marginBottom: 3,
  },

  listSubText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#909090",
    fontWeight: "400",
  },

  distanceText: {
    fontSize: 14,
    color: "#9B9B9B",
    marginTop: 2,
  },

  footerButtonsContainer: {
    marginTop: 8,
    paddingBottom: 24,
  },

  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  footerIconContainer: {
    marginTop: 0,
  },

  footerButtonText: {
    fontSize: 16,
    color: "#2B2B2B",
    fontWeight: "700",
  },
});