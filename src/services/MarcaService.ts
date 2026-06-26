import { MarcaRepository } from '../repositories/MarcaRepository';

const repo = new MarcaRepository();

export type TipoDisciplina = 'tiempo' | 'distancia';

// Disciplinas de la semilla y su tipo por defecto
export const TIPO_POR_DISCIPLINA: Record<string, TipoDisciplina> = {
  '100m':                  'tiempo',
  '200m':                  'tiempo',
  '400m':                  'tiempo',
  '800m':                  'tiempo',
  '1500m':                 'tiempo',
  '5000m':                 'tiempo',
  'Vallas':                'tiempo',
  'Salto largo':           'distancia',
  'Salto alto':            'distancia',
  'Lanzamiento de bala':   'distancia',
  'Lanzamiento de disco':  'distancia',
  'Jabalina':              'distancia',
};

export function inferirTipo(disciplina: string): TipoDisciplina | null {
  return TIPO_POR_DISCIPLINA[disciplina] ?? null;
}

/**
 * Compara el valor nuevo con el historial del atleta en esa disciplina.
 * - tiempo: personal si el nuevo valor (segundos) es MENOR que todos los anteriores.
 * - distancia: personal si el nuevo valor (metros) es MAYOR que todos los anteriores.
 * La primera marca en una disciplina siempre se considera marca personal.
 */
export async function calcularEsMarcaPersonal(
  atletaId: number,
  disciplina: string,
  valor: number,
  tipo: TipoDisciplina,
): Promise<boolean> {
  const previas = await repo.listarPorAtletaYDisciplina(atletaId, disciplina);
  if (previas.length === 0) return true;

  if (tipo === 'tiempo') {
    return valor < Math.min(...previas.map((m) => m.valor));
  }
  return valor > Math.max(...previas.map((m) => m.valor));
}
