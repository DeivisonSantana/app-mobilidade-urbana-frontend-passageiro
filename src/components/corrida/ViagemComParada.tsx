// components/ViagemComParada.tsx
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { api } from "../../Services/api";

const { width, height } = Dimensions.get("window");
const CACHE_KEY = "@last_user_location";
const MAX_PARADAS = 4; // Número máximo de paradas (excluindo origem e destino)

interface props {
  visible: boolean;
  onClose: () => void;
  onAdicionarParada?: () => void;
  duration?: number;
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

export default function ViagemComParada({
  visible,
  onClose,
  onAdicionarParada,
  duration = 300,
}: props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current;

  const [isMounted, setIsMounted] = useState(visible);
  const [listaEnderecos, setListaEnderecos] = useState(enderecosRecentes);
  const [loading, setLoading] = useState(false);
  const [inputsIntinerario, setInputsIntinerario] = useState<EnderecoItem[]>(
    InputsIntinearioInicial,
  );
  const [inputSelecionado, setInputSelecionado] = useState<number>(1);

  const inputRefs = useRef<TextInput[]>([]);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Calcular snap point dinâmico baseado no número de inputs
  const snapPoints = useMemo(() => {
    const baseHeight = 48; // percentual base
    const additionalHeight = (inputsIntinerario.length - 2) * 5; // 5% por parada adicional
    const totalHeight = Math.min(baseHeight + additionalHeight, 85); // Máximo 85%
    return [`${totalHeight}%`];
  }, [inputsIntinerario.length]);

  const reorganizarOrders = (lista: EnderecoItem[]) => {
    return lista.map((item, index) => ({
      ...item,
      order: index,
    }));
  };

  // Método chamado ao clicar no input
  const handleInputClick = (index: number) => {
    console.log("bateu");
    setInputSelecionado(index);
  };

  const adicionarParada = () => {
    // quantidade máxima total de inputs permitidos
    const maxInputs = MAX_PARADAS + 1;

    // se já atingiu o máximo, não adiciona
    if (inputsIntinerario.length >= maxInputs) {
      console.log("Número máximo de inputs atingido:", maxInputs);
      return;
    }

    setInputsIntinerario((prev) => {
      const novaLista = [...prev];

      // transforma o destino atual em parada
      // e adiciona um novo destino vazio no final
      novaLista.splice(novaLista.length - 1, 0, {
        name: "",
        formattedAddress: "",
        latitude: 0,
        longitude: 0,
        distancia: "0km",
        order: 0,
      });

      return reorganizarOrders(novaLista);
    });

    if (onAdicionarParada) {
      onAdicionarParada();
    }
  };

  const removerParada = (index: number) => {
    if (index === 0) return;
    if (index === inputsIntinerario.length - 1) return;

    setInputsIntinerario((prev) => {
      const novaLista = prev.filter((_, i) => i !== index);
      return reorganizarOrders(novaLista);
    });
  };

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

  const atualizarInput = (texto: string, index: number) => {
    setInputsIntinerario((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name: texto } : item)),
    );
  };

  const handleConfirmar = () => {
    console.log("Rota confirmada:", inputsIntinerario);
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

      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: duration * 0.8,
        useNativeDriver: true,
      }).start();

      bottomSheetRef.current?.snapToIndex(0);
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: duration * 0.8,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
          setInputsIntinerario(InputsIntinearioInicial);
          setListaEnderecos([]);
          setLoading(false);
          bottomSheetRef.current?.close();
        }
      });
    }
  }, [visible, overlayOpacity, duration]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!isMounted) return null;

  // Verifica se pode adicionar mais paradas
  const podeAdicionarParada =
    inputsIntinerario.length < MAX_PARADAS + 1;

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

      {/* BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChange}
        overDragResistanceFactor={13}
        enablePanDownToClose={false}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ padding: 10 }} />

          {/* Título */}
          <Text style={styles.title}>Adicionar paradas</Text>

          {/* INPUTS DINÂMICOS */}
          <View style={styles.searchContainer}>
            {inputsIntinerario.map((item, index) => {
              const isOrigem = index === 0;
              const isDestino = index === inputsIntinerario.length - 1;
              const isParada = !isOrigem && !isDestino;

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
                        <View
                          style={[
                            styles.numberBox,
                            isDestino
                              ? styles.lastNumberBoxHighlight
                              : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberText,
                              isDestino
                                ? styles.lastNumberTextHighlight
                                : null,
                            ]}
                          >
                            {index}
                          </Text>
                        </View>
                      )}
                    </View>

                    {!isDestino && <View style={styles.verticalLine} />}
                  </View>

                  {/* INPUT */}
                  <View
                    style={[
                      styles.searchInput,
                      isDestino && styles.searchInputDestination,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.inputTouchable}
                      onPress={() => handleInputClick(index)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          !item.name && styles.placeholderText
                        ]}
                        numberOfLines={1}
                      >
                        {item.name || 'Adicionar parada'}
                      </Text>
                    </TouchableOpacity>

                    {isDestino && podeAdicionarParada && (
                      <TouchableOpacity
                        onPress={adicionarParada}
                        style={styles.addButtonInline}
                      >
                        <Ionicons name="add" size={20} color="#666" />
                      </TouchableOpacity>
                    )}

                    {isParada && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => moverParaCima(index)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="chevron-up" size={16} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => moverParaBaixo(index)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="chevron-down" size={16} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => removerParada(index)}
                          style={styles.removeButtonInline}
                        >
                          <Ionicons name="close" size={20} color="#777" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* LISTA DE ENDEREÇOS SUGERIDOS */}
          {listaEnderecos.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {listaEnderecos.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionItem}
                  onPress={() => handleSelecionarEndereco(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionAddress}>
                      {item.formattedAddress}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* LOADING SKELETON */}
          {loading && (
            <View style={styles.skeletonContainer}>
              <Animated.View
                style={[
                  styles.skeletonItem,
                  { opacity: skeletonOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.skeletonItem,
                  { opacity: skeletonOpacity, marginTop: 12 },
                ]}
              />
            </View>
          )}

          {/* BOTÃO CONFIRMAR */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmar}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: "#DDD",
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  backButton: {
    marginTop: 10,
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
  numberBox: {
    width: 20,
    height: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  lastNumberBoxHighlight: {
    backgroundColor: "#FF5500",
  },
  lastNumberTextHighlight: {
    color: "#FFF",
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
  inputTouchable: {
    flex: 1,
    paddingVertical: 12,
  },
  inputText: {
    fontSize: 17,
    color: "#111",
    fontWeight: "500",
  },
  placeholderText: {
    color: "#999",
    fontWeight: "400",
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
  removeButtonInline: {
    padding: 4,
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginRight: 4,
    padding: 4,
  },
  suggestionsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  suggestionAddress: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  skeletonContainer: {
    marginTop: 16,
    paddingTop: 16,
  },
  skeletonItem: {
    height: 60,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  confirmButton: {
    backgroundColor: "#FFD200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
});