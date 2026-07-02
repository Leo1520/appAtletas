import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Modal, ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  iniciarSesion,
  obtenerPreguntaSeguridad,
  verificarRespuestaSeguridad,
  cambiarContrasena,
} from '../services/AuthService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Paso = 1 | 2 | 3;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // ── Login ────────────────────────────────────────────────────────────────────
  const [correo, setCorreo]         = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargando, setCargando]     = useState(false);

  async function handleIngresar() {
    setErrorLogin('');
    if (!correo.trim() || !contrasena) {
      setErrorLogin('Completa todos los campos.');
      return;
    }
    setCargando(true);
    try {
      const ok = await iniciarSesion(correo, contrasena);
      if (ok) {
        navigation.replace('Principal');
      } else {
        setErrorLogin('Correo o contraseña incorrectos.');
      }
    } catch {
      setErrorLogin('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  // ── Recuperación de contraseña (Modal 3 pasos) ───────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [paso, setPaso]                 = useState<Paso>(1);
  const [correoRecup, setCorreoRecup]   = useState('');
  const [pregunta, setPregunta]         = useState('');
  const [respuesta, setRespuesta]       = useState('');
  const [nuevaPass, setNuevaPass]       = useState('');
  const [confirmarPass, setConfirmarPass] = useState('');
  const [errorRecup, setErrorRecup]     = useState('');
  const [procesando, setProcesando]     = useState(false);

  function abrirRecuperacion() {
    setPaso(1);
    setCorreoRecup('');
    setPregunta('');
    setRespuesta('');
    setNuevaPass('');
    setConfirmarPass('');
    setErrorRecup('');
    setModalVisible(true);
  }

  async function handlePaso1() {
    setErrorRecup('');
    if (!correoRecup.trim()) { setErrorRecup('Ingresa tu correo.'); return; }
    setProcesando(true);
    try {
      const preg = await obtenerPreguntaSeguridad(correoRecup);
      if (!preg) {
        setErrorRecup('No se encontró una cuenta con ese correo.');
        return;
      }
      setPregunta(preg);
      setPaso(2);
    } finally {
      setProcesando(false);
    }
  }

  async function handlePaso2() {
    setErrorRecup('');
    if (!respuesta.trim()) { setErrorRecup('Ingresa tu respuesta.'); return; }
    setProcesando(true);
    try {
      const ok = await verificarRespuestaSeguridad(correoRecup, respuesta);
      if (!ok) {
        setErrorRecup('Respuesta incorrecta.');
        return;
      }
      setPaso(3);
    } finally {
      setProcesando(false);
    }
  }

  async function handlePaso3() {
    setErrorRecup('');
    if (!nuevaPass)                         { setErrorRecup('Ingresa la nueva contraseña.'); return; }
    if (nuevaPass.length < 6)              { setErrorRecup('Mínimo 6 caracteres.'); return; }
    if (nuevaPass !== confirmarPass)        { setErrorRecup('Las contraseñas no coinciden.'); return; }
    setProcesando(true);
    try {
      await cambiarContrasena(correoRecup, nuevaPass);
      setModalVisible(false);
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.');
    } catch {
      setErrorRecup('No se pudo actualizar. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marca */}
        <View style={styles.marca}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.club}>Club Deportivo</Text>
          <Text style={styles.clubNombre}>Linces</Text>
        </View>

        {/* Formulario */}
        <View style={styles.tarjeta}>
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

          {errorLogin ? <Text style={styles.error}>{errorLogin}</Text> : null}

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDes]}
            onPress={handleIngresar}
            disabled={cargando}
          >
            <Text style={styles.botonTexto}>
              {cargando ? 'Verificando…' : 'Ingresar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRecuperar} onPress={abrirRecuperacion}>
            <Feather name="lock" size={13} color="#6B7280" />
            <Text style={styles.linkRecuperarTexto}>  ¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCrear} onPress={() => navigation.navigate('Registro')}>
            <Text style={styles.linkCrearTexto}>¿Primera vez? </Text>
            <Text style={[styles.linkCrearTexto, { fontWeight: '700', color: '#2E4057' }]}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modal recuperación ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHoja}>
            {/* Cabecera modal */}
            <View style={styles.modalCabecera}>
              <Text style={styles.modalTitulo}>
                {paso === 1 ? 'Recuperar contraseña' :
                 paso === 2 ? 'Pregunta de seguridad' :
                              'Nueva contraseña'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Indicador de paso */}
            <View style={styles.pasosCont}>
              {([1, 2, 3] as Paso[]).map((p) => (
                <View key={p} style={[styles.pasoPunto, paso >= p && styles.pasoPuntoActivo]} />
              ))}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={styles.modalCuerpo}>

              {/* Paso 1: correo */}
              {paso === 1 && (
                <View>
                  <Text style={styles.modalDesc}>
                    Ingresa el correo con el que registraste tu cuenta.
                  </Text>
                  <Text style={styles.etiqueta}>Correo electrónico</Text>
                  <TextInput
                    style={styles.input}
                    value={correoRecup}
                    onChangeText={setCorreoRecup}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="entrenador@ejemplo.com"
                    placeholderTextColor="#999"
                    autoFocus
                  />
                </View>
              )}

              {/* Paso 2: pregunta de seguridad */}
              {paso === 2 && (
                <View>
                  <View style={styles.preguntaCard}>
                    <Feather name="help-circle" size={16} color="#2E4057" />
                    <Text style={styles.preguntaTexto}>  {pregunta}</Text>
                  </View>
                  <Text style={styles.etiqueta}>Tu respuesta</Text>
                  <TextInput
                    style={styles.input}
                    value={respuesta}
                    onChangeText={setRespuesta}
                    placeholder="Escribe tu respuesta…"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
              )}

              {/* Paso 3: nueva contraseña */}
              {paso === 3 && (
                <View>
                  <Text style={styles.modalDesc}>
                    Elige una nueva contraseña de al menos 6 caracteres.
                  </Text>
                  <Text style={styles.etiqueta}>Nueva contraseña</Text>
                  <TextInput
                    style={styles.input}
                    value={nuevaPass}
                    onChangeText={setNuevaPass}
                    secureTextEntry
                    placeholder="••••••"
                    placeholderTextColor="#999"
                    autoFocus
                  />
                  <Text style={styles.etiqueta}>Confirmar contraseña</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmarPass}
                    onChangeText={setConfirmarPass}
                    secureTextEntry
                    placeholder="••••••"
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {errorRecup ? <Text style={styles.error}>{errorRecup}</Text> : null}

              <TouchableOpacity
                style={[styles.boton, styles.botonModal, procesando && styles.botonDes]}
                onPress={paso === 1 ? handlePaso1 : paso === 2 ? handlePaso2 : handlePaso3}
                disabled={procesando}
              >
                <Text style={styles.botonTexto}>
                  {procesando ? 'Verificando…' :
                   paso === 1 ? 'Continuar' :
                   paso === 2 ? 'Verificar respuesta' :
                                'Guardar contraseña'}
                </Text>
              </TouchableOpacity>

              {paso > 1 && (
                <TouchableOpacity
                  style={styles.linkVolver}
                  onPress={() => { setPaso((p) => (p - 1) as Paso); setErrorRecup(''); }}
                >
                  <Text style={styles.linkVolverTexto}>← Volver</Text>
                </TouchableOpacity>
              )}

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: '#2E4057' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },

  // Marca superior
  marca: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  logo:  { width: 110, height: 110, marginBottom: 12 },
  club:       { fontSize: 13, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.5 },
  clubNombre: { fontSize: 28, fontWeight: '800', color: '#FFF', marginTop: 2 },

  // Tarjeta del formulario
  tarjeta: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  titulo:   { fontSize: 20, fontWeight: '700', color: '#2E4057', marginBottom: 20 },
  etiqueta: { fontSize: 13, color: '#555', marginTop: 14, marginBottom: 4 },
  input: {
    backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: '#333',
  },
  error:    { color: '#C0392B', fontSize: 13, marginTop: 10 },
  boton: {
    backgroundColor: '#2E4057', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  botonDes:   { opacity: 0.55 },
  botonTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  linkRecuperar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 16, paddingVertical: 4,
  },
  linkRecuperarTexto: { color: '#6B7280', fontSize: 13 },

  linkCrear: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 12, paddingVertical: 4,
  },
  linkCrearTexto: { color: '#6B7280', fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalHoja: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalCabecera: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: '#2E4057' },
  modalCuerpo: { padding: 20 },
  modalDesc:   { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 4 },

  pasosCont: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  pasoPunto: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  pasoPuntoActivo: { backgroundColor: '#2E4057' },

  preguntaCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F0F4F8', borderRadius: 8, padding: 12, marginBottom: 4,
  },
  preguntaTexto: { flex: 1, fontSize: 14, color: '#2E4057', fontWeight: '500' },

  botonModal:     { marginTop: 20 },
  linkVolver:     { alignItems: 'center', paddingVertical: 12 },
  linkVolverTexto:{ color: '#888', fontSize: 14 },
});
