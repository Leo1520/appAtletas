import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { Atleta } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListaAtletas'>;

const repo = new AtletaRepository();

export default function ListaAtletasScreen({ navigation }: Props) {
  const [atletas, setAtletas]     = useState<Atleta[]>([]);
  const [busqueda, setBusqueda]   = useState('');
  const [cargando, setCargando]   = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('PerfilAtleta', {})} style={styles.botonAgregar}>
          <Text style={styles.botonAgregarTexto}>＋</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Recarga la lista cada vez que la pantalla recibe el foco (ej: al volver desde PerfilAtleta)
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
      const lista = await repo.listarActivos();
      setAtletas(lista);
    } finally {
      setCargando(false);
    }
  }

  function renderItem({ item }: { item: Atleta }) {
    return (
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() => navigation.navigate('PerfilAtleta', { atletaId: item.id })}
      >
        <Text style={styles.nombre}>{item.apellido}, {item.nombre}</Text>
        <Text style={styles.detalle}>{item.categoria} · {item.disciplina}</Text>
        {item.grupo ? <Text style={styles.grupo}>Grupo: {item.grupo}</Text> : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.contenedor}>
      <TextInput
        style={styles.buscador}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar por nombre o apellido…"
        placeholderTextColor="#999"
        clearButtonMode="while-editing"
      />

      {cargando ? (
        <ActivityIndicator style={styles.carga} color="#2E4057" />
      ) : (
        <FlatList
          data={atletas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={atletas.length === 0 ? styles.listaVacia : styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>
              {busqueda.trim()
                ? 'Sin resultados para esa búsqueda.'
                : 'No hay atletas registrados aún.\nAgrega el primero con el botón +'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F5F5' },
  buscador: {
    margin: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  lista: { paddingHorizontal: 16, paddingBottom: 24 },
  listaVacia: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  tarjeta: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  nombre: { fontSize: 16, fontWeight: '600', color: '#2E4057' },
  detalle: { fontSize: 13, color: '#666', marginTop: 3 },
  grupo: { fontSize: 12, color: '#888', marginTop: 2 },
  vacio: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  carga: { marginTop: 40 },
  botonAgregar: { marginRight: 4, padding: 4 },
  botonAgregarTexto: { fontSize: 22, color: '#FFF', fontWeight: '300' },
});
