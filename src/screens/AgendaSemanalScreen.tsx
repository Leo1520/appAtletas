import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SesionRepository } from '../repositories/SesionRepository';
import { Sesion } from '../types';
import { dateToFecha } from '../components/SelectorFechaHora';

type Props = NativeStackScreenProps<RootStackParamList, 'AgendaSemanal'>;

const repo = new SesionRepository();

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getInicioSemana(offset: number): Date {
  const hoy = new Date();
  const dow = hoy.getDay(); // 0=Dom
  const diffLunes = dow === 0 ? -6 : 1 - dow;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function addDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(base.getDate() + dias);
  return d;
}

function formatEncabezado(inicio: Date, fin: Date): string {
  const mismoMes = inicio.getMonth() === fin.getMonth();
  const mismoAnio = inicio.getFullYear() === fin.getFullYear();
  const iniStr = `${DIAS_SEMANA[0]} ${inicio.getDate()} ${MESES[inicio.getMonth()]}`;
  const finStr = `${DIAS_SEMANA[6]} ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
  return mismoMes && mismoAnio
    ? `${DIAS_SEMANA[0]} ${inicio.getDate()} – ${DIAS_SEMANA[6]} ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`
    : `${iniStr} – ${finStr}`;
}

function formatDiaSeccion(date: Date): string {
  return `${DIAS_SEMANA[(date.getDay() + 6) % 7]} ${date.getDate()} de ${MESES[date.getMonth()]}`;
}

export default function AgendaSemanalScreen({ navigation }: Props) {
  const [offset, setOffset]       = useState(0);
  const [sesiones, setSesiones]   = useState<Sesion[]>([]);
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('CrearSesion', {})} style={styles.botonAgregar}>
          <Feather name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => { cargar(); }, [offset]),
  );

  async function cargar() {
    setCargando(true);
    const inicio = getInicioSemana(offset);
    const fin    = addDias(inicio, 6);
    try {
      const lista = await repo.listarPorSemana(dateToFecha(inicio), dateToFecha(fin));
      setSesiones(lista);
    } finally {
      setCargando(false);
    }
  }

  const inicioSemana = getInicioSemana(offset);
  const finSemana    = addDias(inicioSemana, 6);

  // Agrupa sesiones por fecha y genera los 7 días
  const diasConSesiones = Array.from({ length: 7 }, (_, i) => {
    const dia  = addDias(inicioSemana, i);
    const str  = dateToFecha(dia);
    return { dia, str, sesiones: sesiones.filter((s) => s.fecha === str) };
  }).filter((d) => d.sesiones.length > 0);

  return (
    <View style={styles.contenedor}>
      {/* Navegación de semana */}
      <View style={styles.navSemana}>
        <TouchableOpacity onPress={() => setOffset((o) => o - 1)} style={styles.navBtn}>
          <Feather name="chevron-left" size={22} color="#2E4057" />
        </TouchableOpacity>
        <Text style={styles.navTitulo}>{formatEncabezado(inicioSemana, finSemana)}</Text>
        <TouchableOpacity onPress={() => setOffset((o) => o + 1)} style={styles.navBtn}>
          <Feather name="chevron-right" size={22} color="#2E4057" />
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator style={styles.carga} color="#2E4057" />
      ) : diasConSesiones.length === 0 ? (
        <View style={styles.vacioCont}>
          <Feather name="calendar" size={40} color="#CCC" />
          <Text style={styles.vacioTexto}>No hay sesiones programadas{'\n'}esta semana</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {diasConSesiones.map(({ dia, str, sesiones: sess }) => (
            <View key={str}>
              <Text style={styles.diaEncabezado}>{formatDiaSeccion(dia)}</Text>
              {sess.map((sesion) => (
                <TarjetaSesion
                  key={sesion.id}
                  sesion={sesion}
                  onPress={() => navigation.navigate('CrearSesion', { sesionId: sesion.id })}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TarjetaSesion({ sesion, onPress }: { sesion: Sesion; onPress: () => void }) {
  const cancelada = sesion.estado === 'cancelada';

  return (
    <TouchableOpacity
      style={[styles.tarjeta, cancelada && styles.tarjetaCancelada]}
      onPress={onPress}
    >
      <View style={styles.tarjetaFila}>
        <Feather name="clock" size={14} color={cancelada ? '#999' : '#2E4057'} />
        <Text style={[styles.hora, cancelada && styles.textoCancelado]}>
          {' '}{sesion.horaInicio}{sesion.horaFin ? ` – ${sesion.horaFin}` : ''}
        </Text>
        {cancelada && (
          <View style={styles.badgeCancelada}>
            <Text style={styles.badgeTexto}>Cancelada</Text>
          </View>
        )}
      </View>

      <Text style={[styles.descripcion, cancelada && styles.textoCancelado]}>
        {sesion.descripcion}
      </Text>

      <View style={styles.tarjetaFila}>
        {sesion.disciplina ? (
          <Text style={[styles.chip, cancelada && styles.chipCancelado]}>{sesion.disciplina}</Text>
        ) : null}
        {sesion.grupo ? (
          <Text style={[styles.chip, cancelada && styles.chipCancelado]}>{sesion.grupo}</Text>
        ) : null}
        {sesion.lugar ? (
          <>
            <Feather name="map-pin" size={12} color={cancelada ? '#BBB' : '#888'} />
            <Text style={[styles.lugar, cancelada && styles.textoCancelado]}>{' '}{sesion.lugar}</Text>
          </>
        ) : null}
      </View>

      {cancelada && sesion.motivoCancelacion ? (
        <Text style={styles.motivoTexto}>Motivo: {sesion.motivoCancelacion}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F5F5' },

  // Navegación semanal
  navSemana: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  navBtn: { padding: 6 },
  navTitulo: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#2E4057' },

  lista: { padding: 16, paddingBottom: 32 },
  carga: { marginTop: 40 },

  // Vacío
  vacioCont: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  vacioTexto: { fontSize: 15, color: '#AAA', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  // Sección por día
  diaEncabezado: {
    fontSize: 13, fontWeight: '700', color: '#2E4057',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 16, marginBottom: 6,
  },

  // Tarjeta de sesión
  tarjeta: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    marginBottom: 10, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    borderLeftWidth: 4, borderLeftColor: '#2E4057',
  },
  tarjetaCancelada: {
    backgroundColor: '#F9F9F9', borderLeftColor: '#CCC',
    elevation: 0, shadowOpacity: 0,
  },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  hora:        { fontSize: 14, fontWeight: '600', color: '#2E4057' },
  descripcion: { fontSize: 14, color: '#333', marginVertical: 4 },
  chip: {
    fontSize: 12, color: '#2E4057', backgroundColor: '#EEF2F7',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    marginRight: 6, marginBottom: 2,
  },
  chipCancelado: { color: '#999', backgroundColor: '#F0F0F0' },
  lugar: { fontSize: 12, color: '#888' },
  textoCancelado: { color: '#999', textDecorationLine: 'line-through' },
  badgeCancelada: {
    marginLeft: 'auto', backgroundColor: '#FEE2E2',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeTexto:  { fontSize: 11, color: '#C0392B', fontWeight: '600' },
  motivoTexto: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 4 },

  botonAgregar: { marginRight: 4, padding: 4 },
});
