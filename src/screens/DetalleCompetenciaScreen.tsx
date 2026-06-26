import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CompetenciaRepository } from '../repositories/CompetenciaRepository';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { ExportadorPDF } from '../services/exportador/ExportadorPDF';
import { Competencia, Atleta, CompetenciaAtleta } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleCompetencia'>;

const compRepo   = new CompetenciaRepository();
const atletaRepo = new AtletaRepository();
const exportador = new ExportadorPDF();

function formatFecha(str: string): string {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

type ResultadoInput = { posicion: string; marcaObtenida: string };

export default function DetalleCompetenciaScreen({ route, navigation }: Props) {
  const { competenciaId } = route.params;

  const [competencia, setCompetencia]     = useState<Competencia | null>(null);
  const [atletasActivos, setActivos]      = useState<Atleta[]>([]);
  const [atletaMap, setAtletaMap]         = useState<Record<number, Atleta>>({});
  const [convMap, setConvMap]             = useState<Record<number, CompetenciaAtleta>>({});
  const [resultados, setResultados]       = useState<Record<number, ResultadoInput>>({});
  const [cargando, setCargando]           = useState(true);
  const [guardandoRes, setGuardandoRes]   = useState(false);
  const [exportando, setExportando]       = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [competenciaId]),
  );

  async function cargar() {
    setCargando(true);
    const [comp, todosAtletas, convocados] = await Promise.all([
      compRepo.obtenerPorId(competenciaId),
      atletaRepo.listarTodos(),
      compRepo.listarConvocados(competenciaId),
    ]);

    const mapa: Record<number, Atleta> = {};
    todosAtletas.forEach((a) => { mapa[a.id] = a; });

    const cMap: Record<number, CompetenciaAtleta> = {};
    const rInput: Record<number, ResultadoInput>   = {};
    convocados.forEach((ca) => {
      cMap[ca.atletaId] = ca;
      rInput[ca.atletaId] = {
        posicion:      ca.posicion?.toString()      ?? '',
        marcaObtenida: ca.marcaObtenida?.toString() ?? '',
      };
    });

    if (comp) navigation.setOptions({ title: comp.nombre });
    setCompetencia(comp);
    setAtletaMap(mapa);
    setActivos(todosAtletas.filter((a) => a.activo));
    setConvMap(cMap);
    setResultados(rInput);
    setCargando(false);
  }

  // ── Toggle convocatoria ──────────────────────────────────────────────────────
  async function ejecutarDesconvocar(atletaId: number) {
    await compRepo.desconvocarAtleta(competenciaId, atletaId);
    setConvMap((prev) => { const n = { ...prev }; delete n[atletaId]; return n; });
    setResultados((prev) => { const n = { ...prev }; delete n[atletaId]; return n; });
  }

  async function toggleConvocado(atletaId: number) {
    if (convMap[atletaId]) {
      const inp = resultados[atletaId];
      const tieneResultados =
        (inp?.posicion?.trim() ?? '') !== '' || (inp?.marcaObtenida?.trim() ?? '') !== '';

      if (tieneResultados) {
        const atleta = atletaMap[atletaId];
        const nombre = atleta ? `${atleta.apellido}, ${atleta.nombre}` : 'este atleta';
        Alert.alert(
          'Eliminar convocatoria',
          `${nombre} ya tiene resultados registrados. Si lo desconvocas se borrarán permanentemente. ¿Confirmas?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Desconvocar', style: 'destructive', onPress: () => ejecutarDesconvocar(atletaId) },
          ],
        );
        return;
      }

      ejecutarDesconvocar(atletaId);
    } else {
      const ca = await compRepo.convocarAtleta(competenciaId, atletaId);
      setConvMap((prev) => ({ ...prev, [atletaId]: ca }));
      setResultados((prev) => ({ ...prev, [atletaId]: { posicion: '', marcaObtenida: '' } }));
    }
  }

  // ── Guardar resultados ───────────────────────────────────────────────────────
  async function handleGuardarResultados() {
    setGuardandoRes(true);
    try {
      const promesas = Object.keys(convMap).map((idStr) => {
        const atletaId = Number(idStr);
        const inp = resultados[atletaId] ?? { posicion: '', marcaObtenida: '' };
        const pos  = inp.posicion.trim()      ? Number(inp.posicion.replace(',', '.'))      : null;
        const marc = inp.marcaObtenida.trim() ? Number(inp.marcaObtenida.replace(',', '.')) : null;
        return compRepo.registrarResultado(competenciaId, atletaId, pos, marc);
      });
      await Promise.all(promesas);
      Alert.alert('Listo', 'Resultados guardados.');
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los resultados.');
    } finally {
      setGuardandoRes(false);
    }
  }

  // ── Exportar ─────────────────────────────────────────────────────────────────
  async function handleExportarConvocatoria() {
    if (!competencia) return;
    const numConvocados = Object.keys(convMap).length;
    if (numConvocados === 0) {
      Alert.alert('Sin convocados', 'Convoca al menos un atleta antes de exportar.');
      return;
    }
    setExportando(true);
    try {
      const atletasConv = atletasActivos
        .filter((a) => !!convMap[a.id])
        .map((a) => ({
          nombre: a.nombre, apellido: a.apellido,
          disciplina: a.disciplina, categoria: a.categoria,
        }));
      await exportador.exportarConvocatoria(competencia, atletasConv);
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  }

  async function handleExportarResultados() {
    if (!competencia) return;
    const numConvocados = Object.keys(convMap).length;
    if (numConvocados === 0) {
      Alert.alert('Sin convocados', 'No hay atletas convocados para exportar resultados.');
      return;
    }
    setExportando(true);
    try {
      const res = atletasActivos
        .filter((a) => !!convMap[a.id])
        .map((a) => {
          const inp = resultados[a.id];
          const pos  = inp?.posicion.trim()      ? Number(inp.posicion.replace(',', '.'))      : undefined;
          const marc = inp?.marcaObtenida.trim() ? Number(inp.marcaObtenida.replace(',', '.')) : undefined;
          return { nombre: a.nombre, apellido: a.apellido, posicion: pos, marcaObtenida: marc };
        });
      await exportador.exportarResultados(competencia, res);
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#2E4057" />
      </View>
    );
  }

  if (!competencia) {
    return (
      <View style={styles.cargando}>
        <Text style={{ color: '#AAA' }}>Competencia no encontrada.</Text>
      </View>
    );
  }

  const convocadosList = atletasActivos.filter((a) => !!convMap[a.id]);
  const numConvocados  = convocadosList.length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled">

      {/* Info de la competencia */}
      <View style={styles.infoCard}>
        <View style={styles.infoFila}>
          <Feather name="calendar" size={14} color="#888" />
          <Text style={styles.infoTexto}>{formatFecha(competencia.fecha)}</Text>
          <Feather name="map-pin" size={14} color="#888" style={{ marginLeft: 12 }} />
          <Text style={styles.infoTexto}>{competencia.lugar}</Text>
        </View>
        {competencia.descripcion ? (
          <Text style={styles.infoDesc}>{competencia.descripcion}</Text>
        ) : null}
      </View>

      {/* ── Sección Convocados ── */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Convocados</Text>
          <Text style={styles.seccionCount}>{numConvocados} seleccionados</Text>
        </View>

        {atletasActivos.map((atleta) => {
          const convocado = !!convMap[atleta.id];
          return (
            <TouchableOpacity
              key={atleta.id}
              style={[styles.atletaFila, convocado && styles.atletaFilaActiva]}
              onPress={() => toggleConvocado(atleta.id)}
              activeOpacity={0.7}
            >
              <Feather
                name={convocado ? 'check-square' : 'square'}
                size={20}
                color={convocado ? '#2E4057' : '#CCC'}
              />
              <View style={styles.atletaInfo}>
                <Text style={[styles.atletaNombre, convocado && styles.atletaNombreActivo]}>
                  {atleta.apellido}, {atleta.nombre}
                </Text>
                <Text style={styles.atletaSub}>{atleta.disciplina} · {atleta.categoria}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {atletasActivos.length === 0 && (
          <Text style={styles.sinAtletas}>No hay atletas activos registrados.</Text>
        )}
      </View>

      {/* ── Sección Resultados ── */}
      {numConvocados > 0 && (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Resultados</Text>
            <Text style={styles.seccionSub}>Pos. y marca por convocado</Text>
          </View>

          {convocadosList.map((atleta) => {
            const inp = resultados[atleta.id] ?? { posicion: '', marcaObtenida: '' };
            return (
              <View key={atleta.id} style={styles.resultadoFila}>
                <Text style={styles.resultadoNombre} numberOfLines={1}>
                  {atleta.apellido}, {atleta.nombre}
                </Text>
                <View style={styles.resultadoInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Pos.</Text>
                    <TextInput
                      style={styles.inputCorto}
                      value={inp.posicion}
                      onChangeText={(v) =>
                        setResultados((prev) => ({
                          ...prev,
                          [atleta.id]: { ...prev[atleta.id], posicion: v },
                        }))
                      }
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor="#CCC"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Marca</Text>
                    <TextInput
                      style={styles.inputCorto}
                      value={inp.marcaObtenida}
                      onChangeText={(v) =>
                        setResultados((prev) => ({
                          ...prev,
                          [atleta.id]: { ...prev[atleta.id], marcaObtenida: v },
                        }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor="#CCC"
                    />
                  </View>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.botonGuardar, guardandoRes && styles.botonDes]}
            onPress={handleGuardarResultados}
            disabled={guardandoRes}
          >
            <Text style={styles.botonGuardarTexto}>
              {guardandoRes ? 'Guardando…' : 'Guardar resultados'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Exportar ── */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Exportar PDF</Text>

        <TouchableOpacity
          style={[styles.botonExport, exportando && styles.botonDes]}
          onPress={handleExportarConvocatoria}
          disabled={exportando}
        >
          <Feather name="users" size={16} color="#2E4057" />
          <Text style={styles.botonExportTexto}>  Exportar convocatoria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botonExport, { marginTop: 8 }, exportando && styles.botonDes]}
          onPress={handleExportarResultados}
          disabled={exportando}
        >
          <Feather name="bar-chart-2" size={16} color="#2E4057" />
          <Text style={styles.botonExportTexto}>  Exportar resultados</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: '#F5F5F5' },
  contenedor: { padding: 16, paddingBottom: 48 },
  cargando:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

  infoCard: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  infoFila:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoTexto: { fontSize: 13, color: '#555' },
  infoDesc:  { fontSize: 13, color: '#777', marginTop: 8, fontStyle: 'italic' },

  seccion: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#E8E8E8',
  },
  seccionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#2E4057' },
  seccionCount:  { fontSize: 12, color: '#888' },
  seccionSub:    { fontSize: 12, color: '#AAA' },

  // Convocados toggle
  atletaFila: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  atletaFilaActiva:       { backgroundColor: '#F7F9FC' },
  atletaInfo:             { flex: 1 },
  atletaNombre:           { fontSize: 14, color: '#555' },
  atletaNombreActivo:     { color: '#2E4057', fontWeight: '600' },
  atletaSub:              { fontSize: 12, color: '#AAA', marginTop: 1 },
  sinAtletas:             { color: '#AAA', fontSize: 13, textAlign: 'center', padding: 12 },

  // Resultados
  resultadoFila: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    gap: 8,
  },
  resultadoNombre: { flex: 1, fontSize: 13, color: '#333' },
  resultadoInputs: { flexDirection: 'row', gap: 8 },
  inputGroup:      { alignItems: 'center' },
  inputLabel:      { fontSize: 10, color: '#AAA', marginBottom: 2, textTransform: 'uppercase' },
  inputCorto: {
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 14, color: '#333', textAlign: 'center', width: 64,
  },

  // Botones
  botonGuardar: {
    backgroundColor: '#2E4057', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', marginTop: 14,
  },
  botonGuardarTexto: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  botonExport: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E4057', borderRadius: 8,
    paddingVertical: 12, marginTop: 10,
  },
  botonExportTexto: { color: '#2E4057', fontSize: 15, fontWeight: '500' },
  botonDes: { opacity: 0.5 },
});
