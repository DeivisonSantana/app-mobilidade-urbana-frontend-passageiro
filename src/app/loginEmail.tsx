import { useAuth } from "@/context/AuthProvider";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginEmail() {
  const router = useRouter();

  const { user, loading, login } = useAuth();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [erroLogin, setErroLogin] = useState("");

  useEffect(() => {
    if (user && !loading) {
      router.replace("/home");
    }
  }, [user, loading]);

  const handleLogin = async () => {
    try {
      setErroLogin("");

      await login(email.trim(), senha);

      router.replace("/home");
    } catch (error: any) {
      console.log(error);

      setErroLogin("E-mail ou senha inválidos");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboard}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="black" />
              </TouchableOpacity>

              <Text style={styles.logoText}>99</Text>

              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  🔐 Acesse sua conta com segurança
                </Text>
              </View>
            </View>

            <View style={styles.content}>
              {/* STEP 1 */}
              {step === 1 && (
                <View style={styles.stepContainer}>
                  <View>
                    <Text style={styles.title}>
                      Qual é o seu endereço de e-mail?
                    </Text>

                    <View style={styles.inputWrapper}>
                      <TextInput
                        placeholder="nome@exemplo.com"
                        placeholderTextColor="#CCC"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.inputUnderline} />
                  </View>

                  <View style={styles.footerButtons}>
                    <TouchableOpacity
                      style={styles.roundedButton}
                      onPress={() => router.back()}
                    >
                      <Feather name="arrow-left" size={22} color="black" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={!email.trim()}
                      style={[
                        styles.nextButton,
                        email.trim()
                          ? styles.nextButtonActive
                          : styles.nextButtonDisabled,
                      ]}
                      onPress={() => setStep(2)}
                    >
                      <Text
                        style={[
                          styles.nextButtonText,
                          !email.trim() && styles.nextButtonTextDisabled,
                        ]}
                      >
                        Avançar
                      </Text>

                      <Feather
                        name="arrow-right"
                        size={18}
                        color={email.trim() ? "black" : "#CCC"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <View style={styles.stepContainer}>
                  <View>
                    <Text style={styles.title}>Informe sua senha</Text>

                    <Text style={styles.highlightText}>{email}</Text>

                    <View style={styles.inputWrapper}>
                      <TextInput
                        placeholder="Digite sua senha"
                        placeholderTextColor="#CCC"
                        secureTextEntry
                        style={styles.input}
                        value={senha}
                        onChangeText={(text) => {
                          setSenha(text);

                          if (erroLogin) {
                            setErroLogin("");
                          }
                        }}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    <View
                      style={[
                        styles.inputUnderline,
                        erroLogin && styles.inputUnderlineError,
                      ]}
                    />

                    {!!erroLogin && (
                      <Text style={styles.errorText}>{erroLogin}</Text>
                    )}
                  </View>

                  <View style={styles.footerButtons}>
                    <TouchableOpacity
                      style={styles.roundedButton}
                      onPress={() => setStep(1)}
                      disabled={loading}
                    >
                      <Feather name="arrow-left" size={22} color="black" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={!senha || loading}
                      onPress={handleLogin}
                      style={[
                        styles.nextButton,
                        senha && !loading
                          ? styles.nextButtonActive
                          : styles.nextButtonDisabled,
                      ]}
                    >
                      {loading ? (
                        <ActivityIndicator color="black" />
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.nextButtonText,
                              (!senha || loading) &&
                                styles.nextButtonTextDisabled,
                            ]}
                          >
                            Entrar
                          </Text>

                          <Feather
                            name="arrow-right"
                            size={18}
                            color={senha && !loading ? "black" : "#CCC"}
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
  },

  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#000",
  },

  badgeContainer: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },

  badgeText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },

  content: {
    flex: 1,
    paddingHorizontal: 30,
    marginTop: 40,
    paddingBottom: 30,
  },

  stepContainer: {
    flex: 1,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 24,
  },

  highlightText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 24,
    color: "#FF5500",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  input: {
    flex: 1,
    fontSize: 22,
    color: "#000",
    fontWeight: "400",
  },

  inputUnderline: {
    height: 1,
    backgroundColor: "#FF5500",
    width: "100%",
    marginBottom: 12,
  },

  inputUnderlineError: {
    backgroundColor: "#ef4444",
  },

  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },

  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },

  roundedButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  nextButton: {
    height: 50,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 24,
  },

  nextButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },

  nextButtonActive: {
    backgroundColor: "#FFD200",
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },

  nextButtonTextDisabled: {
    color: "#CCC",
  },
});
