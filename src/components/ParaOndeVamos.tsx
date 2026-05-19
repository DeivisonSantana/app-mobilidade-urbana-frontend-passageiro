import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
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

interface props {
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function ParaOndevamos({
  visible,
  onClose,
  duration = 300,
}: props) {
  const translateX = useRef(
    new Animated.Value(width),
  ).current;

  const overlayOpacity = useRef(
    new Animated.Value(0),
  ).current;

  // ✅ Estado interno para controlar a presença na tela
  const [isMounted, setIsMounted] =
    useState(visible);

  // ✅ Detecta botão "voltar" do Android
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

    return () => subscription.remove();
  }, [visible, onClose]);

  // ✅ Animações de abertura e fechamento
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
  }, [
    visible,
    translateX,
    overlayOpacity,
    duration,
  ]);

  if (!isMounted) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 30 },
      ]}
    >
      {/* Overlay */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                "rgba(0,0,0,0.25)",
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
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="black"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
           {/* Usuário */}
        <View style={styles.userContainer}>
          <View style={styles.userPill}>
            <Ionicons
              name="person-circle"
              size={28}
              color="#666"
            />

            <Text style={styles.userName}>
              Diogo
            </Text>

            <Ionicons
              name="chevron-down"
              size={16}
              color="#666"
            />
          </View>
        </View>
          </View>

          <View style={{ width: 24 }} />
        </View>

        <View style={{padding: 10}}/>

        {/* Título */}
        <Text style={styles.title}>
          Para onde vamos?
        </Text>

        {/* INPUTS */}
        <View style={styles.searchContainer}>
          {/* Linha lateral */}
          <View style={styles.lineContainer}>
            <View style={styles.circleTop} />

            <View style={styles.verticalLine} />

            <View
              style={styles.circleBottom}
            />
          </View>

          <View
            style={styles.inputsContainer}
          >
            {/* PARTIDA */}
            <View style={styles.searchInput}>
              <Ionicons
                name="navigate-outline"
                size={18}
                color="#666"
              />

              <TextInput
                style={styles.input}
                placeholder="Local de partida"
                placeholderTextColor="#999"
              />
            </View>

            {/* DESTINO */}
            <View
              style={[
                styles.searchInput,
                styles.searchInputDestination,
              ]}
            >
              <Ionicons
                name="flag-outline"
                size={18}
                color="#FF5500"
              />

              <TextInput
                style={styles.input}
                placeholder="Para onde você vai?"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Ações rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
          >
            <Ionicons
              name="home-outline"
              size={18}
              color="#111"
            />

            <Text style={styles.quickText}>
              Casa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
          >
            <Ionicons
              name="briefcase-outline"
              size={18}
              color="#111"
            />

            <Text style={styles.quickText}>
              Trabalho
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
          >
            <Ionicons
              name="star-outline"
              size={18}
              color="#111"
            />

            <Text style={styles.quickText}>
              Favoritos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <View style={styles.list}>
          <TouchableOpacity
            style={styles.listItem}
          >
            <View
              style={styles.listIconContainer}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color="#666"
              />
            </View>

            <View>
              <Text style={styles.listText}>
                Destino recente 1
              </Text>

              <Text
                style={styles.listSubText}
              >
                Rua exemplo, 123
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.listItem}
          >
            <View
              style={styles.listIconContainer}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color="#666"
              />
            </View>

            <View>
              <Text style={styles.listText}>
                Destino recente 2
              </Text>

              <Text
                style={styles.listSubText}
              >
                Avenida exemplo, 456
              </Text>
            </View>
          </TouchableOpacity>
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

  logoText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#000",
  },

  badgeContainer: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },

  badgeText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
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

  /* INPUTS */
  searchContainer: {
    flexDirection: "row",
    marginBottom: 28,
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
    justifyContent: "space-between",
    marginBottom: 30,
  },

  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 14,
  },

  quickText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },

  list: {
    marginTop: 10,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  listText: {
    fontSize: 15,
    color: "#111",
    fontWeight: "600",
    marginBottom: 2,
  },

  listSubText: {
    fontSize: 13,
    color: "#777",
  },
});