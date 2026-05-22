import DetalhesEntrega from "@/components/DetalhesEntrega";
import { api } from "@/Services/api";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

import AsyncStorage from "@react-native-async-storage/async-storage";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EnderecoItem {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSheetChange: (index: number) => void;
  servico: string;

  onSelecionarEndereco: (
    endereco: EnderecoItem,
  ) => void;
}

const CACHE_HISTORICO_KEY =
  "@historico_enderecos";

const enderecosPadrao: EnderecoItem[] = [
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

export default function FolhaBuscarEndereco({
  visible,
  onClose,
  onSheetChange,
  servico,
  onSelecionarEndereco,
}: Props) {
  const snapPoints = useMemo(
    () => ["89%"],
    [],
  );

  const sheetRef = useRef<BottomSheet>(null);

  const inputRef = useRef<any>(null);

  const skeletonOpacity = useRef(
    new Animated.Value(0.4),
  ).current;

  const [showDetalhesEntrega, setShowDetalhesEntrega] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [historicoCache, setHistoricoCache] =
    useState<EnderecoItem[]>([]);

  const [listaEnderecos, setListaEnderecos] =
    useState<EnderecoItem[]>([]);

  const [endereco, setEndereco] =
    useState("");

  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const carregarHistoricoCache =
    async () => {
      try {
        const cachedData =
          await AsyncStorage.getItem(
            CACHE_HISTORICO_KEY,
          );

        if (cachedData) {
          setHistoricoCache(
            JSON.parse(cachedData),
          );
        } else {
          setHistoricoCache(
            enderecosPadrao,
          );

          await AsyncStorage.setItem(
            CACHE_HISTORICO_KEY,
            JSON.stringify(
              enderecosPadrao,
            ),
          );
        }
      } catch (error) {
        console.log(
          "Erro ao carregar histórico do cache:",
          error,
        );

        setHistoricoCache(
          enderecosPadrao,
        );
      }
    };

  useEffect(() => {
    if (visible) {
      carregarHistoricoCache();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setEndereco("");
      setListaEnderecos([]);
    }
  }, [visible]);

  useEffect(() => {
    let animationLoop:
      | Animated.CompositeAnimation
      | null = null;

    if (loading) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(
            skeletonOpacity,
            {
              toValue: 0.8,
              duration: 600,
              useNativeDriver: true,
            },
          ),

          Animated.timing(
            skeletonOpacity,
            {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            },
          ),
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

  const buscarEnderecoApi = async (
    texto: string,
  ) => {
    if (
      !texto ||
      texto.trim().length === 0
    ) {
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

        const novoEnderecoObjeto: EnderecoItem =
        {
          name,
          formattedAddress,
          latitude,
          longitude,
          distancia: "--",
        };

        setListaEnderecos([
          novoEnderecoObjeto,
        ]);
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
    const delayDebounceFn =
      setTimeout(() => {
        if (visible) {
          buscarEnderecoApi(
            endereco,
          );
        }
      }, 600);

    return () =>
      clearTimeout(delayDebounceFn);
  }, [endereco, visible]);

  const salvarEnderecoNoCache =
    async (
      novoEndereco: EnderecoItem,
    ) => {
      try {
        const historicoFiltrado =
          historicoCache.filter(
            (item) =>
              item.formattedAddress !==
              novoEndereco.formattedAddress,
          );

        const novoHistorico = [
          novoEndereco,
          ...historicoFiltrado,
        ];

        const historicoLimitado =
          novoHistorico.slice(0, 10);

        setHistoricoCache(
          historicoLimitado,
        );

        await AsyncStorage.setItem(
          CACHE_HISTORICO_KEY,
          JSON.stringify(
            historicoLimitado,
          ),
        );
      } catch (error) {
        console.log(
          "Erro ao salvar endereço no cache:",
          error,
        );
      }
    };

  const removerEnderecoDoCache =
    async (
      enderecoParaRemover: EnderecoItem,
    ) => {
      try {
        const historicoAtualizado =
          historicoCache.filter(
            (item) =>
              item.formattedAddress !==
              enderecoParaRemover.formattedAddress,
          );

        setHistoricoCache(
          historicoAtualizado,
        );

        await AsyncStorage.setItem(
          CACHE_HISTORICO_KEY,
          JSON.stringify(
            historicoAtualizado,
          ),
        );
      } catch (error) {
        console.log(
          "Erro ao remover endereço do cache:",
          error,
        );
      }
    };

  const confirmarEndereco =
    useCallback(
      async (
        item: EnderecoItem,
      ) => {
        setEndereco(item.name);

        await salvarEnderecoNoCache(
          item,
        );

        setListaEnderecos([]);

        onSelecionarEndereco(item);

        onClose();

        if (servico === "corrida") {
          return;
        }

        setShowDetalhesEntrega(true);
      },
      [
        servico,
        historicoCache,
        onSelecionarEndereco,
        onClose,
      ],
    );

  const listaExibicao =
    listaEnderecos.length > 0
      ? listaEnderecos
      : historicoCache;

  const renderEnderecoItem = ({
    item,
  }: {
    item: EnderecoItem;
  }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      activeOpacity={0.7}
      onPress={() =>
        confirmarEndereco(item)
      }
    >
      <TouchableOpacity
        style={styles.iconCircle}
        onPress={() =>
          removerEnderecoDoCache(item)
        }
      >
        <Ionicons
          name="close"
          size={16}
          color="#fff"
        />
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <View style={styles.rowBetween}>
          <Text
            style={styles.localTitle}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={styles.distanciaText}
          >
            {item.distancia}
          </Text>
        </View>

        <Text
          style={styles.subtituloText}
          numberOfLines={2}
        >
          {item.formattedAddress}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSkeletonItem = (
    _: unknown,
    index: number,
  ) => (
    <Animated.View
      key={index}
      style={[
        styles.itemContainer,
        {
          opacity: skeletonOpacity,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor:
              "#EAEAEA",
          },
        ]}
      />

      <View
        style={styles.textContainer}
      >
        <View
          style={{
            width: "60%",
            height: 14,
            backgroundColor:
              "#EBEBEB",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />

        <View
          style={{
            width: "90%",
            height: 10,
            backgroundColor:
              "#EBEBEB",
            borderRadius: 4,
          }}
        />
      </View>
    </Animated.View>
  );

  const ListHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutItem}
        >
          <MaterialCommunityIcons
            name="office-building"
            size={20}
            color="#666"
          />

          <Text
            style={styles.shortcutText}
          >
            Avenida Bo...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutItem}
        >
          <MaterialCommunityIcons
            name="briefcase"
            size={20}
            color="#666"
          />

          <Text
            style={styles.shortcutText}
          >
            Trabalho
          </Text>

          <Ionicons
            name="chevron-forward"
            size={14}
            color="#CCC"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutItem}
        >
          <MaterialCommunityIcons
            name="star"
            size={20}
            color="#666"
          />

          <Text
            style={styles.shortcutText}
          >
            Favoritos
          </Text>

          <Ionicons
            name="chevron-forward"
            size={14}
            color="#CCC"
          />
        </TouchableOpacity>
      </View>

      <View
        style={styles.dividerFull}
      />
    </View>
  );

  const ListFooter = () => (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.footerItem}
      >
        <MaterialIcons
          name="location-on"
          size={24}
          color="#CCC"
          style={styles.footerIcon}
        />

        <Text
          style={styles.footerText}
        >
          Marque o local no mapa
        </Text>
      </TouchableOpacity>

      <View
        style={styles.dividerFooter}
      />

      <TouchableOpacity
        style={styles.footerItem}
      >
        <Ionicons
          name="add"
          size={24}
          color="#CCC"
          style={styles.footerIcon}
        />

        <Text
          style={styles.footerText}
        >
          Adicionar local
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.footerItem}
      >
        <MaterialIcons
          name="edit"
          size={20}
          color="#CCC"
          style={styles.footerIcon}
        />

        <Text
          style={styles.footerText}
        >
          Sugerir alteração de local
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.footerItem}
      >
        <MaterialIcons
          name="chat-bubble-outline"
          size={20}
          color="#CCC"
          style={styles.footerIcon}
        />

        <Text
          style={styles.footerText}
        >
          Outros comentários
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <>
      <DetalhesEntrega
        visible={
          showDetalhesEntrega
        }
        onClose={() =>
          setShowDetalhesEntrega(
            false,
          )
        }
      />

      <View style={StyleSheet.absoluteFill}>
        <BottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          overDragResistanceFactor={
            13
          }
          enablePanDownToClose={
            true
          }
          onChange={onSheetChange}
          handleIndicatorStyle={{
            backgroundColor:
              "#DDD",
            width: 40,
          }}
          enableOverDrag={false}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
        >
          <>
            <View
              style={styles.searchHeader}
            >
              <View
                style={styles.inputWrapper}
              >
                <MaterialCommunityIcons
                  name="flag-variant"
                  size={20}
                  color="#000"
                  style={styles.flagIcon}
                />

                <BottomSheetTextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Endereço"
                  placeholderTextColor="#CCC"
                  value={endereco}
                  onChangeText={(
                    texto,
                  ) => {
                    setEndereco(
                      texto,
                    );
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={onClose}
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View>
                <ListHeader />

                {Array.from({
                  length: 4,
                }).map(
                  renderSkeletonItem,
                )}

                <ListFooter />
              </View>
            ) : (
              <BottomSheetFlatList
                data={listaExibicao}
                keyExtractor={(
                  item: EnderecoItem,
                  index: number,
                ) =>
                  `${item.formattedAddress}-${index}`
                }
                renderItem={
                  renderEnderecoItem
                }
                ListHeaderComponent={
                  ListHeader
                }
                ListFooterComponent={
                  ListFooter
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              />
            )}
          </>
        </BottomSheet>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },

  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  flagIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },

  cancelText: {
    fontSize: 16,
    color: "#666",
  },

  headerContent: {
    marginTop: 10,
  },

  shortcutsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 15,
    justifyContent: "space-between",
  },

  shortcutItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 4,
  },

  shortcutText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  dividerFull: {
    height: 1,
    backgroundColor: "#F0F0F0",
    width: "100%",
  },

  itemContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 15,
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
    paddingBottom: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  localTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },

  distanciaText: {
    fontSize: 12,
    color: "#AAA",
  },

  subtituloText: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
    lineHeight: 18,
  },

  footerContainer: {
    marginTop: 10,
    borderTopWidth: 8,
    borderTopColor: "#F8F8F8",
  },

  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  footerIcon: {
    marginRight: 15,
  },

  footerText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },

  dividerFooter: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 55,
  },
});