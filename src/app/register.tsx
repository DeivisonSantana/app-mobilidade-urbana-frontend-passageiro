import { useAuth } from "@/context/AuthProvider";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Cadastro() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(1);

  // step 1
  const [email, setEmail] = useState("");

  // step 2
  const [codigo, setCodigo] = useState("");

  // step 3
  const [senha, setSenha] = useState("");

  // step 4
  const [name, setName] = useState("");

  // step 5
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  // step 6
  const [concordo, setConcordo] = useState(false);

  // verificar se código tem 4 dígitos
  const codigoValido = codigo.length === 4;

  // validação step 5
  const step5Valido = cpf.length === 14 && dataNascimento.length === 10;

  // máscara CPF
  const formatarCPF = (value: string) => {
    const numeros = value.replace(/\D/g, "");

    return numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  };

  // máscara data nascimento
  const formatarDataNascimento = (value: string) => {
    const numeros = value.replace(/\D/g, "");

    return numeros
      .replace(/^(\d{2})(\d)/, "$1/$2")
      .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
      .slice(0, 10);
  };

  const finalizarCadastro = () => {
    if (concordo) {
      // remove máscara do CPF
      const cpfTratado = cpf.replace(/\D/g, "");

      // converte 21/11/1992 => 1992-11-21
      const [dia, mes, ano] = dataNascimento.split("/");

      const dataNascimentoTratada = `${ano}-${mes}-${dia}`;

      const usuario = {
        email: email,
        password: senha,
        name: name,
        cpf: cpfTratado,
        data_nascimento: dataNascimentoTratada,
      };

      console.log(usuario, "usuariousuario");

      register(usuario);

      router.replace("/home");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
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
              💸 Crie sua conta gratuitamente
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* STEP 1 */}
          {step === 1 && (
            <View>
              <Text style={styles.title}>Qual é o seu e-mail?</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Informe seu e-mail"
                  placeholderTextColor="#CCC"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputUnderline} />

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  email ? styles.nextButtonActive : styles.nextButtonDisabled,
                ]}
                onPress={() => setStep(2)}
                disabled={!email}
              >
                <Text
                  style={[
                    styles.nextButtonText,
                    !email && styles.nextButtonTextDisabled,
                  ]}
                >
                  Continuar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.loginText}>Já tem conta? Faça login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View>
              <Text style={styles.title}>
                Digite o código de 4 dígitos enviado para:
              </Text>

              <Text style={styles.highlightText}>{email}</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="0000"
                  placeholderTextColor="#CCC"
                  keyboardType="numeric"
                  maxLength={4}
                  style={[styles.input, styles.inputCenter]}
                  value={codigo}
                  onChangeText={(text) => {
                    const somenteNumeros = text.replace(/[^0-9]/g, "");

                    setCodigo(somenteNumeros);
                  }}
                />
              </View>

              <View style={styles.inputUnderline} />

              <Text style={styles.smallText}>
                Recomendação: Verifique a caixa de entrada e a pasta de spam
              </Text>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  console.log("Código reenviado!");
                }}
              >
                <Text style={styles.resendButtonText}>Reenviar código</Text>
              </TouchableOpacity>

              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.roundedButton}
                  onPress={() => setStep(1)}
                >
                  <Feather name="arrow-left" size={22} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!codigoValido}
                  onPress={() => setStep(3)}
                  style={[
                    styles.nextButtonSmall,
                    codigoValido
                      ? styles.nextButtonActive
                      : styles.nextButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !codigoValido && styles.nextButtonTextDisabled,
                    ]}
                  >
                    Avançar
                  </Text>

                  <Feather
                    name="arrow-right"
                    size={18}
                    color={codigoValido ? "black" : "#CCC"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View>
              <Text style={styles.title}>Crie uma senha para sua conta</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Senha"
                  placeholderTextColor="#CCC"
                  secureTextEntry
                  style={styles.input}
                  value={senha}
                  onChangeText={setSenha}
                />
              </View>

              <View style={styles.inputUnderline} />

              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.roundedButton}
                  onPress={() => setStep(2)}
                >
                  <Feather name="arrow-left" size={22} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!senha}
                  onPress={() => setStep(4)}
                  style={[
                    styles.nextButtonSmall,
                    senha ? styles.nextButtonActive : styles.nextButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !senha && styles.nextButtonTextDisabled,
                    ]}
                  >
                    Avançar
                  </Text>

                  <Feather
                    name="arrow-right"
                    size={18}
                    color={senha ? "black" : "#CCC"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <View>
              <Text style={styles.title}>Qual é o seu nome?</Text>

              <Text style={styles.smallTextSpacing}>
                Informe como você quer que te chamem
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Informe seu nome completo"
                  placeholderTextColor="#CCC"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputUnderline} />

              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.roundedButton}
                  onPress={() => setStep(3)}
                >
                  <Feather name="arrow-left" size={22} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!name}
                  onPress={() => setStep(5)}
                  style={[
                    styles.nextButtonSmall,
                    name ? styles.nextButtonActive : styles.nextButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !name && styles.nextButtonTextDisabled,
                    ]}
                  >
                    Avançar
                  </Text>

                  <Feather
                    name="arrow-right"
                    size={18}
                    color={name ? "black" : "#CCC"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <View>
              <Text style={styles.title}>Qual seu CPF?</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Informe seu CPF"
                  placeholderTextColor="#CCC"
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={(text) => setCpf(formatarCPF(text))}
                  maxLength={14}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputUnderline} />

              <View style={styles.space} />

              <Text style={styles.title}>Qual sua data de nascimento?</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="00/00/0000"
                  placeholderTextColor="#CCC"
                  keyboardType="numeric"
                  value={dataNascimento}
                  onChangeText={(text) =>
                    setDataNascimento(formatarDataNascimento(text))
                  }
                  maxLength={10}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputUnderline} />

              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.roundedButton}
                  onPress={() => setStep(4)}
                >
                  <Feather name="arrow-left" size={22} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!step5Valido}
                  onPress={() => setStep(6)}
                  style={[
                    styles.nextButtonSmall,
                    step5Valido
                      ? styles.nextButtonActive
                      : styles.nextButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !step5Valido && styles.nextButtonTextDisabled,
                    ]}
                  >
                    Avançar
                  </Text>

                  <Feather
                    name="arrow-right"
                    size={18}
                    color={step5Valido ? "black" : "#CCC"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <View>
              <View style={styles.iconContainer}>
                <Feather name="file-text" size={54} color="black" />
              </View>

              <Text style={styles.title}>Aceite os Termos e condições</Text>

              <Text style={styles.description}>
                Ao selecionar Concordo abaixo, confirmo que revisei e concordo
                com os <Text style={styles.link}>Termos de uso</Text> e
                reconheço o{" "}
                <Text style={styles.link}>Aviso de Privacidade</Text>. Eu tenho
                pelo menos 18 anos.
              </Text>

              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setConcordo(!concordo)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioButton,
                    concordo && styles.radioButtonActive,
                  ]}
                >
                  {concordo && (
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

              <View style={styles.rowBetween}>
                <TouchableOpacity
                  style={styles.roundedButton}
                  onPress={() => setStep(5)}
                >
                  <Feather name="arrow-left" size={22} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!concordo}
                  onPress={finalizarCadastro}
                  style={[
                    styles.nextButtonSmall,
                    concordo
                      ? styles.nextButtonActive
                      : styles.nextButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !concordo && styles.nextButtonTextDisabled,
                    ]}
                  >
                    Finalizar
                  </Text>

                  <Feather
                    name="arrow-right"
                    size={18}
                    color={concordo ? "black" : "#CCC"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    color: "#000",
    marginBottom: 20,
  },

  highlightText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
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

  inputCenter: {
    textAlign: "center",
    letterSpacing: 12,
  },

  inputUnderline: {
    height: 1,
    backgroundColor: "#FF5500",
    width: "100%",
    marginBottom: 25,
  },

  nextButton: {
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  nextButtonSmall: {
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

  loginButton: {
    marginTop: 20,
  },

  loginText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  smallText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 20,
  },

  smallTextSpacing: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
  },

  resendButton: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 50,
  },

  resendButtonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  roundedButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  space: {
    marginBottom: 10,
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 30,
  },

  link: {
    color: "#000",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 40,
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
    fontWeight: "600",
    color: "#000",
  },
});
