import { useAuth } from "@/context/AuthProvider";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <View style={styles.content}>
            {/* STEP 1 */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <View>
                  <Text style={styles.title}>
                    Qual é o seu endereço de e-mail?
                  </Text>

                  <Text style={styles.label}>E-mail</Text>

                  <TextInput
                    placeholder="nome@exemplo.com"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={styles.roundedButtonGray}
                    onPress={() => router.back()}
                  >
                    <Feather
                      name="arrow-left"
                      size={24}
                      color="black"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!email.trim()}
                    style={[
                      styles.nextButton,
                      {
                        backgroundColor: email.trim()
                          ? "#000000"
                          : "#d1d5db",
                      },
                    ]}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.nextButtonText}>
                      Avançar
                    </Text>

                    <Feather
                      name="arrow-right"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <View>
                  <Text style={styles.title}>
                    Informe sua senha
                  </Text>

                  <Text style={styles.emailText}>{email}</Text>

                  <Text style={styles.label}>Senha</Text>

                  <TextInput
                    placeholder="Digite sua senha"
                    secureTextEntry
                    style={[
                      styles.input,
                      erroLogin
                        ? styles.inputError
                        : undefined,
                    ]}
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

                  {!!erroLogin && (
                    <Text style={styles.errorText}>
                      {erroLogin}
                    </Text>
                  )}
                </View>

                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={styles.roundedButtonGray}
                    onPress={() => setStep(1)}
                    disabled={loading}
                  >
                    <Feather
                      name="arrow-left"
                      size={24}
                      color="black"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!senha || loading}
                    onPress={handleLogin}
                    style={[
                      styles.nextButton,
                      {
                        backgroundColor:
                          senha && !loading
                            ? "#000000"
                            : "#d1d5db",
                      },
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color="white"
                      />
                    ) : (
                      <>
                        <Text style={styles.nextButtonText}>
                          Entrar
                        </Text>

                        <Feather
                          name="arrow-right"
                          size={20}
                          color="white"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  stepContainer: {
    flex: 1,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 32,
  },

  label: {
    fontSize: 16,
    color: "#444444",
    marginBottom: 8,
  },

  emailText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    backgroundColor: "#ffffff",
  },

  inputError: {
    borderColor: "#ef4444",
  },

  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  roundedButtonGray: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },

  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 9999,
  },

  nextButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 8,
  },
});