import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Principal'>;

export default function PrincipalScreen({ navigation }: Props) {
  function handleCerrarSesion() {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Club Deportivo Linces</Text>
      <Text style={styles.bienvenida}>Bienvenido, Entrenador</Text>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.botonMenu} onPress={() => navigation.navigate('ListaAtletas')}>
          <Text style={styles.botonMenuTexto}>Atletas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonMenu} onPress={() => navigation.navigate('AgendaSemanal')}>
          <Text style={styles.botonMenuTexto}>Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonMenu} onPress={() => navigation.navigate('RegistrarMarca')}>
          <Text style={styles.botonMenuTexto}>Cronómetro / Marcas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonMenu} onPress={() => navigation.navigate('HistorialMarcas', {})}>
          <Text style={styles.botonMenuTexto}>Historial</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion}>
        <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  titulo: { fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  bienvenida: { fontSize: 26, fontWeight: '700', color: '#2E4057', marginTop: 4, marginBottom: 40 },
  menu: { flex: 1, gap: 12 },
  botonMenu: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2E4057',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  botonMenuTexto: { fontSize: 16, fontWeight: '600', color: '#2E4057' },
  botonSalir: {
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonSalirTexto: { color: '#C0392B', fontSize: 15, fontWeight: '600' },
});
