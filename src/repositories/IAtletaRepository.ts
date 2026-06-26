import { Atleta } from '../types';

export interface IAtletaRepository {
  crear(atleta: Omit<Atleta, 'id'>): Promise<Atleta>;
  actualizar(atleta: Atleta): Promise<Atleta>;
  desactivar(id: number): Promise<void>;
  obtenerPorId(id: number): Promise<Atleta | null>;
  listarActivos(): Promise<Atleta[]>;
  buscarPorNombre(nombre: string): Promise<Atleta[]>;
  listarDisciplinas(): Promise<string[]>;
  listarGrupos(): Promise<string[]>;
}
