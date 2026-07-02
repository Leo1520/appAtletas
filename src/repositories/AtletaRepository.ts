import { getDatabase } from '../database/database';
import { Atleta } from '../types';
import { IAtletaRepository } from './IAtletaRepository';
import { getEntrenadorActual } from '../services/SesionService';

interface AtletaRow {
  id: number;
  entrenador_id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  disciplina: string;
  categoria: string;
  grupo: string | null;
  foto_uri: string | null;
  activo: number;
}

function mapearFila(row: AtletaRow): Atleta {
  return {
    id:               row.id,
    nombre:           row.nombre,
    apellido:         row.apellido,
    fechaNacimiento:  row.fecha_nacimiento,
    disciplina:       row.disciplina,
    categoria:        row.categoria,
    grupo:            row.grupo ?? undefined,
    fotoUri:          row.foto_uri ?? undefined,
    activo:           row.activo === 1,
  };
}

export class AtletaRepository implements IAtletaRepository {
  async crear(atleta: Omit<Atleta, 'id'>): Promise<Atleta> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) throw new Error('No hay entrenador en sesión');
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO atletas
         (entrenador_id, nombre, apellido, fecha_nacimiento, disciplina, categoria, grupo, foto_uri, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      entrenadorId,
      atleta.nombre,
      atleta.apellido,
      atleta.fechaNacimiento,
      atleta.disciplina,
      atleta.categoria,
      atleta.grupo ?? null,
      atleta.fotoUri ?? null,
      atleta.activo ? 1 : 0,
    );
    return { ...atleta, id: result.lastInsertRowId };
  }

  async actualizar(atleta: Atleta): Promise<Atleta> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE atletas
       SET nombre = ?, apellido = ?, fecha_nacimiento = ?, disciplina = ?,
           categoria = ?, grupo = ?, foto_uri = ?, activo = ?
       WHERE id = ?`,
      atleta.nombre,
      atleta.apellido,
      atleta.fechaNacimiento,
      atleta.disciplina,
      atleta.categoria,
      atleta.grupo ?? null,
      atleta.fotoUri ?? null,
      atleta.activo ? 1 : 0,
      atleta.id,
    );
    return atleta;
  }

  async desactivar(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE atletas SET activo = 0 WHERE id = ?', id);
  }

  async obtenerPorId(id: number): Promise<Atleta | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<AtletaRow>(
      'SELECT * FROM atletas WHERE id = ?',
      id,
    );
    return row ? mapearFila(row) : null;
  }

  async listarActivos(): Promise<Atleta[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const rows = await db.getAllAsync<AtletaRow>(
      'SELECT * FROM atletas WHERE activo = 1 AND entrenador_id = ? ORDER BY apellido, nombre',
      entrenadorId,
    );
    return rows.map(mapearFila);
  }

  async listarTodos(): Promise<Atleta[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const rows = await db.getAllAsync<AtletaRow>(
      'SELECT * FROM atletas WHERE entrenador_id = ? ORDER BY apellido, nombre',
      entrenadorId,
    );
    return rows.map(mapearFila);
  }

  async listarDisciplinas(): Promise<string[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ disciplina: string }>(
      'SELECT DISTINCT disciplina FROM atletas WHERE disciplina IS NOT NULL AND entrenador_id = ? ORDER BY disciplina',
      entrenadorId,
    );
    return rows.map((r) => r.disciplina);
  }

  async listarGrupos(): Promise<string[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ grupo: string }>(
      'SELECT DISTINCT grupo FROM atletas WHERE grupo IS NOT NULL AND entrenador_id = ? ORDER BY grupo',
      entrenadorId,
    );
    return rows.map((r) => r.grupo);
  }

  async buscarPorNombre(nombre: string): Promise<Atleta[]> {
    const entrenadorId = getEntrenadorActual();
    if (entrenadorId === null) return [];
    const db = await getDatabase();
    const rows = await db.getAllAsync<AtletaRow>(
      `SELECT * FROM atletas
       WHERE activo = 1
         AND entrenador_id = ?
         AND (nombre LIKE ? OR apellido LIKE ?)
       ORDER BY apellido, nombre`,
      entrenadorId,
      `%${nombre}%`,
      `%${nombre}%`,
    );
    return rows.map(mapearFila);
  }
}
