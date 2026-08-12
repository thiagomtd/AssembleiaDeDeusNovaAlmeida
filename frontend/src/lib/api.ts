import { fetchAuthSession, signOut } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

// O backend lê o grupo do usuário do claim `cognito:groups`, presente no ID token
// (não no access token) — por isso é o ID token que vai no Authorization header.
async function authHeader(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    // Sessão inválida/expirada — por exemplo, o grupo de acesso mudou e o token
    // antigo foi revogado (globalSignOutUser). Desloga na hora, sem esperar o
    // token expirar sozinho.
    await signOut().catch(() => {});
    window.location.assign('/entrar');
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.erro || `Erro na requisição (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }),
};
