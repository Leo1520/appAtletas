import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { EntrenadorRepository } from '../repositories/EntrenadorRepository';
import SelectorFoto from '../components/SelectorFoto';

const repo = new EntrenadorRepository();

export default function PerfilEntrenadorScreen() {
  const navigation = useNavigation();
  const [correo, setCorreo]   = useState('');
  const [fotoUri, setFotoUri] = useState<string | undefined>(undefined);
  const [entrenadorId, setEntrenadorId] = useState<number | null>(null);

  useEffect(() => {
    cargarEntrenador();
  }, []);

  async function cargarEntrenador() {
    try {
      const db = await import('../database/database').then((m) => m.getDatabase());
      const row = await db.getFirstAsync<{ id: number; correo: string; foto_uri: string | null }>(
        'SELECT id, correo, foto_uri FROM entrenador LIMIT 1',
      );
      if (row) {
        setEntrenadorId(row.id);
        setCorreo(row.correo);
        setFotoUri(row.foto_uri ?? undefined);
      }
    } catch {
      // no crítico
    }
  }

  async function handleFotoSeleccionada(uri: string) {
    if (entrenadorId === null) return;
    setFotoUri(uri);
    try {
      await repo.actualizarFoto(entrenadorId, uri);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la foto. Intenta de nuevo.');
    }
  }

  function handleCerrarSesion() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión', style: 'destructive',
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

      <ScrollView contentContainerStyle={styles.cuerpo}>
        {/* Foto de perfil */}
        <View style={styles.avatarCont}>
          <SelectorFoto
            valor={fotoUri}
            onFotoSeleccionada={handleFotoSeleccionada}
            size={100}
          />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz:  { flex: 1, backgroundColor: '#F0F2F5' },

  cabecera: { backgroundColor: '#2E4057', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  cabeceraTitulo: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  cuerpo: { padding: 20, paddingBottom: 40 },

  // Avatar
  avatarCont: { alignItems: 'center', marginTop: 24, marginBottom: 32 },
  nombre:     { fontSize: 20, fontWeight: '700', color: '#1F2937', marginTop: 14 },
  correo:     { fontSize: 14, color: '#6B7280', marginTop: 4 },

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
