// Vector Code 128 and EAN-13 Barcode generator with strict GS1 validation and caching

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

// EAN-13 encodings
const EAN_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011"
];
const EAN_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111"
];
const EAN_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100"
];
const EAN_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
];

// Runtime Memoization Caches
const code128Cache = new Map<string, boolean[]>();
const ean13Cache = new Map<string, { bars: boolean[]; formattedCode: string; error?: string }>();
const ean8Cache = new Map<string, { bars: boolean[]; formattedCode: string; error?: string }>();
const gtin14Cache = new Map<string, { bars: boolean[]; formattedCode: string; error?: string }>();
const svgPathCache = new Map<string, string>();

function calculateGtinCheckDigit(body: string): string {
  const sum = body.split('').reverse().reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 3 : 1);
  }, 0);
  return String((10 - (sum % 10)) % 10);
}

function validateGtin(code: string, bodyLength: number): { normalizedCode?: string; reason?: string } {
  const digits = String(code || '').trim();
  if (!new RegExp(`^\\d{${bodyLength}}(?:\\d)?$`).test(digits)) {
    return { reason: `Longueur GTIN invalide : ${digits.length} chiffres.` };
  }
  if (digits.length === bodyLength) return { normalizedCode: digits + calculateGtinCheckDigit(digits) };
  if (calculateGtinCheckDigit(digits.slice(0, bodyLength)) !== digits[bodyLength]) {
    return { reason: 'Clé de contrôle GTIN invalide.' };
  }
  return { normalizedCode: digits };
}

const EAN8_L = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];
const EAN8_R = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

function encodeEan8(code: string): { bars: boolean[]; formattedCode: string; error?: string } {
  const validation = validateGtin(code, 7);
  if (!validation.normalizedCode) return { bars: [], formattedCode: code, error: validation.reason };
  const digits = validation.normalizedCode;
  const bits = `101${digits.slice(0, 4).split('').map((d) => EAN8_L[Number(d)]).join('')}01010${digits.slice(4).split('').map((d) => EAN8_R[Number(d)]).join('')}101`;
  return { bars: [...bits].map((bit) => bit === '1'), formattedCode: digits };
}

const ITF_DIGITS = [
  '00110', '10001', '01001', '11000', '00101',
  '10100', '01100', '00011', '10010', '01010',
];

function encodeItf14(code: string): { bars: boolean[]; formattedCode: string; error?: string } {
  const validation = validateGtin(code, 13);
  if (!validation.normalizedCode) return { bars: [], formattedCode: code, error: validation.reason };
  const digits = validation.normalizedCode;
  const bits: boolean[] = [true, false, true, false];
  for (let i = 0; i < digits.length; i += 2) {
    const bars = ITF_DIGITS[Number(digits[i])];
    const spaces = ITF_DIGITS[Number(digits[i + 1])];
    for (let j = 0; j < 5; j++) {
      bits.push(bars[j] === '1', spaces[j] === '1');
    }
  }
  bits.push(true, true, false);
  return { bars: bits, formattedCode: digits };
}

function code128FromValues(values: number[]): boolean[] {
  const codes = [104, ...values];
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) checksum += codes[i] * i;
  codes.push(checksum % 103, 106);
  const bars: boolean[] = [];
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    let isBar = true;
    for (const widthText of pattern) {
      for (let width = 0; width < Number(widthText); width++) bars.push(isBar);
      isBar = !isBar;
    }
  }
  bars.push(true, true);
  return bars;
}

