let entrenadorActualId: number | null = null;

export function setEntrenadorActual(id: number): void {
  entrenadorActualId = id;
}

export function getEntrenadorActual(): number | null {
  return entrenadorActualId;
}

export function limpiarSesion(): void {
  entrenadorActualId = null;
}
