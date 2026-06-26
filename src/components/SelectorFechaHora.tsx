import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

interface Props {
  mode: 'date' | 'time';
  valor: string;           // 'YYYY-MM-DD' | 'HH:MM' | ''
  onSeleccionar: (valor: string) => void;
  placeholder: string;
  maximumDate?: Date;
}

// ── Helpers de conversión ────────────────────────────────────────────────────
export function strFechaToDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function strHoraToDate(str: string): Date {
  const [h, m] = str.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

export function dateToFecha(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateToHora(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDisplay(valor: string, mode: 'date' | 'time'): string {
  if (!valor) return '';
  if (mode === 'date') {
    const [y, m, d] = valor.split('-');
    return `${d}/${m}/${y}`;
  }
  return valor; // 'HH:MM' ya es legible
}

function valorToDate(valor: string, mode: 'date' | 'time'): Date {
  if (!valor) return new Date();
  return mode === 'date' ? strFechaToDate(valor) : strHoraToDate(valor);
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function SelectorFechaHora({ mode, valor, onSeleccionar, placeholder, maximumDate }: Props) {
  const [mostrar, setMostrar]         = useState(false);
  const [temporal, setTemporal]       = useState(new Date());

  function abrir() {
    setTemporal(valor ? valorToDate(valor, mode) : new Date());
    setMostrar(true);
  }

  function aplicar(date: Date) {
    onSeleccionar(mode === 'date' ? dateToFecha(date) : dateToHora(date));
  }

  // Android: el picker es diálogo nativo que se cierra solo
  function handleAndroid(_: DateTimePickerEvent, date?: Date) {
    setMostrar(false);
    if (date) aplicar(date);
  }

  return (
    <>
      <TouchableOpacity style={styles.boton} onPress={abrir}>
        <Text style={valor ? styles.texto : styles.placeholder}>
          {valor ? formatDisplay(valor, mode) : placeholder}
        </Text>
        <Feather name={mode === 'date' ? 'calendar' : 'clock'} size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Android: mostrar directamente */}
      {Platform.OS === 'android' && mostrar && (
        <DateTimePicker
          value={temporal}
          mode={mode}
          display="default"
          maximumDate={maximumDate}
          onChange={handleAndroid}
        />
      )}

      {/* iOS: spinner en Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={mostrar} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.hoja}>
              <View style={styles.barra}>
                <TouchableOpacity onPress={() => setMostrar(false)}>
                  <Text style={styles.cancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { aplicar(temporal); setMostrar(false); }}>
                  <Text style={styles.confirmar}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={temporal}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                onChange={(_, date) => { if (date) setTemporal(date); }}
                locale="es-CR"
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  texto:       { fontSize: 15, color: '#333' },
  placeholder: { fontSize: 15, color: '#999' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  hoja: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  barra: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  cancelar:  { fontSize: 16, color: '#888' },
  confirmar: { fontSize: 16, color: '#2E4057', fontWeight: '600' },
});