function gs1Values(input: string): number[] | null {
  const text = input.trim().replace(/^\]C1/, '');
  const values: number[] = [102];
  if (!text.includes('(')) {
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 29) values.push(102);
      else {
        const value = text.charCodeAt(i) - 32;
        if (value < 0 || value > 95) return null;
        values.push(value);
      }
    }
    return values;
  }

  const fields = [...text.matchAll(/\((\d{2,4})\)([^()]*)/g)];
  if (!fields.length || fields.map((field) => field[0]).join('') !== text) return null;
  const variableLengthAis = new Set(['10', '21', '22', '30', '37', '240', '241', '250', '251', '400', '401', '420', '421']);
  let valid = true;
  fields.forEach((field, index) => {
    const ai = field[1];
    const data = field[2];
    const fixedLength = ai === '00' ? 18 : ai === '01' ? 14 : ['11', '12', '13', '15', '16', '17'].includes(ai) ? 6 : ai === '20' ? 2 : /^310\d$/.test(ai) ? 6 : undefined;
    if (fixedLength !== undefined && data.length !== fixedLength) {
      valid = false;
      return;
    }
    if (!data || /[^\x20-\x7e]/.test(data)) {
      valid = false;
      return;
    }
    for (const char of `${ai}${data}`) values.push(char.charCodeAt(0) - 32);
    if (index < fields.length - 1 && (fixedLength === undefined || variableLengthAis.has(ai))) values.push(102);
  });
  return valid && values.length ? values : null;
}

export function normalizeGs1Data(input: string): string | null {
  if (!gs1Values(input)) return null;
  const text = input.trim().replace(/^\]C1/, '');
  if (!text.includes('(')) return text;
  const fields = [...text.matchAll(/\((\d{2,4})\)([^()]*)/g)];
  const variableLengthAis = new Set(['10', '21', '22', '30', '37', '240', '241', '250', '251', '400', '401', '420', '421']);
  return fields.map((field, index) => {
    const ai = field[1];
    const data = field[2];
    const fixedLength = ai === '00' ? 18 : ai === '01' ? 14 : ['11', '12', '13', '15', '16', '17'].includes(ai) ? 6 : ai === '20' ? 2 : /^310\d$/.test(ai) ? 6 : undefined;
    const separator = index < fields.length - 1 && (fixedLength === undefined || variableLengthAis.has(ai)) ? '\x1d' : '';
    return `${ai}${data}${separator}`;
  }).join('');
}

export function generateGs1Code128Bars(input: string): { bars: boolean[]; formattedCode: string; error?: string } {
  if (!input?.trim()) return { bars: [], formattedCode: input || '', error: 'Code GS1-128 vide.' };
  const values = gs1Values(input);
  if (!values) return { bars: [], formattedCode: input, error: 'Données GS1-128 mal formées.' };
  return { bars: code128FromValues(values), formattedCode: input };
}

export function generateEan8Bars(code: string): { bars: boolean[]; formattedCode: string; error?: string } {
  const cached = ean8Cache.get(code);
  if (cached) return cached;
  const result = encodeEan8(code);
  if (ean8Cache.size > 2000) ean8Cache.clear();
  ean8Cache.set(code, result);
  return result;
}

export function generateGtin14Bars(code: string): { bars: boolean[]; formattedCode: string; error?: string } {
  const cached = gtin14Cache.get(code);
  if (cached) return cached;
  const result = encodeItf14(code);
  if (gtin14Cache.size > 2000) gtin14Cache.clear();
  gtin14Cache.set(code, result);
  return result;
}

export function inferBarcodeType(code: string): 'ean8' | 'ean13' | 'code128' {
  const digits = String(code || '').trim();
  if (/^\d{8}$/.test(digits)) return 'ean8';
  if (/^\d{12,13}$/.test(digits)) return 'ean13';
  return 'code128';
}

export type BarcodeSymbology = 'auto' | 'code128' | 'ean8' | 'ean13' | 'gtin14' | 'gs1_128';

export function resolveBarcodeSymbology(code: string, requested: BarcodeSymbology = 'auto'): Exclude<BarcodeSymbology, 'auto'> {
  if (requested !== 'auto') return requested;
  const inferred = inferBarcodeType(code);
  return inferred;
}

