import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AtletaRepository } from '../repositories/AtletaRepository';
import { Atleta } from '../types';
import SelectorConInput from '../components/SelectorConInput';
import SelectorFoto from '../components/SelectorFoto';

const DISCIPLINAS_SEMILLA = [
  '100m', '200m', '400m', '800m', '1500m', '5000m',
  'Vallas', 'Salto largo', 'Salto alto',
  'Lanzamiento de bala', 'Lanzamiento de disco', 'Jabalina',
];

type Props = NativeStackScreenProps<RootStackParamList, 'PerfilAtleta'>;

const repo = new AtletaRepository();
const CATEGORIAS = ['Infantil', 'Juvenil'] as const;
const HOY = new Date();

// 'YYYY-MM-DD' → Date local (evita desfase de zona horaria)
function strToDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date → 'YYYY-MM-DD'
function dateToStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 'YYYY-MM-DD' → 'DD/MM/YYYY' para mostrar al usuario
function formatDisplay(str: string): string {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function PerfilAtletaScreen({ route, navigation }: Props) {
  const atletaId  = route.params?.atletaId;
  const modoEditar = atletaId !== undefined;

  const [nombre, setNombre]         = useState('');
  const [apellido, setApellido]     = useState('');
  const [fechaNacimiento, setFecha] = useState('');        // 'YYYY-MM-DD'
  const [categoria, setCategoria]   = useState('Infantil');
  const [disciplina, setDisciplina] = useState('');
  const [grupo, setGrupo]           = useState('');
  const [fotoUri, setFotoUri]       = useState<string | undefined>(undefined);
  const [guardando, setGuardando]   = useState(false);
  const [avisoEdad, setAvisoEdad]   = useState('');

  // DateTimePicker
  const [mostrarPicker, setMostrarPicker]   = useState(false);
  const [fechaTemporal, setFechaTemporal]   = useState(HOY); // usado en iOS

  // Selectores de disciplina y grupo
  const [opcionesDisciplina, setOpcionesDisciplina] = useState<string[]>(DISCIPLINAS_SEMILLA);
  const [opcionesGrupo, setOpcionesGrupo]           = useState<string[]>([]);

  // ── Cálculo automático de categoría ─────────────────────────────────────────
  function calcularEdad(fecha: string): number | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
    const nac = strToDate(fecha);
    if (isNaN(nac.getTime())) return null;
    let edad = HOY.getFullYear() - nac.getFullYear();
    const cumplioMes =
      HOY.getMonth() > nac.getMonth() ||
      (HOY.getMonth() === nac.getMonth() && HOY.getDate() >= nac.getDate());
    if (!cumplioMes) edad--;
    return edad;
  }

  useEffect(() => {
    const edad = calcularEdad(fechaNacimiento);
    if (edad === null)            { setAvisoEdad(''); return; }
    if (edad >= 8 && edad <= 12)  { setCategoria('Infantil'); setAvisoEdad(''); }
    else if (edad >= 13 && edad <= 17) { setCategoria('Juvenil');  setAvisoEdad(''); }
    else { setAvisoEdad('Edad fuera del rango habitual del club (8-17 años).'); }
  }, [fechaNacimiento]);

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({ title: modoEditar ? 'Editar atleta' : 'Nuevo atleta' });
    cargarOpciones();
    if (modoEditar) cargarAtleta();
  }, []);

  async function cargarOpciones() {
    const [disciplinasDB, gruposDB] = await Promise.all([
      repo.listarDisciplinas(),
      repo.listarGrupos(),
    ]);
    setOpcionesDisciplina([
      ...DISCIPLINAS_SEMILLA,
      ...disciplinasDB.filter((d) => !DISCIPLINAS_SEMILLA.includes(d)),
    ]);
    setOpcionesGrupo(gruposDB);
  }

  async function cargarAtleta() {
    const atleta = await repo.obtenerPorId(atletaId!);
    if (!atleta) return;
    setNombre(atleta.nombre);
    setApellido(atleta.apellido);
    setFecha(atleta.fechaNacimiento);
    setFechaTemporal(strToDate(atleta.fechaNacimiento)); // pre-carga el picker
    setCategoria(atleta.categoria);
    setDisciplina(atleta.disciplina);
    setGrupo(atleta.grupo ?? '');
    setFotoUri(atleta.fotoUri);
  }

  // ── DateTimePicker ───────────────────────────────────────────────────────────
  function abrirPicker() {
    // Si ya hay fecha guardada, el picker abre en esa fecha; si no, en hoy
    setFechaTemporal(fechaNacimiento ? strToDate(fechaNacimiento) : HOY);
    setMostrarPicker(true);
  }

  // Android: el picker es un diálogo nativo que cierra solo
  function handleChangeAndroid(_: DateTimePickerEvent, date?: Date) {
    setMostrarPicker(false);
    if (date) setFecha(dateToStr(date));
  }

  // iOS: el picker es inline dentro de un Modal; se confirma con botón
  function confirmarFechaIOS() {
    setFecha(dateToStr(fechaTemporal));
    setMostrarPicker(false);
  }

  // ── Validación y guardado ────────────────────────────────────────────────────
  function validar(): boolean {
    if (!nombre.trim())     { Alert.alert('Campo requerido', 'Ingresa el nombre.');     return false; }
    if (!apellido.trim())   { Alert.alert('Campo requerido', 'Ingresa el apellido.');   return false; }
    if (!disciplina.trim()) { Alert.alert('Campo requerido', 'Selecciona la disciplina.'); return false; }
    if (!fechaNacimiento)   { Alert.alert('Campo requerido', 'Selecciona la fecha de nacimiento.'); return false; }
    return true;
  }

  async function handleGuardar() {
    if (!validar()) return;
    setGuardando(true);
    const datos: Omit<Atleta, 'id'> = {
      nombre:          nombre.trim(),
      apellido:        apellido.trim(),
      fechaNacimiento,
      categoria,
      disciplina:      disciplina.trim(),
      grupo:           grupo.trim() || undefined,
      fotoUri,
      activo:          true,
    };
    try {
      if (modoEditar) {
        await repo.actualizar({ id: atletaId!, ...datos });
        Alert.alert('Listo', 'Perfil actualizado correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await repo.crear(datos);
        Alert.alert('Listo', 'Perfil creado correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  function handleDesactivar() {
    Alert.alert(
      'Desactivar perfil',
      'El atleta ya no aparecerá en la lista activa, pero conservará todo su historial. ¿Confirmas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar', style: 'destructive',
          onPress: async () => { await repo.desactivar(atletaId!); navigation.goBack(); },
        },
      ],
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">

        {/* Foto de perfil */}
        <SelectorFoto
          valor={fotoUri}
          onFotoSeleccionada={(uri) => setFotoUri(uri === '' ? undefined : uri)}
          size={96}
        />

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre}
          placeholder="Nombre" placeholderTextColor="#999" />

        <Text style={styles.etiqueta}>Apellido</Text>
        <TextInput style={styles.input} value={apellido} onChangeText={setApellido}
          placeholder="Apellido" placeholderTextColor="#999" />

        {/* Fecha de nacimiento — selector visual */}
        <Text style={styles.etiqueta}>Fecha de nacimiento</Text>
        <TouchableOpacity style={styles.botonFecha} onPress={abrirPicker}>
          <Text style={fechaNacimiento ? styles.fechaTexto : styles.fechaPlaceholder}>
            {fechaNacimiento ? formatDisplay(fechaNacimiento) : 'Seleccionar fecha de nacimiento'}
          </Text>
          <Feather name="calendar" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Picker Android: diálogo nativo, aparece al renderizarse */}
        {Platform.OS === 'android' && mostrarPicker && (
          <DateTimePicker
            value={fechaTemporal}
            mode="date"
            display="default"
            maximumDate={HOY}
            onChange={handleChangeAndroid}
          />
        )}

        {/* Picker iOS: spinner dentro de un Modal con botones */}
        {Platform.OS === 'ios' && (
          <Modal visible={mostrarPicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalHoja}>
                <View style={styles.modalBarra}>
                  <TouchableOpacity onPress={() => setMostrarPicker(false)}>
                    <Text style={styles.modalCancelar}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmarFechaIOS}>
                    <Text style={styles.modalConfirmar}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={fechaTemporal}
                  mode="date"
                  display="spinner"
                  maximumDate={HOY}
                  onChange={(_, date) => { if (date) setFechaTemporal(date); }}
                  locale="es-CR"
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Categoría */}
        <Text style={styles.etiqueta}>Categoría</Text>
        {avisoEdad ? <Text style={styles.avisoEdad}>{avisoEdad}</Text> : null}
        <View style={styles.selectorFila}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.selectorBtn, categoria === cat && styles.selectorBtnActivo]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[styles.selectorTexto, categoria === cat && styles.selectorTextoActivo]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        <TouchableOpacity
          style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
          onPress={handleGuardar} disabled={guardando}
        >
          <Text style={styles.botonGuardarTexto}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
        </TouchableOpacity>

        {modoEditar && (
          <TouchableOpacity
            style={styles.botonHistorial}
            onPress={() => navigation.navigate('HistorialMarcas', { atletaId: atletaId! })}
          >
            <Feather name="bar-chart-2" size={16} color="#2E4057" />
            <Text style={styles.botonHistorialTexto}>  Ver historial de marcas</Text>
          </TouchableOpacity>
        )}

        {modoEditar && (
          <TouchableOpacity style={styles.botonDesactivar} onPress={handleDesactivar}>
            <Text style={styles.botonDesactivarTexto}>Desactivar perfil</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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

  // Botón de fecha
  botonFecha: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  fechaTexto:        { fontSize: 15, color: '#333' },
  fechaPlaceholder:  { fontSize: 15, color: '#999' },

  // Modal iOS
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalHoja: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  modalBarra: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  modalCancelar:  { fontSize: 16, color: '#888' },
  modalConfirmar: { fontSize: 16, color: '#2E4057', fontWeight: '600' },

  // Categoría
  avisoEdad: { fontSize: 12, color: '#B07D00', marginBottom: 6 },
  selectorFila: { flexDirection: 'row', gap: 10 },
  selectorBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#CCC', backgroundColor: '#FFF', alignItems: 'center',
  },
  selectorBtnActivo: { backgroundColor: '#2E4057', borderColor: '#2E4057' },
  selectorTexto:      { fontSize: 14, color: '#555', fontWeight: '500' },
  selectorTextoActivo: { color: '#FFF' },

  // Botones
  botonGuardar: {
    backgroundColor: '#2E4057', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 32,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonGuardarTexto:  { color: '#FFF', fontSize: 16, fontWeight: '600' },
  botonHistorial: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E4057', borderRadius: 8,
    paddingVertical: 12, marginTop: 12,
  },
  botonHistorialTexto: { color: '#2E4057', fontSize: 15, fontWeight: '500' },
  botonDesactivar: {
    borderWidth: 1, borderColor: '#C0392B', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', marginTop: 12,
  },
  botonDesactivarTexto: { color: '#C0392B', fontSize: 15, fontWeight: '500' },
});
