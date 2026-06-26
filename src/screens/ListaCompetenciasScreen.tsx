import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CompetenciaRepository } from '../repositories/CompetenciaRepository';
import { Competencia } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListaCompetencias'>;

const repo = new CompetenciaRepository();

function formatFecha(str: string): string {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function ListaCompetenciasScreen({ navigation }: Props) {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);

  useFocusEffect(
    useCallback(() => {
      repo.listar().then(setCompetencias);
    }, []),
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CrearCompetencia', {})}
          style={{ marginRight: 4 }}
        >
          <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.contenedor}>
      <FlatList
        data={competencias}
        keyExtractor={(c) => c.id.toString()}
        contentContainerStyle={
          competencias.length === 0 ? styles.listaVaciaCont : styles.lista
        }
        ListEmptyComponent={
          <View style={styles.vacioCont}>
            <Feather name="award" size={48} color="#CCC" />
            <Text style={styles.vacioTexto}>Sin competencias registradas.</Text>
            <Text style={styles.vacioSub}>Toca el + para agregar una.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tarjeta}
            onPress={() => navigation.navigate('DetalleCompetencia', { competenciaId: item.id })}
          >
            <View style={styles.tarjetaIzq}>
              <Text style={styles.tarjetaNombre}>{item.nombre}</Text>
              <View style={styles.tarjetaMeta}>
                <Feather name="calendar" size={12} color="#888" />
                <Text style={styles.tarjetaMetaTexto}>{formatFecha(item.fecha)}</Text>
                <Feather name="map-pin" size={12} color="#888" style={{ marginLeft: 10 }} />
                <Text style={styles.tarjetaMetaTexto}>{item.lugar}</Text>
              </View>
              {item.descripcion ? (
                <Text style={styles.tarjetaDesc} numberOfLines={1}>{item.descripcion}</Text>
              ) : null}
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F5F5F5' },
  lista:          { padding: 16, paddingBottom: 24 },
  listaVaciaCont: { flex: 1 },

  vacioCont: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  vacioTexto: { fontSize: 16, color: '#AAA', marginTop: 16 },
  vacioSub:   { fontSize: 13, color: '#CCC', marginTop: 4 },

  tarjeta: {
    backgroundColor: '#FFF', borderRadius: 10, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  tarjetaIzq:    { flex: 1 },
  tarjetaNombre: { fontSize: 16, fontWeight: '600', color: '#2E4057', marginBottom: 6 },
  tarjetaMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tarjetaMetaTexto: { fontSize: 12, color: '#666' },
  tarjetaDesc:   { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
});
