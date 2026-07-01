export interface Entrenador {
  id: number;
  correo: string;
  contrasena: string;
  preguntaSeguridad?: string;
  respuestaSeguridad?: string;
  fotoUri?: string;
}

export interface Atleta {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string; // ISO 8601: 'YYYY-MM-DD'
  disciplina: string;
  categoria: string;       // 'Infantil' | 'Juvenil'
  grupo?: string;
  fotoUri?: string;
  activo: boolean;
}

export interface Sesion {
  id: number;
  fecha: string;              // 'YYYY-MM-DD'
  horaInicio: string;         // 'HH:MM'
  horaFin?: string;           // 'HH:MM'
  descripcion: string;
  disciplina: string;
  lugar?: string;
  grupo?: string;
  estado: string;             // 'activa' | 'cancelada' | 'finalizada'
  motivoCancelacion?: string;
}

// estado: 'P' = Presente, 'A' = Ausente, 'L' = Licencia
export interface Asistencia {
  id: number;
  atletaId: number;
  sesionId: number;
  estado: 'P' | 'A' | 'L';
}

export interface Marca {
  id: number;
  atletaId: number;
  sesionId?: number;      // opcional: puede registrarse fuera de una sesión
  tipo: string;           // e.g. '100m planos', 'salto largo'
  valor: number;
  unidad: string;         // e.g. 'segundos', 'metros'
  fecha: string;          // 'YYYY-MM-DD'
  notas?: string;
  esMarcaPersonal: boolean;
}

export interface Competencia {
  id: number;
  nombre: string;
  fecha: string;          // 'YYYY-MM-DD'
  lugar: string;
  descripcion?: string;
}

export interface CompetenciaAtleta {
  id: number;
  competenciaId: number;
  atletaId: number;
  posicion?: number;
  marcaObtenida?: number;
}
