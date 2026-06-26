import { Asistencia } from '../types';

export interface IAsistenciaRepository {
  guardarEstado(atletaId: number, sesionId: number, estado: 'P' | 'A' | 'L'): Promise<void>;
  obtenerPorSesion(sesionId: number): Promise<Asistencia[]>;
}
