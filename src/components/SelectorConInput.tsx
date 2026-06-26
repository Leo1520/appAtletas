import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  label: string;
  valor: string;
  opciones: string[];
  onSeleccionar: (valor: string) => void;
  placeholder?: string;
  labelNuevo?: string; // texto del item "agregar nuevo"
}

export default function SelectorConInput({
  label, valor, opciones, onSeleccionar,
  placeholder = 'Seleccionar…',
  labelNuevo = '+ Agregar nuevo',
}: Props) {
  const [abierto, setAbierto]   = useState(false);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [textoNuevo, setTextoNuevo] = useState('');

  function seleccionar(opcion: string) {
    onSeleccionar(opcion);
    cerrar();
  }

  function confirmarNuevo() {
    const limpio = textoNuevo.trim();
    if (limpio) onSeleccionar(limpio);
    cerrar();
  }

  function cerrar() {
    setAbierto(false);
    setModoNuevo(false);
    setTextoNuevo('');
  }

  const items = [...opciones, '__nuevo__'];

  return (
    <>
      {/* Botón disparador */}
      <TouchableOpacity style={styles.disparador} onPress={() => setAbierto(true)}>
        <Text style={valor ? styles.disparadorTexto : styles.disparadorPlaceholder}>
          {valor || placeholder}
        </Text>
        <Feather name="chevron-right" size={18} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={abierto} animationType="slide" transparent onRequestClose={cerrar}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.hoja}>
            {/* Encabezado */}
            <View style={styles.encabezado}>
              <Text style={styles.encabezadoTitulo}>{label}</Text>
              <TouchableOpacity onPress={cerrar}>
                <Text style={styles.cerrar}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            {modoNuevo ? (
              /* Vista "agregar nuevo" */
              <View style={styles.nuevoContenedor}>
                <TextInput
                  style={styles.nuevoInput}
                  value={textoNuevo}
                  onChangeText={setTextoNuevo}
                  placeholder={`Escribe ${label.toLowerCase()}…`}
                  placeholderTextColor="#999"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.confirmarBtn, !textoNuevo.trim() && styles.btnDeshabilitado]}
                  onPress={confirmarNuevo}
                  disabled={!textoNuevo.trim()}
                >
                  <Text style={styles.confirmarTexto}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.volverBtn} onPress={() => setModoNuevo(false)}>
                  <Text style={styles.volverTexto}>← Volver a la lista</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Lista de opciones */
              <FlatList
                data={items}
                keyExtractor={(item) => item}
                renderItem={({ item }) =>
                  item === '__nuevo__' ? (
                    <TouchableOpacity style={styles.itemNuevo} onPress={() => setModoNuevo(true)}>
                      <Text style={styles.itemNuevoTexto}>{labelNuevo}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.item, valor === item && styles.itemActivo]}
                      onPress={() => seleccionar(item)}
                    >
                      <Text style={[styles.itemTexto, valor === item && styles.itemTextoActivo]}>
                        {item}
                      </Text>
                      {valor === item && <Feather name="check" size={16} color="#2E4057" />}
                    </TouchableOpacity>
                  )
                }
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  disparador: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disparadorTexto: { fontSize: 15, color: '#333' },
  disparadorPlaceholder: { fontSize: 15, color: '#999' },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  hoja: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  encabezadoTitulo: { fontSize: 16, fontWeight: '600', color: '#2E4057' },
  cerrar: { fontSize: 15, color: '#888' },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemActivo: { backgroundColor: '#F0F4F8' },
  itemTexto: { fontSize: 15, color: '#333' },
  itemTextoActivo: { color: '#2E4057', fontWeight: '600' },

  itemNuevo: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  itemNuevoTexto: { fontSize: 15, color: '#2E4057', fontWeight: '600' },

  nuevoContenedor: { padding: 20 },
  nuevoInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  confirmarBtn: {
    backgroundColor: '#2E4057',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnDeshabilitado: { opacity: 0.4 },
  confirmarTexto: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  volverBtn: { alignItems: 'center', paddingVertical: 8 },
  volverTexto: { fontSize: 14, color: '#888' },
});
