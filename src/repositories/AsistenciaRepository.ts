import { getDatabase } from '../database/database';
import { Asistencia } from '../types';
import { IAsistenciaRepository } from './IAsistenciaRepository';

interface AsistenciaRow {
  id: number;
  atleta_id: number;
  sesion_id: number;
  estado: string;
}

function mapearFila(row: AsistenciaRow): Asistencia {
  return {
    id:        row.id,
    atletaId:  row.atleta_id,
    sesionId:  row.sesion_id,
    estado:    row.estado as 'P' | 'A' | 'L',
  };
}

export class AsistenciaRepository implements IAsistenciaRepository {
  async guardarEstado(atletaId: number, sesionId: number, estado: 'P' | 'A' | 'L'): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO asistencia (atleta_id, sesion_id, estado) VALUES (?, ?, ?)
       ON CONFLICT(atleta_id, sesion_id) DO UPDATE SET estado = excluded.estado`,
      atletaId,
      sesionId,
      estado,
    );
  }

  async obtenerPorSesion(sesionId: number): Promise<Asistencia[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AsistenciaRow>(
      'SELECT * FROM asistencia WHERE sesion_id = ? ORDER BY atleta_id',
      sesionId,
    );
    return rows.map(mapearFila);
  }
}
