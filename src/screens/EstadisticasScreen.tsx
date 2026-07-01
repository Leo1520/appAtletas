import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '../database/database';

interface Stats {
  atletasActivos: number;
  sesionesEsteMes: number;
  asistenciaPromedio: number | null; // null si no hay sesiones este mes
  topMarcas: { nombre: string; apellido: string; total: number }[];
}

function mesActual(): string {
  const hoy = new Date();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${hoy.getFullYear()}-${m}`;
}

export default function EstadisticasScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, []),
  );

  async function cargar() {
    setCargando(true);
    try {
      const db = await getDatabase();
      const mes = mesActual();

      const [rowAtletas, rowSesiones, rowAsistencia, rowsTop] = await Promise.all([
        db.getFirstAsync<{ total: number }>(
          'SELECT COUNT(*) AS total FROM atletas WHERE activo = 1',
        ),
        db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(*) AS total FROM sesiones WHERE fecha LIKE ?`,
          `${mes}-%`,
        ),
        db.getFirstAsync<{ porcentaje: number | null }>(
          `SELECT
             CAST(COUNT(CASE WHEN a.estado = 'P' THEN 1 END) AS REAL) * 100.0 / NULLIF(COUNT(*), 0) AS porcentaje
           FROM asistencia a
           WHERE a.sesion_id IN (SELECT id FROM sesiones WHERE fecha LIKE ?)`,
          `${mes}-%`,
        ),
        db.getAllAsync<{ nombre: string; apellido: string; total: number }>(
          `SELECT at.nombre, at.apellido, COUNT(*) AS total
           FROM marcas m
           JOIN atletas at ON at.id = m.atleta_id
           WHERE m.es_marca_personal = 1
           GROUP BY m.atleta_id
           ORDER BY total DESC
           LIMIT 3`,
        ),
      ]);

      setStats({
        atletasActivos:     rowAtletas?.total ?? 0,
        sesionesEsteMes:    rowSesiones?.total ?? 0,
        asistenciaPromedio: rowAsistencia?.porcentaje ?? null,
        topMarcas:          rowsTop,
      });
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2E4057" />
      </View>
    );
  }

  if (!stats) return null;

  const mesLabel = new Date().toLocaleString('es', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.raiz} contentContainerStyle={styles.contenido}>

      <Text style={styles.seccion}>Resumen del club</Text>

      <View style={styles.fila2}>
        <Tarjeta
          icono="users"
          valor={String(stats.atletasActivos)}
          etiqueta="Atletas activos"
          color="#2E4057"
        />
        <Tarjeta
          icono="calendar"
          valor={String(stats.sesionesEsteMes)}
          etiqueta={`Sesiones en ${mesLabel}`}
          color="#3B82F6"
        />
      </View>

      <TarjetaAncha
        icono="percent"
        valor={
          stats.asistenciaPromedio !== null
            ? `${Math.round(stats.asistenciaPromedio)}%`
            : '—'
        }
        etiqueta={`Asistencia promedio este mes${stats.asistenciaPromedio === null ? ' (sin datos)' : ''}`}
        color="#10B981"
      />

      <Text style={styles.seccion}>Top atletas — marcas personales</Text>

      {stats.topMarcas.length === 0 ? (
        <View style={styles.vacioCont}>
          <Feather name="star" size={36} color="#D1D5DB" />
          <Text style={styles.vacioTexto}>Aún no hay marcas personales registradas.</Text>
        </View>
      ) : (
        stats.topMarcas.map((a, i) => (
          <FilaTop key={`${a.nombre}-${a.apellido}`} posicion={i + 1} atleta={a} />
        ))
      )}
    </ScrollView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function Tarjeta({
  icono, valor, etiqueta, color,
}: {
  icono: React.ComponentProps<typeof Feather>['name'];
  valor: string; etiqueta: string; color: string;
}) {
  return (
    <View style={[styles.tarjeta, { flex: 1 }]}>
      <View style={[styles.iconoCont, { backgroundColor: color + '18' }]}>
        <Feather name={icono} size={20} color={color} />
      </View>
      <Text style={[styles.tarjetaValor, { color }]}>{valor}</Text>
      <Text style={styles.tarjetaEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function TarjetaAncha({
  icono, valor, etiqueta, color,
}: {
  icono: React.ComponentProps<typeof Feather>['name'];
  valor: string; etiqueta: string; color: string;
}) {
  return (
    <View style={[styles.tarjeta, styles.tarjetaAncha]}>
      <View style={[styles.iconoCont, { backgroundColor: color + '18' }]}>
        <Feather name={icono} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.tarjetaValor, { color, fontSize: 28 }]}>{valor}</Text>
        <Text style={styles.tarjetaEtiqueta}>{etiqueta}</Text>
      </View>
    </View>
  );
}

const MEDALLAS = ['🥇', '🥈', '🥉'];

function FilaTop({
  posicion, atleta,
}: {
  posicion: number;
  atleta: { nombre: string; apellido: string; total: number };
}) {
  return (
    <View style={styles.filaTop}>
      <Text style={styles.medalla}>{MEDALLAS[posicion - 1] ?? posicion}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.filaNombre}>{atleta.apellido}, {atleta.nombre}</Text>
      </View>
      <View style={styles.filaBadge}>
        <Feather name="star" size={12} color="#F59E0B" />
        <Text style={styles.filaBadgeTexto}> {atleta.total} MP</Text>
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  raiz:     { flex: 1, backgroundColor: '#F0F2F5' },
  contenido:{ padding: 16, paddingBottom: 32 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  seccion: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 20, marginBottom: 10,
  },

  fila2: { flexDirection: 'row', gap: 12, marginBottom: 12 },

  tarjeta: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tarjetaAncha: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 4,
  },
  iconoCont: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  tarjetaValor:   { fontSize: 32, fontWeight: '800', lineHeight: 36 },
  tarjetaEtiqueta:{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },

  vacioCont: { alignItems: 'center', paddingVertical: 32 },
  vacioTexto: { color: '#9CA3AF', fontSize: 13, marginTop: 10, textAlign: 'center' },

  filaTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  medalla:       { fontSize: 22, width: 30, textAlign: 'center' },
  filaNombre:    { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  filaBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  filaBadgeTexto:{ fontSize: 12, color: '#92400E', fontWeight: '700' },
});
