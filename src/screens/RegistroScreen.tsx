import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { registrarEntrenador } from '../services/AuthService';

type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;

export default function RegistroScreen({ navigation }: Props) {
  const [nombre, setNombre]           = useState('');
  const [correo, setCorreo]           = useState('');
  const [contrasena, setContrasena]   = useState('');
  const [confirmar, setConfirmar]     = useState('');
  const [pregunta, setPregunta]       = useState('');
  const [respuesta, setRespuesta]     = useState('');
  const [guardando, setGuardando]     = useState(false);

  async function handleRegistrar() {
    if (nombre.trim().length < 2) {
      Alert.alert('Campo requerido', 'Ingresa tu nombre completo (mínimo 2 caracteres).');
      return;
    }
    if (!correo.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu correo electrónico.');
      return;
    }
    if (contrasena.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (contrasena !== confirmar) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (!pregunta.trim() || !respuesta.trim()) {
      Alert.alert('Campo requerido', 'Completa la pregunta y respuesta de seguridad.');
      return;
    }

    setGuardando(true);
    try {
      await registrarEntrenador(correo, contrasena, pregunta, respuesta, nombre);
      navigation.replace('Principal');
    } catch {
      Alert.alert('Error', 'No se pudo crear la cuenta. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crear cuenta</Text>

        <Text style={styles.etiqueta}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre completo"
          placeholderTextColor="#999"
          autoCapitalize="words"
        />

        <Text style={styles.etiqueta}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="entrenador@ejemplo.com"
          placeholderTextColor="#999"
        />

        <Text style={styles.etiqueta}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#999"
        />

        <Text style={styles.etiqueta}>Confirmar contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
          placeholder="Repite la contraseña"
          placeholderTextColor="#999"
        />

        <Text style={styles.separador}>Recuperación de contraseña</Text>

        <Text style={styles.etiqueta}>Pregunta de seguridad</Text>
        <TextInput
          style={styles.input}
          value={pregunta}
          onChangeText={setPregunta}
          placeholder="Ej: ¿Nombre de tu primera mascota?"
          placeholderTextColor="#999"
        />

        <Text style={styles.etiqueta}>Respuesta</Text>
        <TextInput
          style={styles.input}
          value={respuesta}
          onChangeText={setRespuesta}
          autoCapitalize="none"
          placeholder="Tu respuesta secreta"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          onPress={handleRegistrar}
          disabled={guardando}
        >
          <Text style={styles.botonTexto}>{guardando ? 'Guardando…' : 'Crear cuenta'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  contenedor: { padding: 24, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: '700', color: '#2E4057', marginBottom: 24 },
  etiqueta: { fontSize: 14, color: '#555', marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  separador: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E4057',
    marginTop: 28,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    paddingTop: 16,
  },
  boton: {
    backgroundColor: '#2E4057',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
