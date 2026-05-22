// components/ViagemComParada.tsx
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FolhaBuscarEndereco from "@/components/FolhaBuscarEndereco";

const CACHE_KEY = "@last_user_location";
const MAX_PARADAS = 4;

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

export default function ViagemComParada({
  visible,
  onClose,
  onAdicionarParada,
}: props) {
  const [isMounted, setIsMounted] = useState(visible);

  const [inputsIntinerario, setInputsIntinerario] = useState<EnderecoItem[]>(
    InputsIntinearioInicial,
  );

  const [showFolhaBuscarEndereco, setShowFolhaBuscarEndereco] = useState(false);

  const [inputSelecionadoIndex, setInputSelecionadoIndex] = useState<
    number | null
  >(null);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => {
    const baseHeight = 48;

    const additionalHeight = (inputsIntinerario.length - 2) * 5;

    const totalHeight = Math.min(baseHeight + additionalHeight, 85);

    return [`${totalHeight}%`];
  }, [inputsIntinerario.length]);

  const reorganizarOrders = (lista: EnderecoItem[]) => {
    return lista.map((item, index) => ({
      ...item,
      order: index,
    }));
  };

  const handleSheetStateChange = useCallback((index: number) => {
    if (index === -1) {
      setShowFolhaBuscarEndereco(false);
    }
  }, []);

  const handleInputClick = (index: number) => {
    setInputSelecionadoIndex(index);

    setShowFolhaBuscarEndereco(true);
  };

  const handleSelecionarEndereco = (endereco: EnderecoItem) => {
    if (inputSelecionadoIndex === null) {
      return;
    }

    setInputsIntinerario((prev) =>
      prev.map((item, index) =>
        index === inputSelecionadoIndex
          ? {
              ...item,
              ...endereco,
              order: index,
            }
          : item,
      ),
    );
    console.log(inputsIntinerario, "inputsIntinerarioinputsIntinerario");
    adicionarParada();
    setShowFolhaBuscarEndereco(false);
  };

  const adicionarParada = () => {
    const maxInputs = MAX_PARADAS + 1;

    if (inputsIntinerario.length >= maxInputs) {
      return;
    }

    setInputsIntinerario((prev) => {
      const novaLista = [...prev];

      const ultimoIndex = novaLista.length - 1;

      const ultimoDestino = {
        ...novaLista[ultimoIndex],
      };

      // novo input vazio que será o novo destino
      const novoDestinoVazio: EnderecoItem = {
        name: "",
        formattedAddress: "",
        latitude: 0,
        longitude: 0,
        distancia: "0km",
        order: 0,
      };

      // substitui o último pelo novo destino vazio
      novaLista[ultimoIndex] = novoDestinoVazio;

      // adiciona a parada antes do destino
      novaLista.splice(ultimoIndex, 0, ultimoDestino);

      return reorganizarOrders(novaLista);
    });

    if (onAdicionarParada) {
      onAdicionarParada();
    }
  };

  const podeAdicionarParada = inputsIntinerario.length < MAX_PARADAS + 1;

  const removerParada = (index: number) => {
    if (index === 0) return;

    const isUltimoItem = index === inputsIntinerario.length - 1;

    if (isUltimoItem && podeAdicionarParada) {
      return;
    }

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

  const handleConfirmar = () => {
    console.log("Rota confirmada:", inputsIntinerario);
  };

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
      console.log("Erro ao recuperar endereço:", error);
    }
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

      bottomSheetRef.current?.snapToIndex(0);
    } else {
      setIsMounted(false);

      setInputsIntinerario(InputsIntinearioInicial);

      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isMounted) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 30 }]}
    >
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
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            <View style={{ width: 24 }} />
          </View>

          <View style={{ padding: 10 }} />

          <Text style={styles.title}>Adicionar paradas</Text>

          <View style={styles.searchContainer}>
            {inputsIntinerario.map((item, index) => {
              const isOrigem = index === 0;

              const isDestino = index === inputsIntinerario.length - 1;

              const atingiuMaxParadas =
                inputsIntinerario.length >= MAX_PARADAS + 1;

              const isParada = !isOrigem && !isDestino;

              const mostrarAcoesDestinoFinal = isDestino && atingiuMaxParadas;

              return (
                <View key={index} style={styles.rowContainer}>
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
                            isDestino ? styles.lastNumberBoxHighlight : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.numberText,
                              isDestino ? styles.lastNumberTextHighlight : null,
                            ]}
                          >
                            {index}
                          </Text>
                        </View>
                      )}
                    </View>

                    {!isDestino && <View style={styles.verticalLine} />}
                  </View>

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
                          !item.name && styles.placeholderText,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name || "Adicionar parada"}
                      </Text>
                    </TouchableOpacity>

                    {(isParada || mostrarAcoesDestinoFinal) && (
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
                          disabled={isDestino}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={16}
                            color="#999"
                          />
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

      <FolhaBuscarEndereco
        visible={showFolhaBuscarEndereco}
        onClose={() => setShowFolhaBuscarEndereco(false)}
        onSheetChange={handleSheetStateChange}
        servico={"corrida"}
        onSelecionarEndereco={handleSelecionarEndereco}
      />
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
