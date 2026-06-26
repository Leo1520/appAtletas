import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SesionRepository } from '../repositories/SesionRepository';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { Sesion } from '../types';
import SelectorConInput from '../components/SelectorConInput';
import SelectorFechaHora from '../components/SelectorFechaHora';

type Props = NativeStackScreenProps<RootStackParamList, 'CrearSesion'>;

const sesionRepo  = new SesionRepository();
const atletaRepo  = new AtletaRepository();

const DISCIPLINAS_SEMILLA = [
  '100m', '200m', '400m', '800m', '1500m', '5000m',
  'Vallas', 'Salto largo', 'Salto alto',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Jabalina',
];

const HOY = new Date();

export default function CrearSesionScreen({ route, navigation }: Props) {
  const sesionId   = route.params?.sesionId;
  const modoEditar = sesionId !== undefined;

  const [fecha, setFecha]           = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar]           = useState('');
  const [grupo, setGrupo]           = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [estado, setEstado]         = useState('activa');
  const [guardando, setGuardando]   = useState(false);

  const [opcionesDisciplina, setOpcionesDisciplina] = useState<string[]>(DISCIPLINAS_SEMILLA);
  const [opcionesGrupo, setOpcionesGrupo]           = useState<string[]>([]);

  // Modal de cancelación
  const [modalCancelar, setModalCancelar]   = useState(false);
  const [motivoCancelacion, setMotivo]      = useState('');

  useEffect(() => {
    navigation.setOptions({ title: modoEditar ? 'Editar sesión' : 'Nueva sesión' });
    cargarOpciones();
    if (modoEditar) cargarSesion();
  }, []);

  async function cargarOpciones() {
    const [disciplinasDB, gruposDB] = await Promise.all([
      atletaRepo.listarDisciplinas(),
      atletaRepo.listarGrupos(),
    ]);
    setOpcionesDisciplina([
      ...DISCIPLINAS_SEMILLA,
      ...disciplinasDB.filter((d) => !DISCIPLINAS_SEMILLA.includes(d)),
    ]);
    setOpcionesGrupo(gruposDB);
  }

  async function cargarSesion() {
    const sesion = await sesionRepo.obtenerPorId(sesionId!);
    if (!sesion) return;
    setFecha(sesion.fecha);
    setHoraInicio(sesion.horaInicio);
    setHoraFin(sesion.horaFin ?? '');
    setDescripcion(sesion.descripcion);
    setLugar(sesion.lugar ?? '');
    setGrupo(sesion.grupo ?? '');
    setDisciplina(sesion.disciplina);
    setEstado(sesion.estado);
  }

  function validar(): boolean {
    if (!fecha)             { Alert.alert('Campo requerido', 'Selecciona la fecha.'); return false; }
    if (!horaInicio)        { Alert.alert('Campo requerido', 'Selecciona la hora de inicio.'); return false; }
    if (!disciplina.trim()) { Alert.alert('Campo requerido', 'Selecciona la disciplina.'); return false; }
    if (!descripcion.trim()){ Alert.alert('Campo requerido', 'Ingresa una descripción.'); return false; }
    return true;
  }

  async function handleGuardar() {
    if (!validar()) return;
    setGuardando(true);

    const datos: Omit<Sesion, 'id'> = {
      fecha,
      horaInicio,
      horaFin:    horaFin || undefined,
      descripcion: descripcion.trim(),
      disciplina:  disciplina.trim(),
      lugar:       lugar.trim() || undefined,
      grupo:       grupo.trim() || undefined,
      estado,
    };

    try {
      if (modoEditar) {
        await sesionRepo.actualizar({ id: sesionId!, ...datos });
        Alert.alert('Listo', 'Sesión actualizada.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await sesionRepo.crear(datos);
        Alert.alert('Listo', 'Sesión creada.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar la sesión.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleCancelarSesion() {
    if (!motivoCancelacion.trim()) {
      Alert.alert('Requerido', 'Ingresa el motivo de cancelación.');
      return;
    }
    try {
      await sesionRepo.cancelar(sesionId!, motivoCancelacion.trim());
      setModalCancelar(false);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo cancelar la sesión.');
    }
  }

  const yaEstaCancel = estado === 'cancelada';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">

        {yaEstaCancel && (
          <View style={styles.bannerCancelada}>
            <Feather name="alert-circle" size={16} color="#C0392B" />
            <Text style={styles.bannerTexto}>  Esta sesión está cancelada</Text>
          </View>
        )}

        <Text style={styles.etiqueta}>Fecha</Text>
        <SelectorFechaHora
          mode="date" valor={fecha} onSeleccionar={setFecha}
          placeholder="Seleccionar fecha" maximumDate={undefined}
        />

        <Text style={styles.etiqueta}>Hora de inicio</Text>
        <SelectorFechaHora
          mode="time" valor={horaInicio} onSeleccionar={setHoraInicio}
          placeholder="Seleccionar hora"
        />

        <Text style={styles.etiqueta}>Hora de fin <Text style={styles.opcional}>(opcional)</Text></Text>
        <SelectorFechaHora
          mode="time" valor={horaFin} onSeleccionar={setHoraFin}
          placeholder="Seleccionar hora"
        />

        <Text style={styles.etiqueta}>Disciplina</Text>
        <SelectorConInput
          label="Disciplina" valor={disciplina} opciones={opcionesDisciplina}
          onSeleccionar={setDisciplina} placeholder="Seleccionar disciplina…"
          labelNuevo="+ Agregar nueva disciplina"
        />

        <Text style={styles.etiqueta}>Grupo <Text style={styles.opcional}>(opcional)</Text></Text>
        <SelectorConInput
          label="Grupo" valor={grupo} opciones={opcionesGrupo}
          onSeleccionar={setGrupo} placeholder="Seleccionar grupo… (opcional)"
          labelNuevo="+ Agregar nuevo grupo"
        />

        <Text style={styles.etiqueta}>Lugar <Text style={styles.opcional}>(opcional)</Text></Text>
        <TextInput
          style={styles.input} value={lugar} onChangeText={setLugar}
          placeholder="Ej: Estadio Municipal, Cancha 2…" placeholderTextColor="#999"
        />

        <Text style={styles.etiqueta}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.inputMultilinea]}
          value={descripcion} onChangeText={setDescripcion}
          placeholder="Ej: Trabajo de velocidad y técnica de salida…"
          placeholderTextColor="#999" multiline numberOfLines={3}
        />

        {!yaEstaCancel && (
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
            onPress={handleGuardar} disabled={guardando}
          >
            <Text style={styles.botonGuardarTexto}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        )}

        {modoEditar && !yaEstaCancel && (
          <TouchableOpacity
            style={styles.botonAsistencia}
            onPress={() => navigation.navigate('RegistroAsistencia', { sesionId: sesionId! })}
          >
            <Feather name="users" size={16} color="#2E4057" />
            <Text style={styles.botonAsistenciaTexto}>  Registrar asistencia</Text>
          </TouchableOpacity>
        )}

        {modoEditar && !yaEstaCancel && (
          <TouchableOpacity style={styles.botonCancelar} onPress={() => setModalCancelar(true)}>
            <Text style={styles.botonCancelarTexto}>Cancelar sesión</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal para motivo de cancelación */}
      <Modal visible={modalCancelar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHoja}>
              <Text style={styles.modalTitulo}>Motivo de cancelación</Text>
              <TextInput
                style={[styles.input, styles.inputMultilinea]}
                value={motivoCancelacion} onChangeText={setMotivo}
                placeholder="Describe el motivo…" placeholderTextColor="#999"
                multiline numberOfLines={3} autoFocus
              />
              <TouchableOpacity style={styles.modalBotonConfirmar} onPress={handleCancelarSesion}>
                <Text style={styles.botonGuardarTexto}>Confirmar cancelación</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBotonVolver} onPress={() => { setModalCancelar(false); setMotivo(''); }}>
                <Text style={styles.botonCancelarTexto}>Volver</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  contenedor: { padding: 24, paddingBottom: 48 },
  etiqueta: { fontSize: 14, color: '#555', marginTop: 16, marginBottom: 4 },
  opcional: { fontSize: 12, color: '#999' },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#333',
  },
  inputMultilinea: { minHeight: 80, textAlignVertical: 'top' },
  bannerCancelada: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  bannerTexto: { color: '#C0392B', fontSize: 14, fontWeight: '500' },
  botonGuardar: {
    backgroundColor: '#2E4057', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 32,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonGuardarTexto: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  botonAsistencia: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#2E4057', borderRadius: 8,
    paddingVertical: 12, marginTop: 12,
  },
  botonAsistenciaTexto: { color: '#2E4057', fontSize: 15, fontWeight: '600' },
  botonCancelar: {
    borderWidth: 1, borderColor: '#C0392B', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', marginTop: 12,
  },
  botonCancelarTexto: { color: '#C0392B', fontSize: 15, fontWeight: '500' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalHoja: {
    backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, paddingBottom: 36,
  },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: '#2E4057', marginBottom: 16 },
  modalBotonConfirmar: {
    backgroundColor: '#C0392B', borderRadius: 8,
    paddingVertical: 13, alignItems: 'center', marginTop: 16,
  },
  modalBotonVolver: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
});
