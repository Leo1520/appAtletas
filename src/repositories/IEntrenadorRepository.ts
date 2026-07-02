import { Entrenador } from '../types';

export interface IEntrenadorRepository {
  existeEntrenador(): Promise<boolean>;
  registrar(
    correo: string,
    contrasenhaHash: string,
    preguntaSeguridad: string,
    respuestaHash: string,
    nombre: string,
  ): Promise<Entrenador>;
  obtenerPorCorreo(correo: string): Promise<Entrenador | null>;
  actualizarContrasena(correo: string, contrasenhaHash: string): Promise<void>;
  actualizarFoto(id: number, fotoUri: string | null): Promise<void>;
  actualizarNombre(id: number, nombre: string): Promise<void>;
  eliminarCuenta(id: number): Promise<void>;
}
