import * as Crypto from 'expo-crypto';
import { EntrenadorRepository } from '../repositories/EntrenadorRepository';

const repo = new EntrenadorRepository();

async function hashear(texto: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);
}

export async function hayEntrenadorRegistrado(): Promise<boolean> {
  return repo.existeEntrenador();
}

export async function registrarEntrenador(
  correo: string,
  contrasena: string,
  preguntaSeguridad: string,
  respuestaSeguridad: string,
): Promise<void> {
  const contrasenhaHash = await hashear(contrasena);
  const respuestaHash   = await hashear(respuestaSeguridad.trim().toLowerCase());
  await repo.registrar(correo.trim().toLowerCase(), contrasenhaHash, preguntaSeguridad, respuestaHash);
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<boolean> {
  const entrenador = await repo.obtenerPorCorreo(correo.trim().toLowerCase());
  if (!entrenador) return false;

  const contrasenhaHash = await hashear(contrasena);
  return entrenador.contrasena === contrasenhaHash;
}

export async function verificarRespuestaSeguridad(
  correo: string,
  respuesta: string,
): Promise<boolean> {
  const entrenador = await repo.obtenerPorCorreo(correo.trim().toLowerCase());
  if (!entrenador?.respuestaSeguridad) return false;

  const respuestaHash = await hashear(respuesta.trim().toLowerCase());
  return entrenador.respuestaSeguridad === respuestaHash;
}
