import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Principal'>;

const MENU: {
  label: string;
  sub: string;
  icono: React.ComponentProps<typeof Feather>['name'];
  ruta: keyof RootStackParamList;
  params?: object;
}[] = [
  { label: 'Atletas',            sub: 'Perfiles y lista',         icono: 'users',       ruta: 'ListaAtletas' },
  { label: 'Agenda',             sub: 'Sesiones semanales',        icono: 'calendar',    ruta: 'AgendaSemanal' },
  { label: 'Cronómetro',         sub: 'Registrar marca',           icono: 'clock',       ruta: 'RegistrarMarca' },
  { label: 'Historial',          sub: 'Marcas y rendimiento',      icono: 'bar-chart-2', ruta: 'HistorialMarcas', params: {} },
  { label: 'Competencias',       sub: 'Convocatorias y resultados',icono: 'award',       ruta: 'ListaCompetencias' },
];

export default function PrincipalScreen({ navigation }: Props) {
  function handleCerrarSesion() {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <View style={styles.raiz}>
      <StatusBar barStyle="light-content" backgroundColor="#2E4057" />

      {/* ── CABECERA ── */}
      <SafeAreaView style={styles.cabecera}>
        <View style={styles.cabeceraContenido}>
          <View style={styles.cabeceraIzq}>
            <Text style={styles.cabeceraClub}>Club Deportivo Linces</Text>
            <Text style={styles.cabeceraBienvenida}>Bienvenido, Entrenador</Text>
          </View>
          <View style={styles.escudo}>
            <Feather name="shield" size={28} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      </SafeAreaView>

      {/* ── CUERPO ── */}
      <ScrollView
        style={styles.cuerpo}
        contentContainerStyle={styles.cuerpoContenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.seccionTitulo}>Módulos</Text>

        <View style={styles.grid}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.ruta}
              style={styles.tarjeta}
              onPress={() =>
                // @ts-ignore – params opcionales según ruta
                navigation.navigate(item.ruta, item.params)
              }
              activeOpacity={0.75}
            >
              <View style={styles.tarjetaIconoCont}>
                <Feather name={item.icono} size={22} color="#2E4057" />
              </View>
              <Text style={styles.tarjetaLabel}>{item.label}</Text>
              <Text style={styles.tarjetaSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── PIE ── */}
      <SafeAreaView style={styles.pie}>
        <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color="#C0392B" />
          <Text style={styles.botonSalirTexto}>  Cerrar sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#F0F2F5' },

  // ── Cabecera ──
  cabecera: { backgroundColor: '#2E4057' },
  cabeceraContenido: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24,
  },
  cabeceraIzq:       { flex: 1 },
  cabeceraClub:      { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.2 },
  cabeceraBienvenida:{ fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 4 },
  escudo: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Cuerpo ──
  cuerpo:         { flex: 1 },
  cuerpoContenido:{ padding: 20, paddingBottom: 8 },
  seccionTitulo:  { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
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
  tarjetaIconoCont: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EEF2F7',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  tarjetaLabel: { fontSize: 14, fontWeight: '700', color: '#2E4057', marginBottom: 2 },
  tarjetaSub:   { fontSize: 11, color: '#9CA3AF', lineHeight: 15 },

  // ── Pie ──
  pie: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  botonSalir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16,
  },
  botonSalirTexto: { color: '#C0392B', fontSize: 15, fontWeight: '600' },
});
