import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type User } from "../types/User";
import {
  loginUser,
  getUser,
  logoutUser,
  editUser,
} from "../services/authService";
import { ApiError } from "../services/apiService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    shouldRemember: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (
    firstName: string,
    lastName: string,
    company: string,
    email: string,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function login(
    email: string,
    password: string,
    shouldRemember: boolean,
  ) {
    const user = await loginUser(email, password, shouldRemember);
    setUser(user);
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  async function updateUser(
    firstName: string,
    lastName: string,
    company: string,
    email: string,
  ): Promise<void> {
    const updatedUser = await editUser(firstName, lastName, company, email);
    setUser(updatedUser);
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
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// The auth hook is intentionally kept alongside its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
}
