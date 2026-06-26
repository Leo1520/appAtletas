import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
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

const ESTADOS: { valor: EstadoAsistencia; color: string; fondo: string }[] = [
  { valor: 'P', color: '#1A6B3C', fondo: '#D4EDDA' },
  { valor: 'A', color: '#7B1A1A', fondo: '#F8D7DA' },
  { valor: 'L', color: '#7A4B00', fondo: '#FFF3CD' },
];

export default function RegistroAsistenciaScreen({ route, navigation }: Props) {
  const { sesionId } = route.params;

  const [sesion, setSesion]     = useState<Sesion | null>(null);
  const [atletas, setAtletas]   = useState<Atleta[]>([]);   // lista completa (para el resumen)
  const [mapa, setMapa]         = useState<Record<number, EstadoAsistencia>>({});
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const [sesionData, todosAtletas, asistencias] = await Promise.all([
      sesionRepo.obtenerPorId(sesionId),
      atletaRepo.listarActivos(),
      // obtenerPorSesion restaura los estados ya guardados (permite reabrir y editar)
      asistenciaRepo.obtenerPorSesion(sesionId),
    ]);

    setSesion(sesionData);

    const lista = sesionData?.grupo
      ? todosAtletas.filter((a) => a.grupo === sesionData.grupo)
      : todosAtletas;
    setAtletas(lista);

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
    setMapa((prev) => ({ ...prev, [atletaId]: estado }));   // optimista
    await asistenciaRepo.guardarEstado(atletaId, sesionId, estado);
  }

  function handleGuardar() {
    Alert.alert('Asistencia guardada', `${porcentaje}% de asistencia registrado.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  // ── Resumen (sobre la lista completa, no la filtrada) ────────────────────────
  const total      = atletas.length;
  const presentes  = atletas.filter((a) => mapa[a.id] === 'P').length;
  const ausentes   = atletas.filter((a) => mapa[a.id] === 'A').length;
  const licencias  = atletas.filter((a) => mapa[a.id] === 'L').length;
  const sinMarcar  = total - atletas.filter((a) => mapa[a.id] !== undefined).length;
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  // ── Filtro de búsqueda (solo afecta lo que se muestra, no el resumen) ────────
  const termino = busqueda.trim().toLowerCase();
  const atletasFiltrados = termino
    ? atletas.filter(
        (a) =>
          a.nombre.toLowerCase().includes(termino) ||
          a.apellido.toLowerCase().includes(termino),
      )
    : atletas;

  function renderAtleta({ item }: { item: Atleta }) {
    const estadoActual = mapa[item.id];
    return (
      <View style={styles.fila}>
        <View style={styles.filaNombre}>
          <Text style={styles.nombre}>{item.apellido}, {item.nombre}</Text>
          <Text style={styles.disciplina}>{item.disciplina}</Text>
        </View>
        <View style={styles.botones}>
          {ESTADOS.map(({ valor, color, fondo }) => {
            const activo = estadoActual === valor;
            return (
              <TouchableOpacity
                key={valor}
                style={[
                  styles.botonEstado,
                  activo ? { backgroundColor: fondo, borderColor: color } : styles.botonEstadoInactivo,
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

      {/* Leyenda P / A / L */}
      <View style={styles.leyenda}>
        {[
          { label: 'P · Presente', color: '#1A6B3C' },
          { label: 'A · Ausente',  color: '#7B1A1A' },
          { label: 'L · Licencia', color: '#7A4B00' },
        ].map(({ label, color }) => (
          <Text key={label} style={[styles.leyendaTexto, { color }]}>{label}</Text>
        ))}
      </View>

      {sesion?.grupo ? (
        <Text style={styles.filtroAviso}>
          Grupo: {sesion.grupo}
        </Text>
      ) : null}

      {/* Barra de búsqueda */}
      <View style={styles.buscadorContenedor}>
        <Feather name="search" size={16} color="#999" style={styles.buscadorIcono} />
        <TextInput
          style={styles.buscador}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre o apellido…"
          placeholderTextColor="#999"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Lista */}
      {atletas.length === 0 ? (
        <View style={styles.vacio}>
          <Feather name="users" size={36} color="#CCC" />
          <Text style={styles.vacioTexto}>
            {sesion?.grupo
              ? `No hay atletas activos en el grupo "${sesion.grupo}".`
              : 'No hay atletas activos registrados.'}
          </Text>
        </View>
      ) : atletasFiltrados.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>Sin resultados para "{busqueda}".</Text>
        </View>
      ) : (
        <FlatList
          data={atletasFiltrados}
          keyExtractor={(a) => a.id.toString()}
          renderItem={renderAtleta}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separador} />}
        />
      )}

      {/* Botón Guardar */}
      <View style={styles.piePantalla}>
        <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardar}>
          <Feather name="check" size={18} color="#FFF" />
          <Text style={styles.botonGuardarTexto}>  Guardar asistencia</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F5F5' },
  carga: { marginTop: 60 },

  // Resumen
  resumen: {
    backgroundColor: '#FFF', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  porcentajeBloque: { alignItems: 'center', minWidth: 60 },
  porcentajeNum:   { fontSize: 28, fontWeight: '800', color: '#2E4057' },
  porcentajeLabel: { fontSize: 11, color: '#888', marginTop: -2 },
  resumenDetalle:  { flex: 1, justifyContent: 'center' },
  desglose: { fontSize: 13, lineHeight: 20, color: '#333' },
  punto:    { color: '#CCC', fontWeight: '400' },

  // Leyenda
  leyenda: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#FAFAFA', paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  leyendaTexto: { fontSize: 11, fontWeight: '600' },

  filtroAviso: { fontSize: 12, color: '#555', paddingHorizontal: 16, paddingTop: 8 },

  // Buscador
  buscadorContenedor: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC',
    borderRadius: 8, marginHorizontal: 12, marginTop: 10, marginBottom: 4,
    paddingHorizontal: 10,
  },
  buscadorIcono: { marginRight: 6 },
  buscador: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#333' },

  // Lista
  lista: { padding: 12, paddingBottom: 8 },
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
  botones:             { flexDirection: 'row', gap: 6 },
  botonEstado: {
    width: 36, height: 36, borderRadius: 6,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  botonEstadoInactivo: { backgroundColor: '#F5F5F5', borderColor: '#DDD' },
  botonLetra:          { fontSize: 13, fontWeight: '700' },

  // Vacío
  vacio:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  vacioTexto: { fontSize: 14, color: '#AAA', textAlign: 'center', marginTop: 12, lineHeight: 20 },

  // Pie con botón guardar
  piePantalla: {
    padding: 12, paddingBottom: 24,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  botonGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2E4057', borderRadius: 8, paddingVertical: 14,
  },
  botonGuardarTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
