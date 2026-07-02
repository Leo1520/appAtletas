import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDatabase } from '../database/database';
import { getEntrenadorActual } from '../services/SesionService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MODULOS: {
  label: string;
  sub: string;
  icono: React.ComponentProps<typeof Feather>['name'];
  onPress: (nav: Nav) => void;
}[] = [
  {
    label: 'Atletas',
    sub: 'Perfiles y lista',
    icono: 'users',
    onPress: (nav) => nav.navigate('ListaAtletas'),
  },
  {
    label: 'Agenda',
    sub: 'Sesiones semanales',
    icono: 'calendar',
    onPress: (nav) => nav.navigate('AgendaSemanal'),
  },
  {
    label: 'Cronómetro',
    sub: 'Registrar marca',
    icono: 'clock',
    onPress: (nav) => nav.navigate('RegistrarMarca'),
  },
  {
    label: 'Historial',
    sub: 'Marcas y rendimiento',
    icono: 'bar-chart-2',
    onPress: (nav) => nav.navigate('HistorialMarcas', {}),
  },
  {
    label: 'Competencias',
    sub: 'Convocatorias y resultados',
    icono: 'award',
    onPress: (nav) => nav.navigate('ListaCompetencias'),
  },
  {
    label: 'Estadísticas',
    sub: 'Resumen del club',
    icono: 'trending-up',
    onPress: (nav) => nav.navigate('Estadisticas'),
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [fotoUri, setFotoUri] = useState<string | undefined>(undefined);
  const [nombre,  setNombre]  = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      setFotoUri(undefined);
      setNombre('');
      const entrenadorId = getEntrenadorActual();
      if (entrenadorId === null) return;
      (async () => {
        try {
          const db = await getDatabase();
          const row = await db.getFirstAsync<{ foto_uri: string | null; nombre: string | null }>(
            'SELECT foto_uri, nombre FROM entrenador WHERE id = ?',
            entrenadorId,
          );
          setFotoUri(row?.foto_uri ?? undefined);
          setNombre(row?.nombre ?? '');
        } catch {
          // no crítico
        }
      })();
    }, []),
  );

  function handleCampana() {
    navigation.navigate('Notificaciones');
  }

  return (
    <View style={styles.raiz}>
      <StatusBar barStyle="light-content" backgroundColor="#2E4057" />

      {/* ── CABECERA ── */}
      <SafeAreaView style={styles.cabecera}>
        <View style={styles.cabeceraTop}>
          <Text style={styles.cabeceraClub}>Club Deportivo Linces</Text>
          <View style={styles.cabeceraAcciones}>
            <TouchableOpacity onPress={handleCampana} style={styles.campanaBtn}>
              <Feather name="bell" size={20} color="#FFF" />
            </TouchableOpacity>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.avatarFoto} resizeMode="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetra}>E</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cabeceraBottom}>
          <Text style={styles.saludo}>Bienvenido,</Text>
          <Text style={styles.saludoNombre}>{nombre || 'Entrenador'}</Text>
        </View>
      </SafeAreaView>

      {/* ── CUERPO ── */}
      <ScrollView
        style={styles.cuerpo}
        contentContainerStyle={styles.cuerpoContenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.seccionLabel}>Módulos</Text>

        <View style={styles.grid}>
          {MODULOS.map((m) => (
            <TouchableOpacity
              key={m.label}
              style={styles.tarjeta}
              onPress={() => m.onPress(navigation)}
              activeOpacity={0.72}
            >
              <View style={styles.iconoCont}>
                <Feather name={m.icono} size={22} color="#2E4057" />
              </View>
              <Text style={styles.tarjetaLabel}>{m.label}</Text>
              <Text style={styles.tarjetaSub}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#F0F2F5' },

  // Cabecera
  cabecera: { backgroundColor: '#2E4057' },
  cabeceraTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  cabeceraClub: {
    fontSize: 13, fontWeight: '700', color: '#FFF',
    textTransform: 'uppercase', letterSpacing: 0.8,
    flex: 1,
  },
  cabeceraAcciones: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  campanaBtn: {
    padding: 4,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarFoto: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  avatarLetra: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  cabeceraBottom: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  saludo:       { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  saludoNombre: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 1 },

  // Cuerpo
  cuerpo:          { flex: 1 },
  cuerpoContenido: { padding: 16, paddingBottom: 16 },
  seccionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: 12, marginTop: 4,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tarjeta: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    width: '47.5%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconoCont: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EEF2F7',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  tarjetaLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  tarjetaSub:   { fontSize: 11, color: '#9CA3AF', lineHeight: 15 },
});
