import { Competencia } from '../../types';

export interface IExportador {
  exportarConvocatoria(
    competencia: Competencia,
    atletas: { nombre: string; apellido: string; disciplina: string; categoria: string }[],
  ): Promise<void>;

  exportarResultados(
    competencia: Competencia,
    resultados: { nombre: string; apellido: string; posicion?: number; marcaObtenida?: number }[],
  ): Promise<void>;
}
