import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { iniciarSesion } from '../services/AuthService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [correo, setCorreo]         = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError]           = useState('');
  const [cargando, setCargando]     = useState(false);

  async function handleIngresar() {
    setError('');
    if (!correo.trim() || !contrasena) {
      setError('Completa todos los campos.');
      return;
    }

    setCargando(true);
    try {
      const ok = await iniciarSesion(correo, contrasena);
      if (ok) {
        navigation.replace('Principal');
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Iniciar sesión</Text>

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
          placeholder="••••••"
          placeholderTextColor="#999"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          onPress={handleIngresar}
          disabled={cargando}
        >
          <Text style={styles.botonTexto}>{cargando ? 'Verificando…' : 'Ingresar'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  contenedor: { flex: 1, padding: 24, justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#2E4057', marginBottom: 32 },
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
  error: { color: '#C0392B', fontSize: 13, marginTop: 12 },
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
