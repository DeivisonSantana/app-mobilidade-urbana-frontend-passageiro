// app/login.tsx
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CodigoVerificacao from "../components/CodigoVerificacao";
import { useAuth } from "../context/AuthProvider";
import { api } from "../Services/api";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCodigoVerificacao, setShowCodigoVerificacao] = useState(false);

  const [loadingVerificarConta, setLoadingVerificarConta] =
    useState(false);


  // Aplica a máscara: 01 23456 7890
  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    }
    if (cleaned.length > 7) {
      formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7, 11)}`;
    }

    setPhone(formatted);
  };

  const verificarSeContaExiste = async () => {
    try {
      setLoadingVerificarConta(true);

      // remove máscara e espaços
      const telefone = phone.replace(/\D/g, "");

      console.log(
        "Verificando se conta existe para:",
        telefone,
      );

      const response = await api.get(
        "/auth/verifica-se-conta-existe",
        {
          params: {
            telefone,
          },
        },
      );

      console.log(
        "Resposta verificar conta:",
        response.data,
      );

      const contaExiste =
        response.data.contaExiste;

      // se existir conta -> abre modal código
      if (contaExiste) {
        setShowCodigoVerificacao(true);

        return;
      }

      // se não existir -> vai para registro
      router.push({
        pathname: "/register",
        params: {
          telefone,
        },
      });
    } catch (error: any) {
      console.log(
        "===================================",
      );
      console.log(
        "ERRO AO VERIFICAR SE CONTA EXISTE",
      );
      console.log(
        "===================================",
      );

      // resposta do backend
      if (error.response) {
        console.log(
          "STATUS:",
          error.response.status,
        );

        console.log(
          "DATA:",
          JSON.stringify(
            error.response.data,
            null,
            2,
          ),
        );

        console.log(
          "HEADERS:",
          JSON.stringify(
            error.response.headers,
            null,
            2,
          ),
        );

        console.log(
          "URL:",
          error.config?.baseURL +
          error.config?.url,
        );

        console.log(
          "METHOD:",
          error.config?.method,
        );

        console.log(
          "PARAMS:",
          JSON.stringify(
            error.config?.params,
            null,
            2,
          ),
        );
      }

      // requisição enviada mas sem resposta
      else if (error.request) {
        console.log(
          "SEM RESPOSTA DO SERVIDOR",
        );

        console.log(
          JSON.stringify(
            error.request,
            null,
            2,
          ),
        );
      }

      // erro interno
      else {
        console.log(
          "ERRO:",
          error.message,
        );
      }

      console.log(
        "STACK:",
        error.stack,
      );

      console.log(
        "===================================",
      );
    } finally {
      setLoadingVerificarConta(false);
    }
  };

  // Habilita se tiver os 11 dígitos numéricos (que resultam em 13 caracteres com espaços)
  const isButtonEnabled =
    phone.replace(/\D/g, "").length === 11 && acceptedTerms;

  return (
    <>
      <CodigoVerificacao
        visible={showCodigoVerificacao}
        onClose={() => setShowCodigoVerificacao(false)}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header com Logo */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.logoText}>99</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}> 🤑 Receba cupom de desconto</Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Insira o número de telefone</Text>

            {/* Input de Telefone */}
            <View style={styles.inputWrapper}>
              <View style={styles.countryPicker}>
                <Image
                  source={{ uri: "https://flagcdn.com/w40/br.png" }}
                  style={styles.flag}
                />
                <Text style={styles.countryCode}>+55</Text>
                <Ionicons name="caret-down" size={12} color="#666" />
              </View>

              <TextInput
                style={styles.input}
                placeholder="01 23456 7890"
                placeholderTextColor="#CCC"
                keyboardType="phone-pad"
                maxLength={13} // Limite de caracteres considerando a máscara (2+1+5+1+4)
                value={phone}
                onChangeText={formatPhone}
              />

              {phone.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPhone("")}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#CCC" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.contactIcon}>
                <Ionicons name="person-add-outline" size={20} color="black" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputUnderline} />

            {/* Termos e Condições */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioButton,
                  acceptedTerms && styles.radioButtonActive,
                ]}
              >
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text style={styles.termsText}>
                Li e aceito os{" "}
                <Text style={styles.linkText}>
                  Termos de Uso e a Política de Privacidade
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Botão Próximo */}
            <TouchableOpacity
              onPress={() => verificarSeContaExiste()}
              style={[
                styles.nextButton,
                isButtonEnabled
                  ? styles.nextButtonActive
                  : styles.nextButtonDisabled,
              ]}
              disabled={
                !isButtonEnabled ||
                loadingVerificarConta
              }
            >
              {loadingVerificarConta ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={[
                    styles.nextButtonText,
                    !isButtonEnabled &&
                    styles.nextButtonTextDisabled,
                  ]}
                >
                  Próximo
                </Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Social */}
            <TouchableOpacity style={styles.socialButton}
              onPress={() => router.push('/loginEmail')}
            >
              <FontAwesome5
                name="envelope"
                size={20}
                color="grey"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Entrar com email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 50,
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
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 15,
  },
  flag: {
    width: 20,
    height: 14,
    marginRight: 5,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: "#000",
    fontWeight: "400",
  },
  inputUnderline: {
    height: 1,
    backgroundColor: "#FF5500",
    width: "100%",
    marginBottom: 25,
  },
  clearButton: {
    padding: 5,
  },
  contactIcon: {
    marginLeft: 10,
    padding: 5,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CCC",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonActive: {
    backgroundColor: "#FF5500",
    borderColor: "#FF5500",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  linkText: {
    textDecorationLine: "underline",
  },
  nextButton: {
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  nextButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  nextButtonActive: {
    backgroundColor: "#FFD200",
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  nextButtonTextDisabled: {
    color: "#CCC",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEE",
  },
  dividerText: {
    paddingHorizontal: 15,
    color: "#AAA",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    height: 55,
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 15,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
