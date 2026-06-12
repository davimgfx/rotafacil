export function getUsuarioId(): string | null {
  return localStorage.getItem('usuario_id');
}

export function isLogado(): boolean {
  return !!getUsuarioId();
}

export function logout() {
  localStorage.removeItem('usuario_id');
}
