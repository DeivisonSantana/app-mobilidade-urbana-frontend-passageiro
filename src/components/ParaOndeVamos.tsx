// components/ParaOndeVamos.tsx
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

const { width } = Dimensions.get("window");
const CACHE_KEY = "@last_user_location";

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

const enderecos = [
  {
    endereco_formatado:
      "Rua Portuguesa, 6244 - Conjunto Jamari, Porto Velho - RO, 76812-612, Brasil",
    latitude: -8.7601,
    longitude: -63.9002,
    titulo: "Rua Portuguesa, 6244",
    subtitulo: "Conjunto Jamari, Porto Velho - RO, 76812-612, Brasil",
    distancia: "5.4km",
  },
  {
    endereco_formatado:
      "Rua Jobu Miró, 3287 - Flodoaldo Pontes Pinto, Porto Velho - RO, 76820-608, Brasil",
    latitude: -8.7523,
    longitude: -63.8891,
    titulo: "Rua Jobu Miró, 3287",
    subtitulo: "Flodoaldo Pontes Pinto, Porto Velho - RO, 76820-608, Brasil",
    distancia: "3.2km",
  },
  {
    endereco_formatado:
      "Rua Brasília, 2930 - São Cristóvão, Porto Velho - RO, 76804-070, Brasil",
    latitude: -8.7488,
    longitude: -63.8734,
    titulo: "Rua Brasília, 2930",
    subtitulo: "São Cristóvão, Porto Velho - RO, 76804-070, Brasil",
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

  const [isMounted, setIsMounted] = useState(visible);
  
  // 🔹 Estados para controlar os textos dos Inputs
  const [partidaTexto, setPartidaTexto] = useState("");
  const [destinoTexto, setDestinoTexto] = useState("");

  // 🔹 Recupera a localização do cache e alimenta o input de partida
  const carregarLocalizacaoSalva = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const locationData = JSON.parse(cached);
        console.log(locationData, 'locationData')
        // Se houver o endereço formatado injetado pelo mapa, alimenta o estado
        if (locationData && locationData.formattedAddress) {
          setPartidaTexto(locationData.formattedAddress);
        } else {
          setPartidaTexto("Localização Atual");
        }
      } else {
        setPartidaTexto("");
      }
    } catch (error) {
      console.log("Erro ao recuperar endereço para o input:", error);
      setPartidaTexto("");
    }
  };

  // Android back
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
      onBackPress
    );

    return () => subscription.remove();
  }, [visible, onClose]);

  // animations e busca de endereço
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      
      // 🔹 Busca o endereço do cache sempre que a tela abrir
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
      ]).start();
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
            {/* Usuário */}
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

        {/* INPUTS */}
        <View style={styles.searchContainer}>
          {/* Linha lateral */}
          <View style={styles.lineContainer}>
            <View style={styles.circleTop} />
            <View style={styles.verticalLine} />
            <View style={styles.circleBottom} />
          </View>

          <View style={styles.inputsContainer}>
            {/* PARTIDA */}
            <View style={styles.searchInput}>
              <Ionicons name="navigate-outline" size={18} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Local de partida"
                placeholderTextColor="#999"
                value={partidaTexto}
                onChangeText={setPartidaTexto} // Permite o usuário mudar manualmente se quiser
              />
            </View>

            {/* DESTINO */}
            <View style={[styles.searchInput, styles.searchInputDestination]}>
              <Ionicons name="flag-outline" size={18} color="#FF5500" />
              <TextInput
                style={styles.input}
                placeholder="Para onde você vai?"
                placeholderTextColor="#999"
                value={destinoTexto}
                onChangeText={setDestinoTexto}
              />
            </View>
          </View>
        </View>

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

        {/* LISTA */}
        <View style={styles.list}>
          {enderecos.map((endereco, index) => (
            <TouchableOpacity key={index} style={styles.listItem}>
              <View style={styles.listIconContainer}>
                <Ionicons name="time" size={14} color="#111" />
              </View>

              <View style={styles.listContent}>
                <Text style={styles.listText}>{endereco.titulo}</Text>
                <Text style={styles.listSubText}>{endereco.subtitulo}</Text>
              </View>

              <Text style={styles.distanceText}>{endereco.distancia}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    height: 56,
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