import { getDatabase } from '../database/database';
import { Competencia, CompetenciaAtleta } from '../types';
import { ICompetenciaRepository } from './ICompetenciaRepository';

interface CompetenciaRow {
  id: number;
  nombre: string;
  fecha: string;
  lugar: string;
  descripcion: string | null;
}

interface CompetenciaAtletaRow {
  id: number;
  competencia_id: number;
  atleta_id: number;
  posicion: number | null;
  marca_obtenida: number | null;
}

function mapearCompetencia(row: CompetenciaRow): Competencia {
  return {
    id:          row.id,
    nombre:      row.nombre,
    fecha:       row.fecha,
    lugar:       row.lugar,
    descripcion: row.descripcion ?? undefined,
  };
}

function mapearCompetenciaAtleta(row: CompetenciaAtletaRow): CompetenciaAtleta {
  return {
    id:             row.id,
    competenciaId:  row.competencia_id,
    atletaId:       row.atleta_id,
    posicion:       row.posicion ?? undefined,
    marcaObtenida:  row.marca_obtenida ?? undefined,
  };
}

export class CompetenciaRepository implements ICompetenciaRepository {
  async crear(competencia: Omit<Competencia, 'id'>): Promise<Competencia> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO competencias (nombre, fecha, lugar, descripcion) VALUES (?, ?, ?, ?)',
      competencia.nombre,
      competencia.fecha,
      competencia.lugar,
      competencia.descripcion ?? null,
    );
    return { ...competencia, id: result.lastInsertRowId };
  }

  async convocarAtleta(competenciaId: number, atletaId: number): Promise<CompetenciaAtleta> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO competencia_atleta (competencia_id, atleta_id) VALUES (?, ?)',
      competenciaId,
      atletaId,
    );
    return { id: result.lastInsertRowId, competenciaId, atletaId };
  }

  async registrarResultado(
    competenciaId: number,
    atletaId: number,
    posicion: number,
    marcaObtenida: number,
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE competencia_atleta
       SET posicion = ?, marca_obtenida = ?
       WHERE competencia_id = ? AND atleta_id = ?`,
      posicion,
      marcaObtenida,
      competenciaId,
      atletaId,
    );
  }

  async listarConvocados(competenciaId: number): Promise<CompetenciaAtleta[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<CompetenciaAtletaRow>(
      `SELECT * FROM competencia_atleta
       WHERE competencia_id = ?
       ORDER BY posicion ASC`,
      competenciaId,
    );
    return rows.map(mapearCompetenciaAtleta);
  }
}
