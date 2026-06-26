import { Marca } from '../types';

export interface IMarcaRepository {
  crear(marca: Omit<Marca, 'id'>): Promise<Marca>;
  listarPorAtleta(atletaId: number): Promise<Marca[]>;
  marcarEsMarcaPersonal(id: number, esMarcaPersonal: boolean): Promise<void>;
}
