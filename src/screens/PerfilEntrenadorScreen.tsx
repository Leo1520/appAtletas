import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ScrollView,
} from 'react-native';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { EntrenadorRepository } from '../repositories/EntrenadorRepository';
import SelectorFoto from '../components/SelectorFoto';

const repo = new EntrenadorRepository();

export default function PerfilEntrenadorScreen() {
  const navigation = useNavigation();
  const [entrenadorId, setEntrenadorId] = useState<number | null>(null);
  const [correo,   setCorreo]   = useState('');
  const [nombre,   setNombre]   = useState('');
  const [fotoUri,  setFotoUri]  = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarEntrenador();
  }, []);

  async function cargarEntrenador() {
    try {
      const db = await import('../database/database').then((m) => m.getDatabase());
      const row = await db.getFirstAsync<{
        id: number; correo: string; nombre: string | null; foto_uri: string | null;
      }>('SELECT id, correo, nombre, foto_uri FROM entrenador LIMIT 1');
      if (row) {
        setEntrenadorId(row.id);
        setCorreo(row.correo);
        setNombre(row.nombre ?? '');
        setFotoUri(row.foto_uri ?? undefined);
      }
    } catch {
      // no crítico
    }
  }

  async function handleFotoSeleccionada(uri: string) {
    if (entrenadorId === null) return;
    const nuevoUri = uri === '' ? undefined : uri;
    setFotoUri(nuevoUri);
    try {
      await repo.actualizarFoto(entrenadorId, nuevoUri ?? null);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la foto. Intenta de nuevo.');
    }
  }

  async function handleGuardarNombre() {
    if (entrenadorId === null) return;
    if (nombre.trim().length < 2) {
      Alert.alert('Campo requerido', 'El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setGuardando(true);
    try {
      await repo.actualizarNombre(entrenadorId, nombre.trim());
      Alert.alert('Listo', 'Nombre actualizado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el nombre. Intenta de nuevo.');
    } finally {
      setGuardando(false);
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

      <View style={styles.contenido}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.cuerpo}>
          {/* Foto */}
          <View style={styles.avatarCont}>
            <SelectorFoto
              valor={fotoUri}
              onFotoSeleccionada={handleFotoSeleccionada}
              size={100}
            />
            <Text style={styles.correoLabel}>{correo}</Text>
          </View>

          {/* Nombre editable */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Nombre</Text>
            <View style={styles.filaInput}>
              <TextInput
                style={styles.inputNombre}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre completo"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.btnGuardar, guardando && { opacity: 0.6 }]}
                onPress={handleGuardarNombre}
                disabled={guardando}
              >
                <Feather name="check" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.seccion}>
            <View style={[styles.filaInfo, { borderBottomWidth: 0 }]}>
              <Feather name="shield" size={18} color="#2E4057" />
              <View style={styles.filaInfoTexto}>
                <Text style={styles.filaInfoLabel}>Rol</Text>
                <Text style={styles.filaInfoValor}>Entrenador principal</Text>
              </View>
            </View>
          </View>

          {/* Cerrar sesión */}
          <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion} activeOpacity={0.8}>
            <Feather name="log-out" size={18} color="#C0392B" />
            <Text style={styles.botonSalirTexto}>  Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Versión — pegada al fondo */}
        <View style={styles.versionCont}>
          <Text style={styles.versionClub}>Club Deportivo Linces</Text>
          <Text style={styles.versionNumero}>Versión {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz:      { flex: 1, backgroundColor: '#F0F2F5' },
  contenido: { flex: 1 },
  scroll:    { flex: 1 },

  cabecera: { backgroundColor: '#2E4057', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  cabeceraTitulo: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  cuerpo: { padding: 20, paddingBottom: 40 },

  avatarCont: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  correoLabel: { fontSize: 13, color: '#6B7280', marginTop: 12 },

  seccion: {
    backgroundColor: '#FFF', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2, marginBottom: 16, overflow: 'hidden',
  },
  seccionTitulo: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  filaInput: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 10,
  },
  inputNombre: {
    flex: 1, fontSize: 15, color: '#1F2937',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: '#F9FAFB',
  },
  btnGuardar: {
    backgroundColor: '#2E4057', borderRadius: 8,
    padding: 10, alignItems: 'center', justifyContent: 'center',
  },

  filaInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  filaInfoTexto: { flex: 1 },
  filaInfoLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  filaInfoValor: { fontSize: 15, color: '#1F2937', fontWeight: '500', marginTop: 1 },

  botonSalir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 16,
    borderWidth: 1, borderColor: '#FCA5A5',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  botonSalirTexto: { color: '#C0392B', fontSize: 15, fontWeight: '600' },

  versionCont:   { alignItems: 'center', paddingBottom: 16, paddingTop: 12 },
  versionClub:   { fontSize: 11, color: '#9CA3AF' },
  versionNumero: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
