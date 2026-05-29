import { InterfaceEndereco } from "@/app/(main)/home";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EnderecoObjeto {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  distancia: string;
}

interface Props {
  onSheetChange: (index: number) => void;
  partida: EnderecoObjeto | null;
  destino: EnderecoObjeto | null;
  onClose: () => void;
  itinerario?: InterfaceEndereco[];
}

interface CategoriaItem {
  id: string;
  titulo: string;
  subtitulo: string;
  preco: string;
  tempo: string;
  tipo: "carro" | "moto" | "taxi" | "entrega";
  selecionado?: boolean;
  negociavel?: boolean;
  iconeDireita?: "check" | "circle" | "arrow";
}

// Componente Skeleton para cada item da lista
const SkeletonItem = ({ animatedValue }: { animatedValue: Animated.Value }) => {
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View style={[styles.itemContainer, { opacity }]}>
      <View style={styles.leftContainer}>
        <Animated.View style={[styles.skeletonIcon, { opacity }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Animated.View style={[styles.skeletonTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonBadge, { opacity }]} />
            <Animated.View style={[styles.skeletonDot, { opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonSubtitle, { opacity }]} />
        </View>
      </View>
      <View style={styles.rightContainer}>
        <Animated.View style={[styles.skeletonPrice, { opacity }]} />
        <Animated.View style={[styles.skeletonCheckbox, { opacity }]} />
      </View>
    </Animated.View>
  );
};

// Componente Skeleton para o FixedBottom
const SkeletonFixedBottom = ({ animatedValue }: { animatedValue: Animated.Value }) => {
  const insets = useSafeAreaInsets();
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View
      style={[
        styles.fixedBottom,
        { paddingBottom: Math.max(insets.bottom + 10, 24) },
      ]}
    >
      <TouchableOpacity style={styles.cartaoContainer} activeOpacity={1}>
        <View style={styles.cartaoLeft}>
          <Animated.View style={[styles.skeletonCardIcon, { opacity }]} />
          <Animated.View style={[styles.skeletonCardText, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonChevron, { opacity }]} />
      </TouchableOpacity>
      <View style={styles.footer}>
        <Animated.View style={[styles.skeletonValorFooter, { opacity }]} />
        <Animated.View style={[styles.skeletonBotaoSolicitar, { opacity }]}>
          <Animated.View style={[styles.skeletonBotaoTexto, { opacity }]} />
          <Animated.View style={[styles.skeletonBotaoSubTexto, { opacity }]} />
        </Animated.View>
      </View>
    </View>
  );
};

export default function FolhaEscolherOferta({
  onSheetChange,
  partida,
  destino,
  onClose,
  itinerario = [],
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const animatedValue = useRef(new Animated.Value(0)).current;

  const snapPoints = useMemo(() => ["40%", "70%"], []);

  // Simulação de requisição
  const fetchOfertas = useCallback(async () => {
    setIsLoading(true);
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Dados mockados
    const mockCategorias: CategoriaItem[] = [
      {
        id: "1",
        titulo: "Negocia",
        subtitulo: "Negocie e escolha",
        preco: "35,80",
        tempo: "4 min",
        tipo: "carro",
        negociavel: true,
      },
      {
        id: "2",
        titulo: "Pop",
        subtitulo: "11:01 · 4 min",
        preco: "15,40",
        tempo: "4 min",
        tipo: "carro",
        selecionado: true,
        iconeDireita: "check",
      },
      {
        id: "3",
        titulo: "Moto",
        subtitulo: "11:02 · 4 min",
        preco: "8,37",
        tempo: "4 min",
        tipo: "moto",
        iconeDireita: "circle",
      },
      {
        id: "4",
        titulo: "Pop Expresso",
        subtitulo: "11:01 · 2 min",
        preco: "17,71",
        tempo: "2 min",
        tipo: "carro",
        iconeDireita: "circle",
      },
      {
        id: "5",
        titulo: "Moto Negocia",
        subtitulo: "",
        preco: "9,30",
        tempo: "4 min",
        tipo: "moto",
        negociavel: true,
      },
      {
        id: "6",
        titulo: "Táxi",
        subtitulo: "11:03 · 4 min",
        preco: "30,58",
        tempo: "4 min",
        tipo: "taxi",
        iconeDireita: "circle",
      },
      {
        id: "7",
        titulo: "Entrega Moto",
        subtitulo: "11:06 · 6 min",
        preco: "8,20",
        tempo: "6 min",
        tipo: "entrega",
        iconeDireita: "arrow",
      },
    ];
    
    setCategorias(mockCategorias);
    // Define a categoria selecionada como a que tem selecionado: true
    const selectedItem = mockCategorias.find(cat => cat.selecionado);
    if (selectedItem) {
      setCategoriaSelecionada(selectedItem.id);
    }
    setIsLoading(false);
  }, []);

  // Inicia a animação do skeleton
  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, []);

  // Chama a requisição quando o componente monta
  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  const valorSelecionadoExibicao = useMemo(() => {
    const itemAtivo = categorias.find((cat) => cat.id === categoriaSelecionada);
    return itemAtivo ? `R$${itemAtivo.preco}` : "R$0,00";
  }, [categoriaSelecionada, categorias]);

  const nomeSelecionadoExibicao = useMemo(() => {
    const itemAtivo = categorias.find((cat) => cat.id === categoriaSelecionada);
    return itemAtivo ? itemAtivo.titulo : "Solicitar";
  }, [categoriaSelecionada, categorias]);

  const handleSheetChange = useCallback(
    (index: number) => {
      onSheetChange(index);
    },
    [onSheetChange],
  );

  const handleNegociacaoClick = (item: CategoriaItem, acao: string) => {
    console.log(itinerario, 'itinerario');
    console.log("chegou aqui", {
      item: item.titulo,
      preco: item.preco,
      tipo: item.tipo,
      acao: acao,
    });
  };

  const renderIcone = (tipo: string) => {
    switch (tipo) {
      case "carro":
        return (
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
            }}
            style={styles.veiculoImagem}
          />
        );
      case "moto":
        return (
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
            }}
            style={styles.veiculoImagem}
          />
        );
      case "taxi":
        return (
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3097/3097144.png",
            }}
            style={styles.veiculoImagem}
          />
        );
      case "entrega":
        return (
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
            }}
            style={styles.veiculoImagem}
          />
        );
      default:
        return null;
    }
  };

  const renderNegociacao = (item: CategoriaItem) => {
    return (
      <View style={styles.negociacaoContainer}>
        <TouchableOpacity
          style={styles.negociacaoButton}
          onPress={() => handleNegociacaoClick(item, "decrement")}
          activeOpacity={0.7}
        >
          <Text style={styles.negociacaoButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.negociacaoValor}>R${item.preco}</Text>
        <TouchableOpacity
          style={styles.negociacaoButton}
          onPress={() => handleNegociacaoClick(item, "increment")}
          activeOpacity={0.7}
        >
          <Text style={styles.negociacaoButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCheckbox = (selecionado: boolean) => {
    if (selecionado) {
      return (
        <View style={styles.checkboxSelecionado}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      );
    }
    return <View style={styles.checkboxDesmarcado} />;
  };

  const renderRightIcon = (item: CategoriaItem, selecionado: boolean) => {
    if (item.negociavel) {
      return null;
    }
    if (item.iconeDireita === "arrow") {
      return <Ionicons name="arrow-forward" size={22} color="#1f1f1f" />;
    }
    return renderCheckbox(selecionado);
  };

  const deveRenderizarCapacidade = (item: CategoriaItem) => {
    return ["Negocia", "Pop", "Moto", "Pop Expresso", "Táxi"].includes(
      item.titulo,
    );
  };

  const deveRenderizarInfo = (item: CategoriaItem) => {
    return ["Negocia", "Pop", "Moto Negocia", "Entrega Moto"].includes(
      item.titulo,
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: CategoriaItem }) => {
      const selecionado = categoriaSelecionada === item.id;
      const isNegociavel = item.negociavel === true;

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.itemContainer}
          onPress={() => {
            if (isNegociavel) {
              handleNegociacaoClick(item, "selecionar");
            } else {
              setCategoriaSelecionada(item.id);
            }
          }}
        >
          <View style={styles.leftContainer}>
            {renderIcone(item.tipo)}
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.titulo,
                    isNegociavel && styles.tituloNegociavel,
                  ]}
                >
                  {item.titulo}
                </Text>
                {deveRenderizarCapacidade(item) && (
                  <>
                    <MaterialCommunityIcons
                      name="account"
                      size={14}
                      color="#111"
                      style={{ marginLeft: 4 }}
                    />
                    <View>
                      <Text>4</Text>
                    </View>
                  </>
                )}
                {deveRenderizarInfo(item) && (
                  <View style={styles.infoDot}>
                    <Ionicons name="information" size={10} color="#666" />
                  </View>
                )}
              </View>
              {!!item.subtitulo && (
                <Text style={styles.subtitulo}>{item.subtitulo}</Text>
              )}
            </View>
          </View>
          <View style={styles.rightContainer}>
            {isNegociavel ? (
              renderNegociacao(item)
            ) : (
              <>
                <Text style={styles.preco}>
                  {item.titulo === "Táxi" ? (
                    <Text style={styles.subtitulo}>aprox. </Text>
                  ) : null}
                  R${item.preco}
                </Text>
                {renderRightIcon(item, selecionado)}
              </>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [categoriaSelecionada],
  );

  // Renderiza o skeleton ou a lista real
  const renderContent = () => {
    if (isLoading) {
      // Mostra 7 skeletons (mesmo número de itens da lista)
      return (
        <>
          {[...Array(7)].map((_, index) => (
            <SkeletonItem key={`skeleton-${index}`} animatedValue={animatedValue} />
          ))}
        </>
      );
    }
    
    return (
      <BottomSheetFlatList
        data={categorias}
        keyExtractor={(item: CategoriaItem) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
    );
  };

  return (
    <View style={styles.container}>
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChange}
        overDragResistanceFactor={13}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: "#d1d5db",
          width: 42,
        }}
        backgroundStyle={{
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          backgroundColor: "#fff",
        }}
      >
        <View style={styles.listContainer}>
          {renderContent()}
        </View>
      </BottomSheet>

      {/* Renderiza o skeleton do fixedBottom ou o componente real */}
      {isLoading ? (
        <SkeletonFixedBottom animatedValue={animatedValue} />
      ) : (
        <View
          style={[
            styles.fixedBottom,
            { paddingBottom: Math.max(insets.bottom + 10, 24) },
          ]}
        >
          <TouchableOpacity style={styles.cartaoContainer}>
            <View style={styles.cartaoLeft}>
              <View style={styles.cartaoIcone}>
                <View style={styles.mastercardCircle1} />
                <View style={styles.mastercardCircle2} />
              </View>
              <Text style={styles.cartaoTexto}>3048</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#444" />
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={styles.valorFooter}>{valorSelecionadoExibicao}</Text>
            <TouchableOpacity
              style={styles.botaoSolicitar}
              onPress={() => {
                console.log("Chamando motorista para:", {
                  de: partida?.name,
                  para: destino?.name,
                  categoria: nomeSelecionadoExibicao,
                  valor: valorSelecionadoExibicao,
                });
              }}
            >
              <Text style={styles.botaoSolicitarTexto}>Solicitar</Text>
              <Text style={styles.botaoSolicitarSubTexto}>
                {nomeSelecionadoExibicao}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 170,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  veiculoImagem: {
    width: 42,
    height: 42,
    resizeMode: "contain",
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "400",
    color: "#111",
  },
  tituloNegociavel: {
    fontWeight: "500",
  },
  subtitulo: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "200",
    color: "#666",
  },
  infoDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#f1f1f1",
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  preco: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginRight: 10,
  },
  negociacaoValor: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    marginHorizontal: 8,
  },
  negociacaoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  negociacaoButton: {
    width: 25,
    height: 25,
    borderRadius: 5,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  negociacaoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  checkboxDesmarcado: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  checkboxSelecionado: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  cartaoContainer: {
    marginTop: 2,
    paddingVertical: 6,
    borderColor: "#ececec",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartaoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartaoIcone: {
    width: 34,
    height: 22,
    backgroundColor: "#111",
    borderRadius: 5,
    marginRight: 10,
    justifyContent: "center",
    paddingLeft: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  mastercardCircle1: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#EA001B",
    position: "absolute",
    left: 8,
  },
  mastercardCircle2: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F79E1B",
    position: "absolute",
    left: 14,
  },
  cartaoTexto: {
    marginLeft: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valorFooter: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  botaoSolicitar: {
    backgroundColor: "#f5d400",
    width: 190,
    height: 60,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoSolicitarTexto: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  botaoSolicitarSubTexto: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  footerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  fixedBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderColor: "#ececec",
    zIndex: 99,
  },
  // Estilos do Skeleton para os itens da lista
  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E1E9EE",
    marginRight: 12,
  },
  skeletonTitle: {
    width: 100,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
  },
  skeletonBadge: {
    width: 40,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
    marginLeft: 8,
  },
  skeletonDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E1E9EE",
    marginLeft: 6,
  },
  skeletonSubtitle: {
    width: 120,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
    marginTop: 6,
  },
  skeletonPrice: {
    width: 60,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
    marginRight: 10,
  },
  skeletonCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
  },
  // Estilos do Skeleton para o FixedBottom
  skeletonCardIcon: {
    width: 34,
    height: 22,
    borderRadius: 5,
    backgroundColor: "#E1E9EE",
    marginRight: 10,
  },
  skeletonCardText: {
    width: 60,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
    marginLeft: 20,
  },
  skeletonChevron: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
  },
  skeletonValorFooter: {
    width: 80,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#E1E9EE",
  },
  skeletonBotaoSolicitar: {
    width: 190,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#E1E9EE",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  skeletonBotaoTexto: {
    width: 80,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#CDD5DC",
  },
  skeletonBotaoSubTexto: {
    width: 100,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#CDD5DC",
  },
});