import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';

export type Grupo = 'admin' | 'member' | 'midia' | 'tesouraria';

interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  telefone?: string;
  nome?: string;
  grupos: Grupo[];
  isAdmin: boolean;
  isMember: boolean;
  isMidia: boolean;
  isTesouraria: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [telefone, setTelefone] = useState<string>();
  const [nome, setNome] = useState<string>();
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      if (idToken) {
        const claims = idToken.payload as Record<string, unknown>;
        setTelefone(claims.phone_number as string);
        setNome(claims.name as string);
        const raw = claims['cognito:groups'];
        setGrupos(Array.isArray(raw) ? (raw as Grupo[]) : []);
      } else {
        setTelefone(undefined);
        setNome(undefined);
        setGrupos([]);
      }
    } catch {
      setTelefone(undefined);
      setNome(undefined);
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const signOut = async () => {
    await amplifySignOut();
    setTelefone(undefined);
    setNome(undefined);
    setGrupos([]);
  };

  const isAdmin = grupos.includes('admin');
  const isMidia = grupos.includes('midia');
  const isTesouraria = grupos.includes('tesouraria');
  // Todo grupo autenticado tem a base de acesso de "member" (permissões cumulativas).
  const isMember = grupos.length > 0;

  const value: AuthState = {
    loading,
    isAuthenticated: !!telefone,
    telefone,
    nome,
    grupos,
    isAdmin,
    isMember,
    isMidia,
    isTesouraria,
    refresh,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
