import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  Modal, FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MarcaRepository } from '../repositories/MarcaRepository';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { Atleta } from '../types';
import SelectorConInput from '../components/SelectorConInput';
import SelectorFechaHora, { dateToFecha } from '../components/SelectorFechaHora';
import {
  TipoDisciplina, inferirTipo, calcularEsMarcaPersonal,
  TIPO_POR_DISCIPLINA,
} from '../services/MarcaService';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrarMarca'>;

const marcaRepo  = new MarcaRepository();
const atletaRepo = new AtletaRepository();

const DISCIPLINAS_SEMILLA = Object.keys(TIPO_POR_DISCIPLINA);

// ── Formato cronómetro MM:SS.CC ─────────────────────────────────────────────
function formatMs(ms: number): string {
  const cc = Math.floor((ms % 1000) / 10);
  const s  = Math.floor(ms / 1000) % 60;
  const m  = Math.floor(ms / 60000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cc).padStart(2, '0')}`;
}

export default function RegistrarMarcaScreen({ navigation }: Props) {
  // Atleta
  const [atletas, setAtletas]           = useState<Atleta[]>([]);
  const [atletaId, setAtletaId]         = useState<number | null>(null);
  const [atletaLabel, setAtletaLabel]   = useState('');
  const [modalAtletas, setModalAtletas] = useState(false);
  const [busquedaAtleta, setBusquedaAtleta] = useState('');

  // Disciplina y tipo
  const [disciplina, setDisciplina]         = useState('');
  const [opcionesDisciplina, setOpciones]   = useState<string[]>(DISCIPLINAS_SEMILLA);
  const [tipo, setTipo]                     = useState<TipoDisciplina>('tiempo');
  const [tipoManual, setTipoManual]         = useState(false); // true cuando el tipo no se puede inferir

  // Cronómetro
  const startTimeRef                      = useRef<number | null>(null);
  const intervalRef                       = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tiempoMs, setTiempoMs]           = useState(0);
  const [corriendo, setCorriendo]         = useState(false);
  const [detenido, setDetenido]           = useState(false);  // tiempo tomado, listo para guardar

  // Distancia
  const [distancia, setDistancia]         = useState('');

  // Comunes
  const [fecha, setFecha]                 = useState(dateToFecha(new Date()));
  const [notas, setNotas]                 = useState('');
  const [guardando, setGuardando]         = useState(false);

  useEffect(() => {
    atletaRepo.listarActivos().then(setAtletas);
    atletaRepo.listarDisciplinas().then((dbDisc) => {
      setOpciones([
        ...DISCIPLINAS_SEMILLA,
        ...dbDisc.filter((d) => !DISCIPLINAS_SEMILLA.includes(d)),
      ]);
    });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Al cambiar la disciplina, inferir o pedir el tipo
  useEffect(() => {
    if (!disciplina) return;
    const inferido = inferirTipo(disciplina);
    if (inferido) {
      setTipo(inferido);
      setTipoManual(false);
    } else {
      setTipoManual(true);   // disciplina nueva: el entrenador elige el tipo
    }
    // Reiniciar valores del instrumento al cambiar disciplina
    reiniciarCrono();
    setDistancia('');
  }, [disciplina]);

  // ── Cronómetro ──────────────────────────────────────────────────────────────
  function iniciarCrono() {
    const ahora = Date.now();
    startTimeRef.current = ahora;
    setCorriendo(true);
    setDetenido(false);
    intervalRef.current = setInterval(() => {
      // El tiempo real siempre viene de Date.now() − inicio, no del contador del interval
      setTiempoMs(Date.now() - startTimeRef.current!);
    }, 33);
  }

  function detenerCrono() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (startTimeRef.current) setTiempoMs(Date.now() - startTimeRef.current);
    startTimeRef.current = null;
    setCorriendo(false);
    setDetenido(true);
  }

  function reiniciarCrono() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = null;
    setTiempoMs(0);
    setCorriendo(false);
    setDetenido(false);
  }

  // ── Seleccionar atleta ───────────────────────────────────────────────────────
  const atletasFiltrados = busquedaAtleta.trim()
    ? atletas.filter((a) =>
        `${a.nombre} ${a.apellido}`.toLowerCase().includes(busquedaAtleta.toLowerCase()),
      )
    : atletas;

  function seleccionarAtleta(a: Atleta) {
    setAtletaId(a.id);
    setAtletaLabel(`${a.apellido}, ${a.nombre}`);
    setModalAtletas(false);
    setBusquedaAtleta('');
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  async function handleGuardar() {
    if (!atletaId) { Alert.alert('Requerido', 'Selecciona un atleta.'); return; }
    if (!disciplina) { Alert.alert('Requerido', 'Selecciona la disciplina.'); return; }

    let valor: number;
    let unidad: string;

    if (tipo === 'tiempo') {
      if (!detenido || tiempoMs === 0) {
        Alert.alert('Sin tiempo', 'Inicia y detén el cronómetro antes de guardar.');
        return;
      }
      valor = tiempoMs / 1000;   // segundos con decimales (ej. 13.24)
      unidad = 'segundos';
    } else {
      const num = parseFloat(distancia.replace(',', '.'));
      if (isNaN(num) || num <= 0) {
        Alert.alert('Valor inválido', 'Ingresa la distancia en metros.');
        return;
      }
      valor = num;
      unidad = 'metros';
    }

    setGuardando(true);
    try {
      const esPersonal = await calcularEsMarcaPersonal(atletaId, disciplina, valor, tipo);
      await marcaRepo.crear({
        atletaId,
        tipo: disciplina,
        valor,
        unidad,
        fecha,
        notas: notas.trim() || undefined,
        esMarcaPersonal: esPersonal,
      });

      if (esPersonal) {
        Alert.alert('¡Nueva marca personal! ★',
          `${atletaLabel}\n${disciplina}: ${tipo === 'tiempo' ? formatMs(tiempoMs) : `${valor} m`}`,
          [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert('Marca registrada',
          `${atletaLabel} · ${disciplina}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la marca.');
    } finally {
      setGuardando(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">

        {/* Atleta */}
        <Text style={styles.etiqueta}>Atleta</Text>
        <TouchableOpacity style={styles.selectorBtn} onPress={() => setModalAtletas(true)}>
          <Text style={atletaLabel ? styles.selectorTexto : styles.selectorPlaceholder}>
            {atletaLabel || 'Seleccionar atleta…'}
          </Text>
          <Feather name="chevron-right" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* Disciplina */}
        <Text style={styles.etiqueta}>Disciplina</Text>
        <SelectorConInput
          label="Disciplina" valor={disciplina} opciones={opcionesDisciplina}
          onSeleccionar={setDisciplina} placeholder="Seleccionar disciplina…"
          labelNuevo="+ Agregar nueva disciplina"
        />

        {/* Tipo (solo cuando no se puede inferir automáticamente) */}
        {disciplina !== '' && tipoManual && (
          <View>
            <Text style={styles.etiqueta}>Tipo de medición</Text>
            <View style={styles.tipoFila}>
              {(['tiempo', 'distancia'] as TipoDisciplina[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tipoBtn, tipo === t && styles.tipoBtnActivo]}
                  onPress={() => setTipo(t)}
                >
                  <Feather
                    name={t === 'tiempo' ? 'clock' : 'maximize-2'}
                    size={14}
                    color={tipo === t ? '#FFF' : '#555'}
                  />
                  <Text style={[styles.tipoTexto, tipo === t && styles.tipoTextoActivo]}>
                    {'  '}{t === 'tiempo' ? 'Tiempo' : 'Distancia'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Indicador de tipo inferido */}
        {disciplina !== '' && !tipoManual && (
          <Text style={styles.tipoInferido}>
            <Feather name={tipo === 'tiempo' ? 'clock' : 'maximize-2'} size={12} color="#6B7280" />
            {'  '}Medición en {tipo === 'tiempo' ? 'tiempo (cronómetro)' : 'distancia (metros)'}
          </Text>
        )}

        {/* ── Cronómetro ── */}
        {tipo === 'tiempo' && (
          <View style={styles.cronoContenedor}>
            <Text style={styles.cronoDisplay}>{formatMs(tiempoMs)}</Text>
            <View style={styles.cronoBotones}>
              {!corriendo && !detenido && (
                <TouchableOpacity style={styles.cronoBtnIniciar} onPress={iniciarCrono}>
                  <Feather name="play" size={20} color="#FFF" />
                  <Text style={styles.cronoBtnTexto}>  Iniciar</Text>
                </TouchableOpacity>
              )}
              {corriendo && (
                <TouchableOpacity style={styles.cronoBtnDetener} onPress={detenerCrono}>
                  <Feather name="square" size={20} color="#FFF" />
                  <Text style={styles.cronoBtnTexto}>  Detener</Text>
                </TouchableOpacity>
              )}
              {(detenido || tiempoMs > 0) && !corriendo && (
                <TouchableOpacity style={styles.cronoBtnReiniciar} onPress={reiniciarCrono}>
                  <Feather name="refresh-ccw" size={16} color="#555" />
                  <Text style={styles.cronoBtnReiniciarTexto}>  Reiniciar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Distancia ── */}
        {tipo === 'distancia' && (
          <View>
            <Text style={styles.etiqueta}>Distancia (metros)</Text>
            <View style={styles.distanciaFila}>
              <TextInput
                style={[styles.input, styles.distanciaInput]}
                value={distancia}
                onChangeText={setDistancia}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#999"
              />
              <Text style={styles.distanciaUnidad}>m</Text>
            </View>
          </View>
        )}

        {/* Fecha */}
        <Text style={styles.etiqueta}>Fecha</Text>
        <SelectorFechaHora
          mode="date" valor={fecha} onSeleccionar={setFecha}
          placeholder="Seleccionar fecha" maximumDate={new Date()}
        />

        {/* Notas */}
        <Text style={styles.etiqueta}>Notas <Text style={styles.opcional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, styles.inputMultilinea]}
          value={notas} onChangeText={setNotas}
          placeholder="Condiciones, viento, observaciones…"
          placeholderTextColor="#999" multiline numberOfLines={2}
        />

        {/* Guardar */}
        <TouchableOpacity
          style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
          onPress={handleGuardar} disabled={guardando}
        >
          <Text style={styles.botonGuardarTexto}>{guardando ? 'Guardando…' : 'Guardar marca'}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal selector de atletas */}
      <Modal visible={modalAtletas} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalHoja}>
            <View style={styles.modalBarra}>
              <Text style={styles.modalTitulo}>Seleccionar atleta</Text>
              <TouchableOpacity onPress={() => { setModalAtletas(false); setBusquedaAtleta(''); }}>
                <Text style={styles.modalCerrar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buscadorCont}>
              <Feather name="search" size={15} color="#999" />
              <TextInput
                style={styles.buscador}
                value={busquedaAtleta}
                onChangeText={setBusquedaAtleta}
                placeholder="Buscar…"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>
            <FlatList
              data={atletasFiltrados}
              keyExtractor={(a) => a.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.atletaItem, atletaId === item.id && styles.atletaItemActivo]}
                  onPress={() => seleccionarAtleta(item)}
                >
                  <Text style={[styles.atletaItemNombre, atletaId === item.id && styles.atletaItemNombreActivo]}>
                    {item.apellido}, {item.nombre}
                  </Text>
                  <Text style={styles.atletaItemSub}>{item.disciplina}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.listaVacia}>Sin resultados.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  contenedor: { padding: 24, paddingBottom: 48 },
  etiqueta: { fontSize: 14, color: '#555', marginTop: 16, marginBottom: 4 },
  opcional: { fontSize: 12, color: '#999' },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#333',
  },
  inputMultilinea: { minHeight: 64, textAlignVertical: 'top' },

  // Selector de atleta
  selectorBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectorTexto:      { fontSize: 15, color: '#333' },
  selectorPlaceholder:{ fontSize: 15, color: '#999' },

  // Tipo de medición
  tipoFila:    { flexDirection: 'row', gap: 10 },
  tipoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CCC',
    backgroundColor: '#FFF',
  },
  tipoBtnActivo:   { backgroundColor: '#2E4057', borderColor: '#2E4057' },
  tipoTexto:       { fontSize: 14, color: '#555', fontWeight: '500' },
  tipoTextoActivo: { color: '#FFF' },
  tipoInferido:    { fontSize: 12, color: '#6B7280', marginTop: 6 },

  // Cronómetro
  cronoContenedor: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginTop: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  cronoDisplay: {
    fontSize: 52, fontWeight: '200', color: '#2E4057',
    fontVariant: ['tabular-nums'], letterSpacing: 2,
  },
  cronoBotones:          { flexDirection: 'row', gap: 12, marginTop: 16 },
  cronoBtnIniciar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#27AE60', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24,
  },
  cronoBtnDetener: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#C0392B', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24,
  },
  cronoBtnReiniciar: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#CCC', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  cronoBtnTexto:         { color: '#FFF', fontSize: 15, fontWeight: '600' },
  cronoBtnReiniciarTexto:{ color: '#555', fontSize: 14 },

  // Distancia
  distanciaFila:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distanciaInput: { flex: 1, fontSize: 24, textAlign: 'center', fontWeight: '300' },
  distanciaUnidad:{ fontSize: 18, color: '#888', fontWeight: '300' },

  // Guardar
  botonGuardar: {
    backgroundColor: '#2E4057', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 32,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonGuardarTexto:  { color: '#FFF', fontSize: 16, fontWeight: '600' },

  // Modal atletas
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalHoja: {
    backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '75%', paddingBottom: 24,
  },
  modalBarra: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  modalTitulo: { fontSize: 16, fontWeight: '600', color: '#2E4057' },
  modalCerrar: { fontSize: 15, color: '#888' },
  buscadorCont: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, padding: 10, backgroundColor: '#F5F5F5', borderRadius: 8,
  },
  buscador: { flex: 1, fontSize: 15, color: '#333' },
  atletaItem: {
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  atletaItemActivo:      { backgroundColor: '#F0F4F8' },
  atletaItemNombre:      { fontSize: 15, color: '#333' },
  atletaItemNombreActivo:{ color: '#2E4057', fontWeight: '600' },
  atletaItemSub:         { fontSize: 12, color: '#888', marginTop: 2 },
  listaVacia: { textAlign: 'center', color: '#AAA', padding: 24 },
});
