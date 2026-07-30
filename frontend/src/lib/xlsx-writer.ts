/**
 * Zero-dependency minimal XLSX writer for browser environments.
 *
 * Generates valid OOXML (.xlsx) files using only the browser's built-in
 * CompressionStream API (supported in all modern browsers).
 *
 * Usage:
 *   const writer = new XlsxWriter();
 *   writer.addSheet('Sheet1', [['Header1', 'Header2'], [1, 'value']]);
 *   const blob = await writer.toBlob();
 */

// ─── XML helpers ────────────────────────────────────────────────────────────

function escapeXml(value: unknown): string {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert a 0-based column index to Excel column letters (A, B, … Z, AA, …)
 */
function colName(idx: number): string {
  let name = '';
  let n = idx;
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

/**
 * Build the XML for a single worksheet.
 * Returns { xml: string, sharedStrings: string[] }
 */
function buildSheetXml(
  rows: unknown[][],
  sharedStrings: string[],
  ssMap: Map<string, number>
): string {
  const rowsXml = rows
    .map((row, rIdx) => {
      const cells = row
        .map((cell, cIdx) => {
          const addr = `${colName(cIdx)}${rIdx + 1}`;
          if (cell === null || cell === undefined || cell === '') {
            return `<c r="${addr}"/>`;
          }
          if (typeof cell === 'number') {
            return `<c r="${addr}" t="n"><v>${cell}</v></c>`;
          }
          // shared string
          const s = String(cell);
          let ssIdx = ssMap.get(s);
          if (ssIdx === undefined) {
            ssIdx = sharedStrings.length;
            sharedStrings.push(s);
            ssMap.set(s, ssIdx);
          }
          return `<c r="${addr}" t="s"><v>${ssIdx}</v></c>`;
        })
        .join('');
      return `<row r="${rIdx + 1}">${cells}</row>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${rowsXml}</sheetData>` +
    `</worksheet>`
  );
}

// ─── ZIP builder (using DecompressionStream / CompressionStream) ─────────────

/**
 * Minimal ZIP builder that uses the browser's native CompressionStream.
 * Produces a valid ZIP file with DEFLATE or STORED entries.
 */
class ZipBuilder {
  private entries: Array<{
    name: string;
    data: Uint8Array;
    compressed: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  async addFile(name: string, content: string | Uint8Array): Promise<void> {
    const data =
      typeof content === 'string'
        ? new TextEncoder().encode(content)
        : content;

    let compressed: Uint8Array;
    try {
      compressed = await this.deflate(data);
    } catch {
      compressed = data; // fallback to STORED
    }

    // Use STORED if compression doesn't help
    const useStored = compressed.length >= data.length;
    const finalCompressed = useStored ? data : compressed;

    this.entries.push({
      name,
      data,
      compressed: finalCompressed,
      crc: crc32(data),
      offset: 0, // filled during build
    });
  }

  private async deflate(data: Uint8Array): Promise<Uint8Array> {
    // CompressionStream produces zlib format; we need raw deflate for ZIP.
    // We strip the 2-byte zlib header and 4-byte adler32 trailer.
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength));
    writer.close();

    const chunks: Uint8Array[] = [];
    const reader = cs.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const chunk of chunks) {
      out.set(chunk, pos);
      pos += chunk.length;
    }
    return out;
  }

  build(): Uint8Array {
    const parts: Uint8Array[] = [];
    let offset = 0;

    for (const entry of this.entries) {
      entry.offset = offset;
      const nameBytes = new TextEncoder().encode(entry.name);
      const useStored = entry.compressed.length >= entry.data.length;
      const method = useStored ? 0 : 8;
      const compData = useStored ? entry.data : entry.compressed;

      // Local file header
      const lh = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(lh.buffer);
      view.setUint32(0, 0x04034b50, true); // signature
      view.setUint16(4, 20, true); // version needed
      view.setUint16(6, 0, true); // flags
      view.setUint16(8, method, true); // compression method
      view.setUint16(10, 0, true); // mod time
      view.setUint16(12, 0, true); // mod date
      view.setUint32(14, entry.crc, true); // crc-32
      view.setUint32(18, compData.length, true); // compressed size
      view.setUint32(22, entry.data.length, true); // uncompressed size
      view.setUint16(26, nameBytes.length, true); // file name length
      view.setUint16(28, 0, true); // extra field length
      lh.set(nameBytes, 30);
      parts.push(lh);
      parts.push(compData);
      offset += lh.length + compData.length;
    }

    // Central directory
    const cdStart = offset;
    for (const entry of this.entries) {
      const nameBytes = new TextEncoder().encode(entry.name);
      const useStored = entry.compressed.length >= entry.data.length;
      const method = useStored ? 0 : 8;
      const compData = useStored ? entry.data : entry.compressed;

      const cd = new Uint8Array(46 + nameBytes.length);
      const view = new DataView(cd.buffer);
      view.setUint32(0, 0x02014b50, true); // signature
      view.setUint16(4, 20, true); // version made by
      view.setUint16(6, 20, true); // version needed
      view.setUint16(8, 0, true); // flags
      view.setUint16(10, method, true); // compression
      view.setUint16(12, 0, true); // mod time
      view.setUint16(14, 0, true); // mod date
      view.setUint32(16, entry.crc, true); // crc-32
      view.setUint32(20, compData.length, true); // compressed size
      view.setUint32(24, entry.data.length, true); // uncompressed size
      view.setUint16(28, nameBytes.length, true); // name length
      view.setUint16(30, 0, true); // extra length
      view.setUint16(32, 0, true); // comment length
      view.setUint16(34, 0, true); // disk start
      view.setUint16(36, 0, true); // int attrs
      view.setUint32(38, 0, true); // ext attrs
      view.setUint32(42, entry.offset, true); // local header offset
      cd.set(nameBytes, 46);
      parts.push(cd);
      offset += cd.length;
    }
    const cdSize = offset - cdStart;

    // End of central directory record
    const eocd = new Uint8Array(22);
    const eView = new DataView(eocd.buffer);
    eView.setUint32(0, 0x06054b50, true);
    eView.setUint16(4, 0, true); // disk number
    eView.setUint16(6, 0, true); // disk with cd
    eView.setUint16(8, this.entries.length, true);
    eView.setUint16(10, this.entries.length, true);
    eView.setUint32(12, cdSize, true);
    eView.setUint32(16, cdStart, true);
    eView.setUint16(20, 0, true); // comment length
    parts.push(eocd);

    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of parts) {
      out.set(p, pos);
      pos += p.length;
    }
    return out;
  }
}

