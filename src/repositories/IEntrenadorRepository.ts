import { Entrenador } from '../types';

export interface IEntrenadorRepository {
  existeEntrenador(): Promise<boolean>;
  registrar(
    correo: string,
    contrasenhaHash: string,
    preguntaSeguridad: string,
    respuestaHash: string,
  ): Promise<Entrenador>;
  obtenerPorCorreo(correo: string): Promise<Entrenador | null>;
}
