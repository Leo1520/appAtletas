import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { Atleta } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListaAtletas'>;

const repo = new AtletaRepository();

// ── Helpers ──────────────────────────────────────────────────────────────────
const COLORES_AVATAR = ['#2E4057', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#0EA5E9'];

function colorAvatar(nombre: string): string {
  const suma = nombre.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORES_AVATAR[suma % COLORES_AVATAR.length];
}

function iniciales(atleta: Atleta): string {
  return (atleta.nombre[0] ?? '').toUpperCase() + (atleta.apellido[0] ?? '').toUpperCase();
}

// ── Tarjeta ───────────────────────────────────────────────────────────────────
function TarjetaAtleta({
  atleta,
  onEditar,
  onHistorial,
}: {
  atleta: Atleta;
  onEditar: () => void;
  onHistorial: () => void;
}) {
  const bgAvatar = colorAvatar(atleta.apellido + atleta.nombre);
  const esJuvenil = atleta.categoria === 'Juvenil';

  return (
    <TouchableOpacity style={styles.tarjeta} onPress={onEditar} activeOpacity={0.75}>
      {/* Botón historial en esquina */}
      <TouchableOpacity style={styles.historialBtn} onPress={onHistorial} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Feather name="bar-chart-2" size={15} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: bgAvatar }]}>
        <Text style={styles.avatarLetra}>{iniciales(atleta)}</Text>
      </View>

      {/* Nombre */}
      <Text style={styles.nombre} numberOfLines={2}>
        {atleta.apellido},{'\n'}{atleta.nombre}
      </Text>

      {/* Badges */}
      <View style={styles.badges}>
        <View style={[styles.badge, esJuvenil ? styles.badgeJuvenil : styles.badgeInfantil]}>
          <Text style={[styles.badgeTexto, esJuvenil ? styles.badgeTextoJuvenil : styles.badgeTextoInfantil]}>
            {atleta.categoria}
          </Text>
        </View>
        <View style={styles.badgeDisciplina}>
          <Text style={styles.badgeDisciplinaTexto} numberOfLines={1}>{atleta.disciplina}</Text>
        </View>
      </View>

      {/* Grupo */}
      {atleta.grupo ? (
        <Text style={styles.grupo} numberOfLines={1}>
          <Feather name="users" size={11} color="#9CA3AF" /> {atleta.grupo}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function ListaAtletasScreen({ navigation }: Props) {
  const [atletas, setAtletas]   = useState<Atleta[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('PerfilAtleta', {})}
          style={{ marginRight: 4 }}
        >
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Añadir</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!busqueda.trim()) cargarActivos();
    }, [busqueda]),
  );

  useEffect(() => {
    if (busqueda.trim()) {
      repo.buscarPorNombre(busqueda).then(setAtletas);
    } else {
      cargarActivos();
    }
  }, [busqueda]);

  async function cargarActivos() {
    setCargando(true);
    try {
      setAtletas(await repo.listarActivos());
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      {/* Buscador */}
      <View style={styles.buscadorCont}>
        <Feather name="search" size={15} color="#9CA3AF" />
        <TextInput
          style={styles.buscador}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre o apellido…"
          placeholderTextColor="#9CA3AF"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Feather name="x" size={15} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {cargando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2E4057" />
      ) : (
        <FlatList
          data={atletas}
          keyExtractor={(a) => a.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columna}
          contentContainerStyle={atletas.length === 0 ? styles.vacioCont : styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vacioInner}>
              <Feather name="users" size={44} color="#D1D5DB" />
              <Text style={styles.vacioTexto}>
                {busqueda.trim()
                  ? 'Sin resultados para esa búsqueda.'
                  : 'No hay atletas registrados.\nToca Añadir para crear el primero.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TarjetaAtleta
              atleta={item}
              onEditar={() => navigation.navigate('PerfilAtleta', { atletaId: item.id })}
              onHistorial={() => navigation.navigate('HistorialMarcas', { atletaId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F0F2F5' },

  buscadorCont: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFF', borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  buscador: { flex: 1, fontSize: 14, color: '#333' },

  lista:    { padding: 8, paddingBottom: 24 },
  columna:  { justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 0 },
  vacioCont:{ flex: 1 },
  vacioInner:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  vacioTexto:{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },

  // Tarjeta
  tarjeta: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    margin: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },

  // Historial icon (esquina superior derecha)
  historialBtn: {
    position: 'absolute', top: 12, right: 12,
    padding: 2,
  },

  // Avatar
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLetra: { fontSize: 18, fontWeight: '700', color: '#FFF' },

  // Nombre
  nombre: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 8, lineHeight: 19 },

  // Badges
  badges:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  badge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeJuvenil:       { backgroundColor: '#D1FAE5' },
  badgeTextoJuvenil:  { fontSize: 11, fontWeight: '600', color: '#065F46' },
  badgeInfantil:      { backgroundColor: '#DBEAFE' },
  badgeTextoInfantil: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },
  badgeDisciplina:    { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeDisciplinaTexto: { fontSize: 11, color: '#475569', fontWeight: '500' },

  // Grupo
  grupo: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
