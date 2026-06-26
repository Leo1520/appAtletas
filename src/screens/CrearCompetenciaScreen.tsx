import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CompetenciaRepository } from '../repositories/CompetenciaRepository';
import SelectorFechaHora, { dateToFecha } from '../components/SelectorFechaHora';

type Props = NativeStackScreenProps<RootStackParamList, 'CrearCompetencia'>;

const repo = new CompetenciaRepository();

export default function CrearCompetenciaScreen({ navigation }: Props) {
  const [nombre, setNombre]       = useState('');
  const [fecha, setFecha]         = useState(dateToFecha(new Date()));
  const [lugar, setLugar]         = useState('');
  const [descripcion, setDesc]    = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!nombre.trim()) { Alert.alert('Requerido', 'Ingresa el nombre de la competencia.'); return; }
    if (!lugar.trim())  { Alert.alert('Requerido', 'Ingresa el lugar.'); return; }

    setGuardando(true);
    try {
      const competencia = await repo.crear({
        nombre:      nombre.trim(),
        fecha,
        lugar:       lugar.trim(),
        descripcion: descripcion.trim() || undefined,
      });
      // Reemplaza la pantalla de creación por el detalle para que "Atrás" vuelva a la lista
      navigation.replace('DetalleCompetencia', { competenciaId: competencia.id });
    } catch {
      Alert.alert('Error', 'No se pudo guardar la competencia.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input} value={nombre} onChangeText={setNombre}
          placeholder="Ej. Campeonato Nacional Sub-18"
          placeholderTextColor="#999"
        />

        <Text style={styles.etiqueta}>Fecha</Text>
        <SelectorFechaHora
          mode="date" valor={fecha} onSeleccionar={setFecha}
          placeholder="Seleccionar fecha"
        />

        <Text style={styles.etiqueta}>Lugar</Text>
        <TextInput
          style={styles.input} value={lugar} onChangeText={setLugar}
          placeholder="Ej. Estadio Nacional, San José"
          placeholderTextColor="#999"
        />

        <Text style={styles.etiqueta}>
          Descripción <Text style={styles.opcional}>(opcional)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={descripcion} onChangeText={setDesc}
          placeholder="Notas adicionales…"
          placeholderTextColor="#999"
          multiline numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.boton, guardando && styles.botonDes]}
          onPress={handleGuardar} disabled={guardando}
        >
          <Text style={styles.botonTexto}>{guardando ? 'Guardando…' : 'Crear competencia'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  contenedor: { padding: 24, paddingBottom: 48 },
  etiqueta:   { fontSize: 14, color: '#555', marginTop: 16, marginBottom: 4 },
  opcional:   { fontSize: 12, color: '#999' },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#333',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  boton: {
    backgroundColor: '#2E4057', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 32,
  },
  botonDes:   { opacity: 0.6 },
  botonTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
