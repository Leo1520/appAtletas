import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SesionRepository } from '../repositories/SesionRepository';
import { Sesion } from '../types';

const repo = new SesionRepository();

function fechaStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFecha(str: string): string {
  const [y, m, d] = str.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  const hoy   = new Date(); hoy.setHours(0,0,0,0);
  const diff  = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
  const prefijo = diff === 0 ? 'Hoy' : 'Mañana';
  return `${prefijo} · ${d} de ${MESES[m - 1]}`;
}

function TarjetaSesion({ sesion }: { sesion: Sesion }) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaFila}>
        <Feather name="clock" size={14} color="#2E4057" />
        <Text style={styles.hora}>  {sesion.horaInicio}{sesion.horaFin ? ` – ${sesion.horaFin}` : ''}</Text>
      </View>
      <Text style={styles.descripcion}>{sesion.descripcion}</Text>
      <View style={styles.tarjetaFila}>
        {sesion.disciplina ? (
          <Text style={styles.chip}>{sesion.disciplina}</Text>
        ) : null}
        {sesion.grupo ? (
          <Text style={styles.chip}>{sesion.grupo}</Text>
        ) : null}
        {sesion.lugar ? (
          <View style={styles.tarjetaFila}>
            <Feather name="map-pin" size={12} color="#9CA3AF" />
            <Text style={styles.lugar}>  {sesion.lugar}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function NotificacionesScreen() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setCargando(true);
        try {
          const hoy    = fechaStr(0);
          const manana = fechaStr(1);
          const lista  = await repo.listarProximas([hoy, manana]);
          setSesiones(lista);
        } finally {
          setCargando(false);
        }
      })();
    }, []),
  );

  const hoy    = fechaStr(0);
  const manana = fechaStr(1);
  const deHoy    = sesiones.filter((s) => s.fecha === hoy);
  const deManana = sesiones.filter((s) => s.fecha === manana);

  return (
    <View style={styles.raiz}>
      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2E4057" />
      ) : sesiones.length === 0 ? (
        <View style={styles.vacioCont}>
          <Feather name="bell-off" size={44} color="#D1D5DB" />
          <Text style={styles.vacioTexto}>
            No hay sesiones programadas{'\n'}para hoy ni mañana.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {deHoy.length > 0 && (
            <>
              <Text style={styles.seccion}>{formatFecha(hoy)}</Text>
              {deHoy.map((s) => <TarjetaSesion key={s.id} sesion={s} />)}
            </>
          )}
          {deManana.length > 0 && (
            <>
              <Text style={styles.seccion}>{formatFecha(manana)}</Text>
              {deManana.map((s) => <TarjetaSesion key={s.id} sesion={s} />)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#F0F2F5' },

  lista:     { padding: 16, paddingBottom: 32 },
  vacioCont: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacioTexto:{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 14, lineHeight: 22 },

  seccion: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: 16, marginBottom: 8,
  },

  tarjeta: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: '#2E4057',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  hora:        { fontSize: 14, fontWeight: '600', color: '#2E4057' },
  descripcion: { fontSize: 14, color: '#1F2937', marginVertical: 4 },
  chip: {
    fontSize: 11, color: '#2E4057', backgroundColor: '#EEF2F7',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    marginRight: 6,
  },
  lugar: { fontSize: 12, color: '#9CA3AF' },
});
