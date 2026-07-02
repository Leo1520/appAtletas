import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('linces.db');
  await crearTablas(db);
  return db;
}

async function crearTablas(db: SQLite.SQLiteDatabase): Promise<void> {
  // Migraciones para DBs existentes
  try { await db.execAsync('ALTER TABLE sesiones    ADD COLUMN notification_id TEXT'); }              catch { /* ya existe */ }
  try { await db.execAsync('ALTER TABLE atletas     ADD COLUMN entrenador_id INTEGER NOT NULL DEFAULT 1'); } catch { /* ya existe */ }
  try { await db.execAsync('ALTER TABLE sesiones    ADD COLUMN entrenador_id INTEGER NOT NULL DEFAULT 1'); } catch { /* ya existe */ }
  try { await db.execAsync('ALTER TABLE competencias ADD COLUMN entrenador_id INTEGER NOT NULL DEFAULT 1'); } catch { /* ya existe */ }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS entrenador (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre              TEXT,
      correo              TEXT    NOT NULL UNIQUE,
      contrasena          TEXT    NOT NULL,
      pregunta_seguridad  TEXT,
      respuesta_seguridad TEXT,
      foto_uri            TEXT
    );

    CREATE TABLE IF NOT EXISTS atletas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      entrenador_id    INTEGER NOT NULL DEFAULT 1,
      nombre           TEXT    NOT NULL,
      apellido         TEXT    NOT NULL,
      fecha_nacimiento TEXT    NOT NULL,
      disciplina       TEXT    NOT NULL,
      categoria        TEXT    NOT NULL,
      grupo            TEXT,
      foto_uri         TEXT,
      activo           INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      entrenador_id      INTEGER NOT NULL DEFAULT 1,
      fecha              TEXT    NOT NULL,
      hora_inicio        TEXT    NOT NULL,
      hora_fin           TEXT,
      descripcion        TEXT    NOT NULL,
      disciplina         TEXT    NOT NULL,
      lugar              TEXT,
      grupo              TEXT,
      estado             TEXT    NOT NULL DEFAULT 'activa',
      motivo_cancelacion TEXT,
      notification_id    TEXT
    );

    CREATE TABLE IF NOT EXISTS asistencia (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      atleta_id INTEGER NOT NULL,
      sesion_id INTEGER NOT NULL,
      estado    TEXT    NOT NULL DEFAULT 'A',
      UNIQUE (atleta_id, sesion_id),
      FOREIGN KEY (atleta_id) REFERENCES atletas(id),
      FOREIGN KEY (sesion_id) REFERENCES sesiones(id)
    );

    CREATE TABLE IF NOT EXISTS marcas (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      atleta_id         INTEGER NOT NULL,
      sesion_id         INTEGER,
      tipo              TEXT    NOT NULL,
      valor             REAL    NOT NULL,
      unidad            TEXT    NOT NULL,
      fecha             TEXT    NOT NULL,
      notas             TEXT,
      es_marca_personal INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (atleta_id) REFERENCES atletas(id),
      FOREIGN KEY (sesion_id) REFERENCES sesiones(id)
    );

    CREATE TABLE IF NOT EXISTS competencias (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      entrenador_id INTEGER NOT NULL DEFAULT 1,
      nombre        TEXT    NOT NULL,
      fecha         TEXT    NOT NULL,
      lugar         TEXT    NOT NULL,
      descripcion   TEXT
    );

    CREATE TABLE IF NOT EXISTS competencia_atleta (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      competencia_id INTEGER NOT NULL,
      atleta_id      INTEGER NOT NULL,
      posicion       INTEGER,
      marca_obtenida REAL,
      FOREIGN KEY (competencia_id) REFERENCES competencias(id),
      FOREIGN KEY (atleta_id)      REFERENCES atletas(id)
    );
  `);
}
