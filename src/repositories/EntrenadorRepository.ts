import { getDatabase } from '../database/database';
import { Entrenador } from '../types';
import { IEntrenadorRepository } from './IEntrenadorRepository';

interface EntrenadorRow {
  id: number;
  correo: string;
  contrasena: string;
  pregunta_seguridad: string | null;
  respuesta_seguridad: string | null;
  foto_uri: string | null;
}

function mapearFila(row: EntrenadorRow): Entrenador {
  return {
    id:                 row.id,
    correo:             row.correo,
    contrasena:         row.contrasena,
    preguntaSeguridad:  row.pregunta_seguridad ?? undefined,
    respuestaSeguridad: row.respuesta_seguridad ?? undefined,
    fotoUri:            row.foto_uri ?? undefined,
  };
}

export class EntrenadorRepository implements IEntrenadorRepository {
  async existeEntrenador(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM entrenador',
    );
    return (row?.total ?? 0) > 0;
  }

  async registrar(
    correo: string,
    contrasenhaHash: string,
    preguntaSeguridad: string,
    respuestaHash: string,
  ): Promise<Entrenador> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO entrenador (correo, contrasena, pregunta_seguridad, respuesta_seguridad)
       VALUES (?, ?, ?, ?)`,
      correo,
      contrasenhaHash,
      preguntaSeguridad,
      respuestaHash,
    );
    return {
      id:                 result.lastInsertRowId,
      correo,
      contrasena:         contrasenhaHash,
      preguntaSeguridad,
      respuestaSeguridad: respuestaHash,
    };
  }

  async obtenerPorCorreo(correo: string): Promise<Entrenador | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<EntrenadorRow>(
      'SELECT * FROM entrenador WHERE correo = ?',
      correo,
    );
    return row ? mapearFila(row) : null;
  }

  async actualizarContrasena(correo: string, contrasenhaHash: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE entrenador SET contrasena = ? WHERE correo = ?',
      contrasenhaHash,
      correo,
    );
  }

  async actualizarFoto(id: number, fotoUri: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE entrenador SET foto_uri = ? WHERE id = ?',
      fotoUri,
      id,
    );
  }
}
