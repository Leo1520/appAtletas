import { getDatabase } from '../database/database';
import { Entrenador } from '../types';
import { IEntrenadorRepository } from './IEntrenadorRepository';

interface EntrenadorRow {
  id: number;
  correo: string;
  contrasena: string;
  nombre: string | null;
  pregunta_seguridad: string | null;
  respuesta_seguridad: string | null;
  foto_uri: string | null;
}

function mapearFila(row: EntrenadorRow): Entrenador {
  return {
    id:                 row.id,
    correo:             row.correo,
    contrasena:         row.contrasena,
    nombre:             row.nombre ?? undefined,
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
    nombre: string,
  ): Promise<Entrenador> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO entrenador (correo, contrasena, pregunta_seguridad, respuesta_seguridad, nombre)
       VALUES (?, ?, ?, ?, ?)`,
      correo,
      contrasenhaHash,
      preguntaSeguridad,
      respuestaHash,
      nombre,
    );
    return {
      id:                 result.lastInsertRowId,
      correo,
      contrasena:         contrasenhaHash,
      nombre,
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

  async actualizarFoto(id: number, fotoUri: string | null): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE entrenador SET foto_uri = ? WHERE id = ?',
      fotoUri,
      id,
    );
  }

  async actualizarNombre(id: number, nombre: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE entrenador SET nombre = ? WHERE id = ?',
      nombre,
      id,
    );
  }

  async eliminarCuenta(id: number): Promise<void> {
    const db = await getDatabase();
    // Borrar en orden inverso de dependencias FK, filtrando solo datos del entrenador
    await db.runAsync(
      `DELETE FROM competencia_atleta
       WHERE atleta_id IN (SELECT id FROM atletas WHERE entrenador_id = ?)
          OR competencia_id IN (SELECT id FROM competencias WHERE entrenador_id = ?)`,
      id, id,
    );
    await db.runAsync(
      `DELETE FROM asistencia
       WHERE atleta_id IN (SELECT id FROM atletas WHERE entrenador_id = ?)`,
      id,
    );
    await db.runAsync(
      `DELETE FROM marcas
       WHERE atleta_id IN (SELECT id FROM atletas WHERE entrenador_id = ?)`,
      id,
    );
    await db.runAsync('DELETE FROM competencias WHERE entrenador_id = ?', id);
    await db.runAsync('DELETE FROM sesiones    WHERE entrenador_id = ?', id);
    await db.runAsync('DELETE FROM atletas     WHERE entrenador_id = ?', id);
    await db.runAsync('DELETE FROM entrenador  WHERE id = ?', id);
  }
}
