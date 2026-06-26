import { Competencia, CompetenciaAtleta } from '../types';

export interface ICompetenciaRepository {
  crear(competencia: Omit<Competencia, 'id'>): Promise<Competencia>;
  convocarAtleta(competenciaId: number, atletaId: number): Promise<CompetenciaAtleta>;
  registrarResultado(competenciaId: number, atletaId: number, posicion: number, marcaObtenida: number): Promise<void>;
  listarConvocados(competenciaId: number): Promise<CompetenciaAtleta[]>;
}
