import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Competencia } from '../../types';
import { IExportador } from './IExportador';

// 'YYYY-MM-DD' → 'DD/MM/YYYY'
function fmtFecha(str: string): string {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

const ESTILOS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #333; }
  .cabecera {
    background: #2E4057; color: #fff;
    padding: 24px 32px 20px;
  }
  .cabecera h1 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
                  opacity: 0.75; margin-bottom: 4px; }
  .cabecera h2 { font-size: 20px; font-weight: 700; }
  .meta { display: flex; gap: 48px; padding: 20px 32px 0; }
  .meta-item { }
  .meta-label { font-size: 9px; text-transform: uppercase; color: #888; margin-bottom: 2px; }
  .meta-value { font-size: 13px; font-weight: 600; }
  .contenido { padding: 24px 32px 40px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #2E4057; color: #fff; padding: 9px 12px;
       text-align: left; font-size: 10px; text-transform: uppercase; }
  td { padding: 9px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .pie { padding: 0 32px 24px; font-size: 10px; color: #aaa; text-align: right; }
`;

async function generarYCompartir(html: string, nombreArchivo: string) {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Compartir ${nombreArchivo}`,
    UTI: 'com.adobe.pdf',
  });
}

export class ExportadorPDF implements IExportador {
  async exportarConvocatoria(
    competencia: Competencia,
    atletas: { nombre: string; apellido: string; disciplina: string; categoria: string }[],
  ): Promise<void> {
    const filas = atletas
      .map(
        (a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${a.apellido}</strong>, ${a.nombre}</td>
          <td>${a.disciplina}</td>
          <td>${a.categoria}</td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${ESTILOS}</style></head>
<body>
  <div class="cabecera">
    <h1>Club Deportivo Linces — Convocatoria</h1>
    <h2>${competencia.nombre}</h2>
  </div>
  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Fecha</div>
      <div class="meta-value">${fmtFecha(competencia.fecha)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Lugar</div>
      <div class="meta-value">${competencia.lugar}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Atletas convocados</div>
      <div class="meta-value">${atletas.length}</div>
    </div>
  </div>
  ${competencia.descripcion ? `<div style="padding: 12px 32px 0; color:#555;">${competencia.descripcion}</div>` : ''}
  <div class="contenido">
    <table>
      <thead><tr><th>#</th><th>Atleta</th><th>Disciplina</th><th>Categoría</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
  <div class="pie">Generado por Club Deportivo Linces</div>
</body></html>`;

    await generarYCompartir(html, 'convocatoria');
  }

  async exportarResultados(
    competencia: Competencia,
    resultados: { nombre: string; apellido: string; posicion?: number; marcaObtenida?: number }[],
  ): Promise<void> {
    const ordenados = [...resultados].sort((a, b) => {
      if (a.posicion == null && b.posicion == null) return 0;
      if (a.posicion == null) return 1;
      if (b.posicion == null) return -1;
      return a.posicion - b.posicion;
    });

    const filas = ordenados
      .map(
        (r) => `
        <tr>
          <td style="text-align:center; font-weight:700; font-size:14px;">
            ${r.posicion != null ? r.posicion : '—'}
          </td>
          <td><strong>${r.apellido}</strong>, ${r.nombre}</td>
          <td style="text-align:center;">
            ${r.marcaObtenida != null ? r.marcaObtenida : '—'}
          </td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${ESTILOS}</style></head>
<body>
  <div class="cabecera">
    <h1>Club Deportivo Linces — Resultados</h1>
    <h2>${competencia.nombre}</h2>
  </div>
  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Fecha</div>
      <div class="meta-value">${fmtFecha(competencia.fecha)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Lugar</div>
      <div class="meta-value">${competencia.lugar}</div>
    </div>
  </div>
  ${competencia.descripcion ? `<div style="padding: 12px 32px 0; color:#555;">${competencia.descripcion}</div>` : ''}
  <div class="contenido">
    <table>
      <thead>
        <tr>
          <th style="text-align:center; width:60px;">Pos.</th>
          <th>Atleta</th>
          <th style="text-align:center; width:100px;">Marca</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
  <div class="pie">Generado por Club Deportivo Linces</div>
</body></html>`;

    await generarYCompartir(html, 'resultados');
  }
}
