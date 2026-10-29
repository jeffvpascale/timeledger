import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type User } from "../types/User";
import { loginUser, getUser, logoutUser } from "../services/authService";
import { ApiError } from "../services/apiService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function login(email: string, password: string) {
    await loginUser(email, password);
    const user = await getUser();
    setUser(user);
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getUser();
        setUser(user);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
        } else {
          console.error("Failed to load user:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
}
