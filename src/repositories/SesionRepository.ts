import { getDatabase } from '../database/database';
import { Sesion } from '../types';
import { ISesionRepository } from './ISesionRepository';
import { getEntrenadorActual } from '../services/SesionService';

interface SesionRow {
  id: number;
  entrenador_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  descripcion: string;
  disciplina: string;
  lugar: string | null;
  grupo: string | null;
  estado: string;
  motivo_cancelacion: string | null;
  notification_id: string | null;
}

function mapearFila(row: SesionRow): Sesion {
  return {
    id:                 row.id,
    fecha:              row.fecha,
    horaInicio:         row.hora_inicio,
    horaFin:            row.hora_fin ?? undefined,
    descripcion:        row.descripcion,
    disciplina:         row.disciplina,
    lugar:              row.lugar ?? undefined,
    grupo:              row.grupo ?? undefined,
    estado:             row.estado,
    motivoCancelacion:  row.motivo_cancelacion ?? undefined,
    notificationId:     row.notification_id ?? undefined,
  };
}

export class SesionRepository implements ISesionRepository {
  async crear(sesion: Omit<Sesion, 'id'>): Promise<Sesion> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) throw new Error('No hay entrenador en sesión');
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO sesiones
         (entrenador_id, fecha, hora_inicio, hora_fin, descripcion, disciplina, lugar, grupo, estado, motivo_cancelacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      entrenadorId,
      sesion.fecha,
      sesion.horaInicio,
      sesion.horaFin ?? null,
      sesion.descripcion,
      sesion.disciplina,
      sesion.lugar ?? null,
      sesion.grupo ?? null,
      sesion.estado,
      sesion.motivoCancelacion ?? null,
    );
    return { ...sesion, id: result.lastInsertRowId };
  }

  async actualizar(sesion: Sesion): Promise<Sesion> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sesiones
       SET fecha = ?, hora_inicio = ?, hora_fin = ?, descripcion = ?,
           disciplina = ?, lugar = ?, grupo = ?, estado = ?, motivo_cancelacion = ?,
           notification_id = ?
       WHERE id = ?`,
      sesion.fecha,
      sesion.horaInicio,
      sesion.horaFin ?? null,
      sesion.descripcion,
      sesion.disciplina,
      sesion.lugar ?? null,
      sesion.grupo ?? null,
      sesion.estado,
      sesion.motivoCancelacion ?? null,
      sesion.notificationId ?? null,
      sesion.id,
    );
    return sesion;
  }

  async cancelar(id: number, motivo: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sesiones SET estado = 'cancelada', motivo_cancelacion = ? WHERE id = ?`,
      motivo,
      id,
    );
  }

  async obtenerPorId(id: number): Promise<Sesion | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SesionRow>(
      'SELECT * FROM sesiones WHERE id = ?',
      id,
    );
    return row ? mapearFila(row) : null;
  }

  async listarPorSemana(fechaInicio: string, fechaFin: string): Promise<Sesion[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const rows = await db.getAllAsync<SesionRow>(
      `SELECT * FROM sesiones
       WHERE fecha BETWEEN ? AND ? AND entrenador_id = ?
       ORDER BY fecha, hora_inicio`,
      fechaInicio,
      fechaFin,
      entrenadorId,
    );
    return rows.map(mapearFila);
  }

  async actualizarNotificationId(id: number, notifId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sesiones SET notification_id = ? WHERE id = ?',
      notifId,
      id,
    );
  }

  async listarProximas(fechas: string[]): Promise<Sesion[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const placeholders = fechas.map(() => '?').join(', ');
    const rows = await db.getAllAsync<SesionRow>(
      `SELECT * FROM sesiones
       WHERE fecha IN (${placeholders}) AND estado = 'activa' AND entrenador_id = ?
       ORDER BY fecha, hora_inicio`,
      ...fechas,
      entrenadorId,
    );
    return rows.map(mapearFila);
  }
}
