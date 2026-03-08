import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "admin" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SEED_USERS: User[] = [
  { id: "admin-1", name: "Admin User", email: "admin@ethicalindia.edu", password: "admin123", role: "admin" },
  { id: "student-1", name: "Amit Singh", email: "amit@student.edu", password: "student123", role: "student" },
  { id: "student-2", name: "Sneha Gupta", email: "sneha@student.edu", password: "student123", role: "student" },
  { id: "student-3", name: "Ravi Patel", email: "ravi@student.edu", password: "student123", role: "student" },
];

const USERS_KEY = "ei_users";
const SESSION_KEY = "ei_session";

export function getUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  return JSON.parse(raw);
}

export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUsersByRole(role: Role): User[] {
  return getUsers().filter(u => u.role === role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = (email: string, password: string) => {
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
