import { Competencia, CompetenciaAtleta } from '../types';

export interface ICompetenciaRepository {
  listar(): Promise<Competencia[]>;
  crear(competencia: Omit<Competencia, 'id'>): Promise<Competencia>;
  obtenerPorId(id: number): Promise<Competencia | null>;
  convocarAtleta(competenciaId: number, atletaId: number): Promise<CompetenciaAtleta>;
  desconvocarAtleta(competenciaId: number, atletaId: number): Promise<void>;
  registrarResultado(
    competenciaId: number,
    atletaId: number,
    posicion: number | null,
    marcaObtenida: number | null,
  ): Promise<void>;
  listarConvocados(competenciaId: number): Promise<CompetenciaAtleta[]>;
}
