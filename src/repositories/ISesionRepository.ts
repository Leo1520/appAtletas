import { Sesion } from '../types';

export interface ISesionRepository {
  crear(sesion: Omit<Sesion, 'id'>): Promise<Sesion>;
  actualizar(sesion: Sesion): Promise<Sesion>;
  cancelar(id: number, motivo: string): Promise<void>;
  obtenerPorId(id: number): Promise<Sesion | null>;
  listarPorSemana(fechaInicio: string, fechaFin: string): Promise<Sesion[]>;
  actualizarNotificationId(id: number, notifId: string): Promise<void>;
  listarProximas(fechas: string[]): Promise<Sesion[]>;
}