export function generateBarcodeBars(
  code: string,
  requested: BarcodeSymbology = 'auto'
): { bars: boolean[]; formattedCode: string; error?: string } {
  const symbology = resolveBarcodeSymbology(code, requested);
  switch (symbology) {
    case 'ean8':
      return generateEan8Bars(code);
    case 'ean13':
      return generateEAN13Bars(code);
    case 'gtin14':
      return generateGtin14Bars(code);
    case 'gs1_128':
      return generateGs1Code128Bars(code);
    case 'code128':
    default:
      if (!code?.trim()) return { bars: [], formattedCode: code || '', error: 'Code-barres vide.' };
      return { bars: generateCode128Bars(code), formattedCode: code };
  }
}

/**
 * Validates whether a given string is a strictly compliant EAN-13 or 12-digit UPC code.
 */
export function validateEAN13(code: string): { valid: boolean; reason?: string; normalizedCode?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, reason: 'Code-barre manquant ou vide' };
  }
  const trimmed = code.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, reason: 'Un code EAN-13 ne doit contenir que des chiffres décimaux (0-9)' };
  }

  if (trimmed.length === 12) {
    // 12 digits: calculate and append check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(trimmed[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return { valid: true, normalizedCode: trimmed + checkDigit };
  }

  if (trimmed.length === 13) {
    // 13 digits: strictly verify checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(trimmed[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const expectedCheck = (10 - (sum % 10)) % 10;
    const actualCheck = parseInt(trimmed[12], 10);
    if (actualCheck !== expectedCheck) {
      return {
        valid: false,
        reason: `Clé de contrôle EAN-13 invalide (attendu: ${expectedCheck}, trouvé: ${actualCheck})`,
      };
    }
    return { valid: true, normalizedCode: trimmed };
  }

  return {
    valid: false,
    reason: `Longueur EAN-13 invalide : ${trimmed.length} chiffres (13 chiffres requis, ou 12 sans clé)`,
  };
}

export function generateCode128Bars(text: string): boolean[] {
  const clean = text ? text.trim() : "";
  if (!clean) return [];

  const cached = code128Cache.get(clean);
  if (cached) return cached;

  const startCodeB = 104; // Start B
  const codes: number[] = [startCodeB];

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const codeVal = charCode - 32;
    if (codeVal >= 0 && codeVal <= 95) {
      codes.push(codeVal);
    } else {
      codes.push(0);
    }
  }

  // Calculate checksum
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106); // Stop code

  // Convert to bar pattern
  const bars: boolean[] = [];
  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      for (let w = 0; w < width; w++) {
        bars.push(isBar);
      }
      isBar = !isBar;
    }
  }
  // Terminal bar
  bars.push(true, true);

  if (code128Cache.size > 2000) code128Cache.clear();
  code128Cache.set(clean, bars);
  return bars;
}

export function generateEAN13Bars(code: string): { bars: boolean[]; formattedCode: string; error?: string } {
  if (!code) {
    return { bars: [], formattedCode: '', error: 'Code vide' };
  }

  const cached = ean13Cache.get(code);
  if (cached) return cached;

  const validation = validateEAN13(code);
  if (!validation.valid || !validation.normalizedCode) {
    const result = {
      bars: [],
      formattedCode: code,
      error: validation.reason || 'Code EAN-13 non conforme',
    };
    ean13Cache.set(code, result);
    return result;
  }

  const full13 = validation.normalizedCode;
  const firstDigit = parseInt(full13[0], 10);
  const parityPattern = EAN_PARITY[firstDigit];

  const bars: boolean[] = [];

  // Start guard (101)
  bars.push(true, false, true);

  // Left 6 digits
  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(full13[i], 10);
    const useG = parityPattern[i - 1] === 'G';
    const pattern = useG ? EAN_G[digit] : EAN_L[digit];
    for (let j = 0; j < pattern.length; j++) {
      bars.push(pattern[j] === '1');
    }
  }

  // Center guard (01010)
  bars.push(false, true, false, true, false);

  // Right 6 digits (always R encoding)
  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(full13[i], 10);
    const pattern = EAN_R[digit];
    for (let j = 0; j < pattern.length; j++) {
      bars.push(pattern[j] === '1');
    }
  }

  // Stop guard (101)
  bars.push(true, false, true);

  const formattedCode = `${full13[0]} ${full13.slice(1, 7)} ${full13.slice(7)}`;
  const result = { bars, formattedCode };

  if (ean13Cache.size > 2000) ean13Cache.clear();
  ean13Cache.set(code, result);
  return result;
}

