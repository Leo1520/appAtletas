import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MarcaRepository } from '../repositories/MarcaRepository';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { Marca } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'HistorialMarcas'>;

const marcaRepo  = new MarcaRepository();
const atletaRepo = new AtletaRepository();

// Segundos (ej. 13.24) → 'MM:SS.CC'
function formatSegundos(valor: number): string {
  const totalMs = Math.round(valor * 1000);
  const cc = Math.floor((totalMs % 1000) / 10);
  const s  = Math.floor(totalMs / 1000) % 60;
  const m  = Math.floor(totalMs / 60000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cc).padStart(2, '0')}`;
}

function formatValor(marca: Marca): string {
  if (marca.unidad === 'segundos') return formatSegundos(marca.valor);
  return `${marca.valor.toFixed(2)} m`;
}

function formatFecha(str: string): string {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function HistorialMarcasScreen({ route, navigation }: Props) {
  const atletaId   = route.params?.atletaId;
  const modoGeneral = atletaId === undefined;

  const [marcas, setMarcas]             = useState<Marca[]>([]);
  const [mapaAtletas, setMapaAtletas]   = useState<Record<number, string>>({});
  const [busqueda, setBusqueda]         = useState('');

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [atletaId]),
  );

  async function cargar() {
    if (modoGeneral) {
      const [todasMarcas, atletas] = await Promise.all([
        marcaRepo.listarTodas(),
        atletaRepo.listarTodos(),
      ]);
      const mapa: Record<number, string> = {};
      atletas.forEach((a) => {
        const etiqueta = a.activo ? '' : ' (inactivo)';
        mapa[a.id] = `${a.apellido}, ${a.nombre}${etiqueta}`;
      });
      setMapaAtletas(mapa);
      setMarcas(todasMarcas);
    } else {
      const [atletaMarcas, atleta] = await Promise.all([
        marcaRepo.listarPorAtleta(atletaId!),
        atletaRepo.obtenerPorId(atletaId!),
      ]);
      if (atleta) {
        navigation.setOptions({ title: `${atleta.apellido}, ${atleta.nombre}` });
      }
      setMarcas(atletaMarcas);
    }
  }

  const marcasFiltradas = busqueda.trim()
    ? marcas.filter((m) => {
        const texto = busqueda.toLowerCase();
        if (m.tipo.toLowerCase().includes(texto)) return true;
        if (modoGeneral) {
          const nombre = mapaAtletas[m.atletaId] ?? '';
          return nombre.toLowerCase().includes(texto);
        }
        return false;
      })
    : marcas;

  return (
    <View style={styles.contenedor}>
      {/* Barra de búsqueda */}
      <View style={styles.buscadorCont}>
        <Feather name="search" size={16} color="#999" />
        <TextInput
          style={styles.buscador}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={modoGeneral ? 'Filtrar por atleta o disciplina…' : 'Filtrar por disciplina…'}
          placeholderTextColor="#999"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Feather name="x" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={marcasFiltradas}
        keyExtractor={(m) => m.id.toString()}
        contentContainerStyle={
          marcasFiltradas.length === 0 ? styles.listaVaciaCont : styles.lista
        }
        ListEmptyComponent={
          <Text style={styles.listaVacia}>Aún no hay marcas registradas.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.fila, item.esMarcaPersonal && styles.filaPersonal]}>
            <View style={styles.filaIzq}>
              {modoGeneral && (
                <Text style={styles.atletaNombre}>
                  {mapaAtletas[item.atletaId] ?? `Atleta #${item.atletaId}`}
                </Text>
              )}
              <Text style={styles.disciplina}>{item.tipo}</Text>
              <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
              {item.notas ? (
                <Text style={styles.notas} numberOfLines={1}>{item.notas}</Text>
              ) : null}
            </View>

            <View style={styles.filaDer}>
              {item.esMarcaPersonal && (
                <View style={styles.badgePersonal}>
                  <Feather name="star" size={11} color="#92400E" />
                  <Text style={styles.badgeTexto}> MP</Text>
                </View>
              )}
              <Text style={[styles.valor, item.esMarcaPersonal && styles.valorPersonal]}>
                {formatValor(item)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F5F5' },

  buscadorCont: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFF', borderRadius: 8,
    borderWidth: 1, borderColor: '#DDD',
  },
  buscador: { flex: 1, fontSize: 15, color: '#333' },

  lista:          { paddingHorizontal: 16, paddingBottom: 24 },
  listaVaciaCont: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  listaVacia:     { color: '#AAA', fontSize: 15 },

  fila: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  filaPersonal: { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },

  filaIzq:     { flex: 1, marginRight: 12 },
  atletaNombre: { fontSize: 13, fontWeight: '600', color: '#2E4057', marginBottom: 2 },
  disciplina:   { fontSize: 15, color: '#333', fontWeight: '500' },
  fecha:        { fontSize: 12, color: '#888', marginTop: 2 },
  notas:        { fontSize: 12, color: '#AAA', marginTop: 2, fontStyle: 'italic' },

  filaDer:    { alignItems: 'flex-end', minWidth: 80 },
  badgePersonal: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4,
  },
  badgeTexto: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  valor:        { fontSize: 18, fontWeight: '300', color: '#333', fontVariant: ['tabular-nums'] },
  valorPersonal:{ color: '#2E4057', fontWeight: '600' },
});
