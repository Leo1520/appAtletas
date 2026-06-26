import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AsistenciaRepository } from '../repositories/AsistenciaRepository';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { SesionRepository } from '../repositories/SesionRepository';
import { Atleta, Sesion } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroAsistencia'>;

const asistenciaRepo = new AsistenciaRepository();
const atletaRepo     = new AtletaRepository();
const sesionRepo     = new SesionRepository();

type EstadoAsistencia = 'P' | 'A' | 'L';

const ESTADOS: { valor: EstadoAsistencia; label: string; color: string; fondo: string }[] = [
  { valor: 'P', label: 'Presente', color: '#1A6B3C', fondo: '#D4EDDA' },
  { valor: 'A', label: 'Ausente',  color: '#7B1A1A', fondo: '#F8D7DA' },
  { valor: 'L', label: 'Licencia', color: '#7A4B00', fondo: '#FFF3CD' },
];

export default function RegistroAsistenciaScreen({ route, navigation }: Props) {
  const { sesionId } = route.params;

  const [sesion, setSesion]       = useState<Sesion | null>(null);
  const [atletas, setAtletas]     = useState<Atleta[]>([]);
  const [mapa, setMapa]           = useState<Record<number, EstadoAsistencia>>({});
  const [cargando, setCargando]   = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const [sesionData, todosAtletas, asistencias] = await Promise.all([
      sesionRepo.obtenerPorId(sesionId),
      atletaRepo.listarActivos(),
      asistenciaRepo.obtenerPorSesion(sesionId),
    ]);

    setSesion(sesionData);

    // Si la sesión tiene grupo, filtrar solo los atletas de ese grupo
    const lista = sesionData?.grupo
      ? todosAtletas.filter((a) => a.grupo === sesionData.grupo)
      : todosAtletas;
    setAtletas(lista);

    // Reconstruir mapa desde los registros existentes
    const mapaInicial: Record<number, EstadoAsistencia> = {};
    asistencias.forEach((a) => { mapaInicial[a.atletaId] = a.estado; });
    setMapa(mapaInicial);

    navigation.setOptions({
      title: sesionData
        ? `Asistencia · ${sesionData.fecha.split('-').reverse().join('/')}`
        : 'Asistencia',
    });
    setCargando(false);
  }

  async function marcar(atletaId: number, estado: EstadoAsistencia) {
    // Actualización optimista: la UI responde de inmediato
    setMapa((prev) => ({ ...prev, [atletaId]: estado }));
    await asistenciaRepo.guardarEstado(atletaId, sesionId, estado);
  }

  // ── Resumen ──────────────────────────────────────────────────────────────────
  const total      = atletas.length;
  const presentes  = atletas.filter((a) => mapa[a.id] === 'P').length;
  const ausentes   = atletas.filter((a) => mapa[a.id] === 'A').length;
  const licencias  = atletas.filter((a) => mapa[a.id] === 'L').length;
  const sinMarcar  = total - atletas.filter((a) => mapa[a.id] !== undefined).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  function renderAtleta({ item }: { item: Atleta }) {
    const estadoActual = mapa[item.id];
    return (
      <View style={styles.fila}>
        <View style={styles.filaNombre}>
          <Text style={styles.nombre}>{item.apellido}, {item.nombre}</Text>
          <Text style={styles.disciplina}>{item.disciplina}</Text>
        </View>
        <View style={styles.botones}>
          {ESTADOS.map(({ valor, label, color, fondo }) => {
            const activo = estadoActual === valor;
            return (
              <TouchableOpacity
                key={valor}
                style={[
                  styles.botonEstado,
                  activo
                    ? { backgroundColor: fondo, borderColor: color }
                    : styles.botonEstadoInactivo,
                ]}
                onPress={() => marcar(item.id, valor)}
              >
                <Text style={[styles.botonLetra, { color: activo ? color : '#999' }]}>
                  {valor}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (cargando) {
    return <ActivityIndicator style={styles.carga} color="#2E4057" />;
  }

  return (
    <View style={styles.contenedor}>
      {/* Resumen */}
      <View style={styles.resumen}>
        <View style={styles.porcentajeBloque}>
          <Text style={styles.porcentajeNum}>{porcentaje}%</Text>
          <Text style={styles.porcentajeLabel}>asistencia</Text>
        </View>
        <View style={styles.resumenDetalle}>
          <Text style={styles.desglose}>
            <Text style={{ color: '#1A6B3C', fontWeight: '600' }}>{presentes} presentes</Text>
            <Text style={styles.punto}> · </Text>
            <Text style={{ color: '#7B1A1A', fontWeight: '600' }}>{ausentes} ausentes</Text>
            <Text style={styles.punto}> · </Text>
            <Text style={{ color: '#7A4B00', fontWeight: '600' }}>{licencias} licencia</Text>
            <Text style={styles.punto}> · </Text>
            <Text style={{ color: '#888',    fontWeight: '600' }}>{sinMarcar} sin registrar</Text>
          </Text>
        </View>
      </View>

      {/* Referencia de colores */}
      <View style={styles.leyenda}>
        {ESTADOS.map(({ valor, label, color }) => (
          <View key={valor} style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: color }]} />
            <Text style={styles.leyendaTexto}>{valor} · {label}</Text>
          </View>
        ))}
      </View>

      {sesion?.grupo ? (
        <Text style={styles.filtroAviso}>
          <Feather name="users" size={12} color="#555" />  Mostrando grupo: {sesion.grupo}
        </Text>
      ) : null}

      {atletas.length === 0 ? (
        <View style={styles.vacio}>
          <Feather name="users" size={36} color="#CCC" />
          <Text style={styles.vacioTexto}>
            {sesion?.grupo
              ? `No hay atletas activos en el grupo "${sesion.grupo}".`
              : 'No hay atletas activos registrados.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={atletas}
          keyExtractor={(a) => a.id.toString()}
          renderItem={renderAtleta}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F5F5' },
  carga: { marginTop: 60 },

  // Resumen superior
  resumen: {
    backgroundColor: '#FFF', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  porcentajeBloque: { alignItems: 'center', minWidth: 60 },
  porcentajeNum:   { fontSize: 28, fontWeight: '800', color: '#2E4057' },
  porcentajeLabel: { fontSize: 11, color: '#888', marginTop: -2 },
  resumenDetalle: { flex: 1, justifyContent: 'center' },
  desglose: { fontSize: 13, lineHeight: 20, color: '#333' },
  punto:    { color: '#CCC', fontWeight: '400' },

  // Leyenda
  leyenda: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#FAFAFA', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  leyendaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leyendaDot:   { width: 8, height: 8, borderRadius: 4 },
  leyendaTexto: { fontSize: 11, color: '#666' },

  filtroAviso: { fontSize: 12, color: '#555', paddingHorizontal: 16, paddingVertical: 8 },

  // Lista
  lista: { padding: 12 },
  separador: { height: 1, backgroundColor: '#EEE', marginHorizontal: 4 },
  fila: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    justifyContent: 'space-between',
  },
  filaNombre: { flex: 1, marginRight: 8 },
  nombre:     { fontSize: 14, fontWeight: '600', color: '#2E4057' },
  disciplina: { fontSize: 12, color: '#888', marginTop: 1 },

  // Botones P / A / L
  botones:    { flexDirection: 'row', gap: 6 },
  botonEstado: {
    width: 36, height: 36, borderRadius: 6,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  botonEstadoInactivo: { backgroundColor: '#F5F5F5', borderColor: '#DDD' },
  botonLetra: { fontSize: 13, fontWeight: '700' },

  // Vacío
  vacio:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  vacioTexto: { fontSize: 14, color: '#AAA', textAlign: 'center', marginTop: 12, lineHeight: 20 },
});
