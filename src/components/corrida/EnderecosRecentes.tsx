// components/EnderecosRecentes.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
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
  distancia: string | number;
}

interface EnderecosRecentesProps {
  loading: boolean;
  skeletonOpacity: Animated.Value;
  listaEnderecos: EnderecoItem[]; // Resultados vindos da busca da API no Pai
  onSelecionarEndereco: (item: EnderecoItem) => void;
}

// Criamos uma interface para expor a função de salvar para o componente Pai
export interface EnderecosRecentesRef {
  salvarEnderecoNoCache: (novoEndereco: EnderecoItem) => Promise<void>;
}

const CACHE_HISTORICO_KEY = "@historico_enderecos";

// Lista base estática padrão caso o cache esteja vazio
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

const EnderecosRecentes = forwardRef<
  EnderecosRecentesRef,
  EnderecosRecentesProps
>(({ loading, skeletonOpacity, listaEnderecos, onSelecionarEndereco }, ref) => {
  const [historicoCache, setHistoricoCache] = useState<EnderecoItem[]>([]);

  // Carrega o histórico do cache ao montar o componente
  const carregarHistoricoCache = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_HISTORICO_KEY);
      if (cachedData) {
        setHistoricoCache(JSON.parse(cachedData));
      } else {
        // Se não houver cache, inicializa com a lista padrão e salva
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

  useEffect(() => {
    carregarHistoricoCache();
  }, []);

  // Método para apagar o endereço selecionado do cache
  const removerEnderecoDoCache = async (enderecoParaRemover: EnderecoItem) => {
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
      console.log("🗑️ Endereço removido do cache com sucesso!");
    } catch (error) {
      console.log("Erro ao remover endereço do cache:", error);
    }
  };

  // Expõe a função de salvar para ser chamada pelo componente Pai no handleSelecionarEndereco
  useImperativeHandle(ref, () => ({
    salvarEnderecoNoCache: async (novoEndereco: EnderecoItem) => {
      try {
        // Filtra para remover duplicados do mesmo endereço formatado (se houver)
        const historicoFiltrado = historicoCache.filter(
          (item) => item.formattedAddress !== novoEndereco.formattedAddress,
        );

        // Coloca o novo endereço no topo da lista histórica
        const novoHistorico = [novoEndereco, ...historicoFiltrado];

        // Limita o histórico a 10 itens para não sobrecarregar o cache
        const historicoLimitado = novoHistorico.slice(0, 10);

        setHistoricoCache(historicoLimitado);
        await AsyncStorage.setItem(
          CACHE_HISTORICO_KEY,
          JSON.stringify(historicoLimitado),
        );
      } catch (error) {
        console.log("Erro ao salvar endereço no cache:", error);
      }
    },
  }));

  // Define a lista final combinando o que veio da busca (API) + o histórico salvo em cache
  // Se houver texto digitado (listaEnderecos populada pelo pai), ela ganha prioridade visual
  const listaExibicao =
    listaEnderecos.length > 0 ? listaEnderecos : historicoCache;

  return (
    <View style={styles.container}>
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

      {/* DIVIDER */}
      <View style={styles.divider} />

      {/* LISTA / SKELETON LOAD */}
      <View style={styles.list}>
        {loading
          ? Array.from({
              length: 4,
            }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.listItem,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              >
                <View
                  style={[
                    styles.listIconContainer,
                    {
                      backgroundColor: "#EBEBEB",
                    },
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
                onPress={() => onSelecionarEndereco(endereco)}
              >
                <TouchableOpacity
                  style={styles.listIconContainer}
                  onPress={() => removerEnderecoDoCache(endereco)}
                >
                  {/* <Ionicons name="time" size={14} color="#111" /> */}
                  <Ionicons name="close" size={14} color="#111" />
                </TouchableOpacity>

                <View style={styles.listContent}>
                  <Text style={styles.listText}>{endereco.name}</Text>

                  <Text style={styles.listSubText}>
                    {endereco.formattedAddress}
                  </Text>
                </View>

                <Text style={styles.distanceText}>{endereco.distancia}</Text>
              </TouchableOpacity>
            ))}
      </View>
    </View>
  );
});

export default EnderecosRecentes;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
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
});
