import { getDatabase } from '../database/database';
import { Marca } from '../types';
import { IMarcaRepository } from './IMarcaRepository';

interface MarcaRow {
  id: number;
  atleta_id: number;
  sesion_id: number | null;
  tipo: string;
  valor: number;
  unidad: string;
  fecha: string;
  notas: string | null;
  es_marca_personal: number;
}

function mapearFila(row: MarcaRow): Marca {
  return {
    id:               row.id,
    atletaId:         row.atleta_id,
    sesionId:         row.sesion_id ?? undefined,
    tipo:             row.tipo,
    valor:            row.valor,
    unidad:           row.unidad,
    fecha:            row.fecha,
    notas:            row.notas ?? undefined,
    esMarcaPersonal:  row.es_marca_personal === 1,
  };
}

export class MarcaRepository implements IMarcaRepository {
  async crear(marca: Omit<Marca, 'id'>): Promise<Marca> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO marcas
         (atleta_id, sesion_id, tipo, valor, unidad, fecha, notas, es_marca_personal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      marca.atletaId,
      marca.sesionId ?? null,
      marca.tipo,
      marca.valor,
      marca.unidad,
      marca.fecha,
      marca.notas ?? null,
      marca.esMarcaPersonal ? 1 : 0,
    );
    return { ...marca, id: result.lastInsertRowId };
  }

  async listarPorAtleta(atletaId: number): Promise<Marca[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MarcaRow>(
      'SELECT * FROM marcas WHERE atleta_id = ? ORDER BY fecha DESC',
      atletaId,
    );
    return rows.map(mapearFila);
  }

  async listarTodas(): Promise<Marca[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MarcaRow>(
      'SELECT * FROM marcas ORDER BY fecha DESC, id DESC',
    );
    return rows.map(mapearFila);
  }

  async listarPorAtletaYDisciplina(atletaId: number, disciplina: string): Promise<Marca[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MarcaRow>(
      'SELECT * FROM marcas WHERE atleta_id = ? AND tipo = ? ORDER BY fecha DESC',
      atletaId,
      disciplina,
    );
    return rows.map(mapearFila);
  }

  async marcarEsMarcaPersonal(id: number, esMarcaPersonal: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE marcas SET es_marca_personal = ? WHERE id = ?',
      esMarcaPersonal ? 1 : 0,
      id,
    );
  }
}