/**
 * Builds a single SVG path definition string for a barcode bar array.
 */
export function getBarcodeSvgPath(bars: boolean[], height: number = 100): string {
  if (!bars || bars.length === 0) return '';
  const key = `${bars.length}_${height}_${bars.slice(0, 15).join('')}_${bars.slice(-15).join('')}`;
  const cached = svgPathCache.get(key);
  if (cached) return cached;

  let d = '';
  const total = bars.length;
  const barWidth = 100 / total;

  let i = 0;
  while (i < total) {
    if (bars[i]) {
      let span = 1;
      while (i + span < total && bars[i + span]) {
        span++;
      }
      const x = (i * barWidth).toFixed(3);
      const w = (span * barWidth + 0.05).toFixed(3);
      d += `M${x} 0h${w}v${height}h-${w}Z `;
      i += span;
    } else {
      i++;
    }
  }

  if (svgPathCache.size > 1000) svgPathCache.clear();
  svgPathCache.set(key, d);
  return d;
}

/**
 * Renders a crisp rasterized barcode dataURL (PNG) with proper quiet zones.
 */
export function renderBarcodeToDataUrl(
  barsOrCode: boolean[] | string,
  barColorOrType: string = '#000000',
  backgroundColorOrShowText: string | boolean = '#FFFFFF',
  widthPxOrColor: number | string = 300,
  heightPx: number = 100
): string {
  if (typeof document === 'undefined') return '';
  let bars: boolean[] = [];
  let barColor = '#000000';
  let backgroundColor = '#FFFFFF';
  let widthPx = 300;

  if (typeof barsOrCode === 'string') {
    const code = barsOrCode;
    const type =
      typeof barColorOrType === 'string' && (barColorOrType === 'code128' || barColorOrType === 'ean13')
        ? barColorOrType
        : 'ean13';
    try {
      if (type === 'ean13') {
        const eanRes = generateEAN13Bars(code);
        bars = eanRes.bars;
      } else {
        bars = generateCode128Bars(code);
      }
    } catch {
      bars = generateCode128Bars(code);
    }
    if (typeof widthPxOrColor === 'string') {
      barColor = widthPxOrColor;
    }
  } else {
    bars = barsOrCode || [];
    barColor = typeof barColorOrType === 'string' ? barColorOrType : '#000000';
    backgroundColor = typeof backgroundColorOrShowText === 'string' ? backgroundColorOrShowText : '#FFFFFF';
    widthPx = typeof widthPxOrColor === 'number' ? widthPxOrColor : 300;
  }

  if (!bars || bars.length === 0) return '';

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, widthPx, heightPx);

  const quietMargin = Math.round(widthPx * 0.05);
  const drawableWidth = widthPx - quietMargin * 2;
  const barWidth = drawableWidth / bars.length;

  ctx.fillStyle = barColor || '#000000';
  let i = 0;
  while (i < bars.length) {
    if (bars[i]) {
      let span = 1;
      while (i + span < bars.length && bars[i + span]) {
        span++;
      }
      const x = quietMargin + i * barWidth;
      const w = span * barWidth;
      ctx.fillRect(x, 0, Math.max(1, Math.round(w)), heightPx);
      i += span;
    } else {
      i++;
    }
  }

  return canvas.toDataURL('image/png');
}
