// context/AuthProvider.tsx
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  sobrenome: string;
  tipoUsuario: string;
}

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (user: Usuario) => void;
  logout: () => void;
  register: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  register: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca o usuário do SecureStore na inicialização
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Simula delay de requisição ao banco (2 segundos)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const storedUser = await SecureStore.getItemAsync("user");
        
        if (storedUser) {
          try {
            // Tenta fazer parse como JSON
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (parseError) {
            // Se falhar no parse, limpa o dado inválido
            console.warn("Usuário salvo em formato inválido, limpando...");
            await SecureStore.deleteItemAsync("user");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar usuário do SecureStore:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (userData: Usuario) => {
    setLoading(true);
    try {
      setUser(userData);
      await SecureStore.setItemAsync("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await SecureStore.deleteItemAsync("user");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const register = async (novoUsuario: Usuario) => {
    setLoading(true);
    try {
      setUser(novoUsuario);
      await SecureStore.setItemAsync("user", JSON.stringify(novoUsuario));
    } catch (error) {
      console.error("Erro ao registrar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
