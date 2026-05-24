// components/ViagemComParada.tsx
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
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

const MAX_PARADAS = 4;

export interface EnderecoItem {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string;
  order: number;
}

interface props {
  visible: boolean;
  onClose: () => void;
  onAdicionarParada?: () => void;
  duration?: number;
  onShowBuscarEndereco?: (visible: boolean) => void;

  // 🔥 NOVO
  itinerario: EnderecoItem[];
  setItinerario: React.Dispatch<
    React.SetStateAction<EnderecoItem[]>
  >;

  onMapPaddingChange?: (
    padding: number,
  ) => void;
}

export default function ViagemComParada({
  onMapPaddingChange,
  visible,
  onClose,
  onAdicionarParada,
  onShowBuscarEndereco,

  // 🔥 NOVO
  itinerario,
  setItinerario,
}: props) {
  const [isMounted, setIsMounted] =
    useState(visible);

  const [
    showFolhaBuscarEndereco,
    setShowFolhaBuscarEndereco,
  ] = useState(false);

  const [
    inputSelecionadoIndex,
    setInputSelecionadoIndex,
  ] = useState<number | null>(
    null,
  );

  const bottomSheetRef =
    useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => {
    const baseHeight = 40;

    const additionalHeight =
      (itinerario.length - 2) * 5;

    const totalHeight = Math.min(
      baseHeight + additionalHeight,
      85,
    );

    return [`${totalHeight}%`];
  }, [itinerario.length]);

  const reorganizarOrders = (
    lista: EnderecoItem[],
  ) => {
    return lista.map((item, index) => ({
      ...item,
      order: index,
    }));
  };

  const handleSheetStateChange =
    useCallback((index: number) => {
      if (index === -1) {
        setShowFolhaBuscarEndereco(
          false,
        );
      }
    }, []);

  const handleInputClick = (
    index: number,
  ) => {
    setInputSelecionadoIndex(index);

    setShowFolhaBuscarEndereco(
      true,
    );
    onShowBuscarEndereco?.(true);
  };

  // 🔥 PRINCIPAL MUDANÇA:
  // agora altera o itinerário vindo do HOME
  const handleSelecionarEndereco =
    (endereco: EnderecoItem) => {
      if (
        inputSelecionadoIndex ===
        null
      ) {
        return;
      }

      setItinerario((prev) => {
        let novaLista = prev.map(
          (item, index) =>
            index ===
              inputSelecionadoIndex
              ? {
                ...item,
                ...endereco,
                order: index,
              }
              : item,
        );

        const ultimoItem =
          novaLista[
          novaLista.length - 1
          ];

        const possuiInputVazio =
          novaLista.some(
            (item) => !item.name,
          );

        // 🔥 mantém sempre um input vazio
        if (
          ultimoItem.name &&
          !possuiInputVazio &&
          novaLista.length <
          MAX_PARADAS + 1
        ) {
          novaLista.push({
            name: "",
            formattedAddress: "",
            latitude: 0,
            longitude: 0,
            distancia: "0km",
            order: 0,
          });
        }

        return reorganizarOrders(
          novaLista,
        );
      });

      setShowFolhaBuscarEndereco(
        false,
      );
      onShowBuscarEndereco?.(false);
    };

  const removerParada = (
    index: number,
  ) => {
    if (index === 0) return;

    setItinerario((prev) => {
      let novaLista = prev.filter(
        (_, i) => i !== index,
      );

      // garante mínimo
      if (novaLista.length === 1) {
        novaLista.push({
          name: "",
          formattedAddress: "",
          latitude: 0,
          longitude: 0,
          distancia: "0km",
          order: 1,
        });
      }

      const possuiInputVazio =
        novaLista.some(
          (item) => !item.name,
        );

      // 🔥 mantém placeholder
      if (
        novaLista.length <
        MAX_PARADAS + 1 &&
        !possuiInputVazio
      ) {
        novaLista.push({
          name: "",
          formattedAddress: "",
          latitude: 0,
          longitude: 0,
          distancia: "0km",
          order: 0,
        });
      }

      return reorganizarOrders(
        novaLista,
      );
    });
  };

  const handleConfirmar = () => {
    console.log(
      "Rota confirmada:",
      itinerario,
    );
  };

  useEffect(() => {
    const padding =
      360 + itinerario.length * 45;

    onMapPaddingChange?.(
      padding,
    );
  }, [itinerario.length]);

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

    return () =>
      subscription.remove();
  }, [visible, onClose]);

  // 🔥 IMPORTANTE:
  // não reseta mais o itinerário
  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      bottomSheetRef.current?.snapToIndex(
        0,
      );
    } else {
      setIsMounted(false);

      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChange =
    useCallback(
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
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 30 },
      ]}
    >
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={
          false
        }
        onChange={
          handleSheetChange
        }
        overDragResistanceFactor={
          13
        }
        enablePanDownToClose={
          false
        }
        backgroundStyle={
          styles.bottomSheetBackground
        }
        handleIndicatorStyle={
          styles.handleIndicator
        }
      >
        <BottomSheetView
          style={
            styles.contentContainer
          }
        >
          <View style={styles.containerTitle}>
            <Text style={styles.title}>
              Adicionar paradas
            </Text>
          </View>
          <View
            style={
              styles.searchContainer
            }
          >
            {itinerario.map(
              (item, index) => {
                const isOrigem =
                  index === 0;

                const isDestino =
                  index ===
                  itinerario.length -
                  1;

                return (
                  <View
                    key={index}
                    style={
                      styles.rowContainer
                    }
                  >
                    <View
                      style={
                        styles.lineContainer
                      }
                    >
                      <View
                        style={
                          styles.markerWrapper
                        }
                      >
                        {isOrigem ? (
                          <View
                            style={
                              styles.startOuterCircle
                            }
                          >
                            <View
                              style={
                                styles.startInnerCircle
                              }
                            />
                          </View>
                        ) : isDestino &&
                          !item.name ? (
                          <View
                            style={[
                              styles.numberBox,
                              styles.lastNumberBoxHighlight,
                            ]}
                          >
                            <Ionicons
                              name="add"
                              size={18}
                              color="#FFF"
                            />
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

                      {!isDestino && (
                        <View
                          style={
                            styles.verticalLine
                          }
                        />
                      )}
                    </View>

                    <View
                      style={[
                        styles.searchInput,
                        isDestino &&
                        styles.searchInputDestination,
                      ]}
                    >
                      <TouchableOpacity
                        style={
                          styles.inputTouchable
                        }
                        onPress={() =>
                          handleInputClick(
                            index,
                          )
                        }
                        activeOpacity={
                          0.7
                        }
                      >
                        <Text
                          style={[
                            styles.inputText,
                            !item.name &&
                            styles.placeholderText,
                          ]}
                          numberOfLines={
                            1
                          }
                        >
                          {item.name ||
                            "Adicionar parada"}
                        </Text>
                      </TouchableOpacity>

                      {!isOrigem &&
                        item.name && (
                          <View
                            style={
                              styles.actionButtons
                            }
                          >
                            <TouchableOpacity
                              onPress={() =>
                                removerParada(
                                  index,
                                )
                              }
                              style={
                                styles.removeButtonInline
                              }
                            >
                              <Ionicons
                                name="close"
                                size={20}
                                color="#777"
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  </View>
                );
              },
            )}
          </View>

          <View
            style={
              styles.buttonContainer
            }
          >
            <TouchableOpacity
              style={
                styles.confirmButton
              }
              onPress={
                handleConfirmar
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.confirmButtonText
                }
              >
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <FolhaBuscarEndereco
        visible={
          showFolhaBuscarEndereco
        }
        onClose={() => {
          setShowFolhaBuscarEndereco(
            false,
          );
          onShowBuscarEndereco?.(
            false,
          );
        }}
        onSheetChange={
          handleSheetStateChange
        }
        servico={"corrida"}
        onSelecionarEndereco={
          handleSelecionarEndereco
        }
      />
    </View >
  );
}

const styles = StyleSheet.create({
  containerTitle: {
    alignItems: "center",
  },
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
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
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