// ─── CRC-32 ──────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export type SheetRow = (string | number | null | undefined)[];

export class XlsxWriter {
  private sheets: Array<{ name: string; rows: SheetRow[] }> = [];

  addSheet(name: string, rows: SheetRow[]): void {
    this.sheets.push({ name, rows });
  }

  async toBlob(): Promise<Blob> {
    const buffer = await this.toBuffer();
    return new Blob([new Uint8Array(buffer.buffer as ArrayBuffer, buffer.byteOffset, buffer.byteLength)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  async toBuffer(): Promise<Uint8Array> {
    const sharedStrings: string[] = [];
    const ssMap = new Map<string, number>();

    const sheetXmls = this.sheets.map((s) =>
      buildSheetXml(s.rows, sharedStrings, ssMap)
    );

    const sharedStringsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
      `count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">` +
      sharedStrings.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join('') +
      `</sst>`;

    const workbookXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
      `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>` +
      this.sheets
        .map(
          (s, i) =>
            `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
        )
        .join('') +
      `</sheets></workbook>`;

    const workbookRels =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      this.sheets
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" ` +
            `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ` +
            `Target="worksheets/sheet${i + 1}.xml"/>`
        )
        .join('') +
      `<Relationship Id="rId${this.sheets.length + 1}" ` +
      `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" ` +
      `Target="sharedStrings.xml"/>` +
      `</Relationships>`;

    const contentTypes =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      this.sheets
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
            `ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        )
        .join('') +
      `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
      `</Types>`;

    const rootRels =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" ` +
      `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ` +
      `Target="xl/workbook.xml"/>` +
      `</Relationships>`;

    const zip = new ZipBuilder();
    await zip.addFile('[Content_Types].xml', contentTypes);
    await zip.addFile('_rels/.rels', rootRels);
    await zip.addFile('xl/workbook.xml', workbookXml);
    await zip.addFile('xl/_rels/workbook.xml.rels', workbookRels);
    await zip.addFile('xl/sharedStrings.xml', sharedStringsXml);

    for (let i = 0; i < sheetXmls.length; i++) {
      await zip.addFile(`xl/worksheets/sheet${i + 1}.xml`, sheetXmls[i]);
    }

    return zip.build();
  }
}

/**
 * Convenience: parse an uploaded .xlsx file into array-of-arrays.
 * Uses the browser's built-in DecompressionStream to unzip.
 */
export async function parseXlsx(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  // Find all local file entries in the ZIP
  const files = new Map<string, Uint8Array>();
  let pos = 0;

  while (pos < data.length - 4) {
    const sig = readUint32LE(data, pos);
    if (sig !== 0x04034b50) {
      pos++;
      continue;
    }

    const method = readUint16LE(data, pos + 8);
    const compressedSize = readUint32LE(data, pos + 18);
    const uncompressedSize = readUint32LE(data, pos + 22);
    const nameLen = readUint16LE(data, pos + 26);
    const extraLen = readUint16LE(data, pos + 28);
    const nameBytes = data.slice(pos + 30, pos + 30 + nameLen);
    const name = new TextDecoder().decode(nameBytes);
    const dataStart = pos + 30 + nameLen + extraLen;
    const compData = data.slice(dataStart, dataStart + compressedSize);

    let fileData: Uint8Array;
    if (method === 0) {
      fileData = compData;
    } else if (method === 8) {
      fileData = await inflate(compData, uncompressedSize);
    } else {
      fileData = compData;
    }

    files.set(name, fileData);
    pos = dataStart + compressedSize;
  }

  // Find the first worksheet
  const sharedStringsXml = files.get('xl/sharedStrings.xml');
  const sharedStrings: string[] = [];

  if (sharedStringsXml) {
    const xml = new TextDecoder().decode(sharedStringsXml);
    const tMatches = xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g);
    for (const m of tMatches) {
      sharedStrings.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
    }
  }

  // Find sheet1
  let sheetXml: Uint8Array | undefined;
  for (const [name, content] of files) {
    if (name.match(/xl\/worksheets\/sheet1\.xml/)) {
      sheetXml = content;
      break;
    }
  }

  if (!sheetXml) return [];

  const xml = new TextDecoder().decode(sheetXml);
  const rows: string[][] = [];

  const rowMatches = xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g);
  for (const rowMatch of rowMatches) {
    const rowXml = rowMatch[1];
    const cells: string[] = [];
    const cellMatches = rowXml.matchAll(/<c\s[^>]*r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>)?/g);

    for (const cm of cellMatches) {
      const colLetters = cm[1];
      const colIdx = colLetters.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const type = cm[3];
      const rawVal = cm[4] ?? '';

      let val = rawVal;
      if (type === 's') {
        val = sharedStrings[parseInt(rawVal, 10)] ?? '';
      }

      // Pad sparse cells
      while (cells.length < colIdx) cells.push('');
      cells[colIdx] = val;
    }
    rows.push(cells);
  }

  return rows;
}

async function inflate(data: Uint8Array, _uncompressedSize: number): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength));
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

function readUint32LE(data: Uint8Array, pos: number): number {
  return (
    data[pos] |
    (data[pos + 1] << 8) |
    (data[pos + 2] << 16) |
    (data[pos + 3] << 24)
  ) >>> 0;
}

function readUint16LE(data: Uint8Array, pos: number): number {
  return data[pos] | (data[pos + 1] << 8);
}
