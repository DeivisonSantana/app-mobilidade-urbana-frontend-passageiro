import { useAuth } from "@/context/AuthProvider"; // Importe o hook
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
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
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [nome, setNome] = useState("");
  const [sobreNome, setsobreNome] = useState("");

  // verificar se senhas coincidem
  const senhasIguais = senha.length > 0 && senha === confirmarSenha;
  const nomeSobrenomePreenchidos = nome.length > 0 && sobreNome.length;

  // step 4
  const [tipoUsuario, setTipoUsuario] = useState("");

  const [concordo, setConcordo] = useState(false);

  // verificar se código tem 4 dígitos
  const codigoValido = codigo.length === 4;

  const finalizarCadastro = () => {
    if (concordo) {
      // Cria o objeto de usuário com os dados do cadastro
      const usuario = {
        id: Date.now().toString(),
        email: email,
        nome: nome,
        sobrenome: sobreNome,
        tipoUsuario: tipoUsuario,
        // Adicione outros campos que você queira salvar
      };

      // Registra o usuário no contexto de autenticação
      register(usuario);

      // Agora sim pode redirecionar para home
      router.replace("/home");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      {/* Container centralizado com largura limitada */}
      <View className="w-full max-w-xs">
        {/* STEP 1 */}
        {step === 1 && (
          <View>
            <Text className="text-xl font-semibold mb-4">
              Qual é o seu número de telefone ou e-mail?
            </Text>

            <TextInput
              placeholder="Informar telefone ou e-mail"
              className="rounded-md px-4 py-3 mb-4 text-base bg-gray-100 w-full"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              className="bg-black py-3 rounded-md w-full"
              onPress={() => setStep(2)}
            >
              <Text className="text-white text-center text-base font-semibold">
                Continuar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="pt-4"
              onPress={() => router.push("/login")}
            >
              <Text className="text-blue-500 text-lg text-center">
                Já tem conta? Faça login
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View>
            <Text className="text-xl font-semibold mb-4">
              Digite o código de 4 dígitos enviado para: {email}
            </Text>

            <TextInput
              placeholder="Digite o código"
              keyboardType="numeric"
              maxLength={4}
              className="rounded-md px-4 py-3 mb-4 text-base bg-gray-100 w-full text-center"
              value={codigo}
              onChangeText={(text) => {
                // remove tudo que não seja dígito
                const somenteNumeros = text.replace(/[^0-9]/g, "");
                setCodigo(somenteNumeros);
              }}
            />

            {/* Texto de recomendação */}
            <Text className="text-xs text-gray-600 mb-4">
              Recomendação: Verifique a caixa de entrada e a pasta de spam
            </Text>

            {/* Botão Reenviar */}
            <TouchableOpacity
              className="bg-gray-100 px-5 py-2 rounded-full mt-10 mb-20 self-start"
              onPress={() => {
                console.log("Código reenviado!");
              }}
            >
              <Text className="text-black font-medium">Reenviar</Text>
            </TouchableOpacity>

            <View className="flex-row justify-between">
              {/* Voltar */}
              <TouchableOpacity
                className="bg-gray-100 p-3 rounded-full"
                onPress={() => setStep(1)}
              >
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>

              {/* Avançar */}
              <TouchableOpacity
                disabled={!codigoValido}
                onPress={() => setStep(3)}
                className={`px-5 py-3 rounded-full flex-row items-center ${
                  codigoValido ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`mr-2 font-medium ${
                    codigoValido ? "text-white" : "text-gray-400"
                  }`}
                >
                  Avançar
                </Text>
                <Feather
                  name="arrow-right"
                  size={20}
                  color={codigoValido ? "white" : "gray"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View>
            <Text className="text-xl font-semibold mb-4">
              Crie uma senha da sua conta
            </Text>

            <TextInput
              placeholder="Senha"
              secureTextEntry
              className="rounded-md px-4 py-3 mb-4 text-base bg-gray-100 w-full"
              value={senha}
              onChangeText={setSenha}
            />

            <TextInput
              placeholder="Confirmar senha"
              secureTextEntry
              className="rounded-md px-4 py-3 mb-4 text-base bg-gray-100 w-full"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />

            <View className="flex-row justify-between">
              {/* Voltar */}
              <TouchableOpacity
                className="bg-gray-100 p-3 rounded-full"
                onPress={() => setStep(2)}
              >
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>

              {/* Avançar */}
              <TouchableOpacity
                disabled={!senhasIguais}
                onPress={() => setStep(4)}
                className={`px-5 py-3 rounded-full flex-row items-center ${
                  senhasIguais ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`mr-2 font-medium ${
                    senhasIguais ? "text-white" : "text-gray-400"
                  }`}
                >
                  Avançar
                </Text>
                <Feather
                  name="arrow-right"
                  size={20}
                  color={senhasIguais ? "white" : "gray"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <View>
            <Text className="text-xl font-semibold mb-4">
              Qual é o seu nome ?
            </Text>
            <Text className="text-xs text-gray-600 mb-8">
              Informe como você quer que te chamem
            </Text>

            <TextInput
              placeholder="Informe o primeiro nome"
              className="rounded-md px-4 py-3 mb-4 text-base bg-gray-100 w-full"
              value={nome}
              onChangeText={setNome}
            />

            <TextInput
              placeholder="Infome o sobrenome"
              className="rounded-md px-4 py-3 mb-4 text-base bg-gray-100 w-full"
              value={sobreNome}
              onChangeText={setsobreNome}
            />

            <View className="flex-row justify-between">
              {/* Voltar */}
              <TouchableOpacity
                className="bg-gray-100 p-3 rounded-full"
                onPress={() => setStep(3)}
              >
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>

              {/* Avançar */}
              <TouchableOpacity
                disabled={!nomeSobrenomePreenchidos}
                onPress={() => setStep(5)}
                className={`px-5 py-3 rounded-full flex-row items-center ${
                  nomeSobrenomePreenchidos ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`mr-2 font-medium ${
                    nomeSobrenomePreenchidos ? "text-white" : "text-gray-400"
                  }`}
                >
                  Avançar
                </Text>
                <Feather
                  name="arrow-right"
                  size={20}
                  color={nomeSobrenomePreenchidos ? "white" : "gray"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <View>
            <Text className="text-xl font-semibold mb-4">
              Escolha uma opção:
            </Text>
            <Text className="text-xs text-gray-600 mb-8">
              Informe que tipo de usuário é você
            </Text>

            <TouchableOpacity
              className="bg-black py-3 rounded-md w-full mb-4"
              onPress={() => {
                setTipoUsuario("PASSAGEIRO");
                setStep(6);
              }}
            >
              <Text className="text-white text-center text-base font-semibold">
                SOU PASSAGEIRO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black py-3 rounded-md w-full mb-20"
              onPress={() => {
                setTipoUsuario("MOTORISTA");
                setStep(6);
              }}
            >
              <Text className="text-white text-center text-base font-semibold">
                SOU MOTORISTA
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-between">
              {/* Voltar */}
              <TouchableOpacity
                className="bg-gray-100 p-3 rounded-full"
                onPress={() => setStep(4)}
              >
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 6 */}
        {step === 6 && (
          <View>
            {/* Ícone ilustrativo */}
            <View className="items-center mb-6">
              <Feather name="file-text" size={64} color="black" />
            </View>

            <Text className="text-2xl font-bold mb-4">
              Aceite os Termos e condições e leia o Aviso de Privacidade do App{" "}
              {tipoUsuario}
            </Text>

            <Text className="text-sm text-gray-700 mb-6">
              Ao selecionar Concordo abaixo, confirmo que revisei e concordo com
              os <Text className="text-blue-600 underline">Termos de uso</Text>{" "}
              e reconheço o{" "}
              <Text className="text-blue-600 underline">
                Aviso de Privacidade
              </Text>
              . Eu tenho pelo menos 18 anos.
            </Text>

            <View className="border-t border-gray-300 mt-6 mb-4" />

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-base">Concordo</Text>
              <Pressable onPress={() => setConcordo(!concordo)}>
                <View
                  className={`w-6 h-6 border rounded items-center justify-center ${
                    concordo ? "bg-black" : "bg-white border-gray-400"
                  }`}
                >
                  {concordo && <Feather name="check" size={16} color="white" />}
                </View>
              </Pressable>
            </View>

            <View className="flex-row justify-between items-center">
              {/* Voltar */}
              <TouchableOpacity
                className="bg-gray-200 p-3 rounded-full"
                onPress={() => setStep(5)}
              >
                <Feather name="arrow-left" size={24} color="black" />
              </TouchableOpacity>

              {/* Avançar - AGORA CHAMA A FUNÇÃO DE REGISTRO */}
              <TouchableOpacity
                disabled={!concordo}
                onPress={finalizarCadastro}
                className={`px-5 py-3 rounded-full flex-row items-center ${
                  concordo ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`mr-2 font-medium ${
                    concordo ? "text-white" : "text-gray-400"
                  }`}
                >
                  Finalizar Cadastro
                </Text>
                <Feather
                  name="arrow-right"
                  size={20}
                  color={concordo ? "white" : "gray"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
