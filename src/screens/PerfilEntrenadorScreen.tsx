import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { EntrenadorRepository } from '../repositories/EntrenadorRepository';

const repo = new EntrenadorRepository();

export default function PerfilEntrenadorScreen() {
  const navigation = useNavigation();
  const [correo, setCorreo] = useState('');

  useEffect(() => {
    // Hay un solo entrenador registrado en la app
    cargarCorreo();
  }, []);

  async function cargarCorreo() {
    try {
      // Reutilizamos obtenerPorCorreo indirectamente via DB directa no disponible;
      // usamos el repo para listar (sólo existe uno)
      const db = await import('../database/database').then((m) => m.getDatabase());
      const row = await db.getFirstAsync<{ correo: string }>(
        'SELECT correo FROM entrenador LIMIT 1',
      );
      if (row) setCorreo(row.correo);
    } catch {
      // sin correo, no crítico
    }
  }

  function handleCerrarSesion() {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
            ),
        },
      ],
    );
  }

  return (
    <View style={styles.raiz}>
      <SafeAreaView style={styles.cabecera}>
        <Text style={styles.cabeceraTitulo}>Perfil</Text>
      </SafeAreaView>

      <View style={styles.cuerpo}>
        {/* Avatar */}
        <View style={styles.avatarCont}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetra}>E</Text>
          </View>
          <Text style={styles.nombre}>Entrenador</Text>
          {correo ? <Text style={styles.correo}>{correo}</Text> : null}
        </View>

        {/* Opciones */}
        <View style={styles.seccion}>
          <View style={styles.filaInfo}>
            <Feather name="shield" size={18} color="#2E4057" />
            <View style={styles.filaInfoTexto}>
              <Text style={styles.filaInfoLabel}>Rol</Text>
              <Text style={styles.filaInfoValor}>Entrenador principal</Text>
            </View>
          </View>
          <View style={[styles.filaInfo, { borderBottomWidth: 0 }]}>
            <Feather name="database" size={18} color="#2E4057" />
            <View style={styles.filaInfoTexto}>
              <Text style={styles.filaInfoLabel}>Almacenamiento</Text>
              <Text style={styles.filaInfoValor}>Local · SQLite</Text>
            </View>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#C0392B" />
          <Text style={styles.botonSalirTexto}>  Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz:  { flex: 1, backgroundColor: '#F0F2F5' },

  cabecera: { backgroundColor: '#2E4057', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  cabeceraTitulo: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  cuerpo: { flex: 1, padding: 20 },

  // Avatar
  avatarCont: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2E4057',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLetra: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  nombre:      { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  correo:      { fontSize: 14, color: '#6B7280', marginTop: 4 },

  // Sección info
  seccion: {
    backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2, marginBottom: 20,
  },
  filaInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  filaInfoTexto: { flex: 1 },
  filaInfoLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  filaInfoValor: { fontSize: 15, color: '#1F2937', fontWeight: '500', marginTop: 1 },

  // Botón salir
  botonSalir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 16,
    borderWidth: 1, borderColor: '#FCA5A5',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  botonSalirTexto: { color: '#C0392B', fontSize: 15, fontWeight: '600' },
});
