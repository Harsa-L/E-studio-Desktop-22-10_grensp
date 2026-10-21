import { describe, expect, it } from 'vitest';
import {
  generateBarcodeBars,
  generateEan8Bars,
  generateGtin14Bars,
  generateGs1Code128Bars,
  normalizeGs1Data,
} from '../utils/barcodeGenerator';

describe('barcodeGenerator retail and logistics symbologies', () => {
  it('automatically selects EAN-8 for an 8-digit code and calculates a 7-digit check digit', () => {
    const generated = generateBarcodeBars('96385074', 'auto');
    expect(generated.error).toBeUndefined();
    expect(generated.formattedCode).toBe('96385074');
    expect(generated.bars).toHaveLength(67);
    expect(generateEan8Bars('9638507').formattedCode).toBe('96385074');
  });

  it('accepts a leading-zero UPC/EAN payload and calculates its EAN-13 check digit', () => {
    const generated = generateBarcodeBars('000123456789', 'auto');
    expect(generated.error).toBeUndefined();
    expect(generated.formattedCode.replace(/\s/g, '')).toHaveLength(13);
    expect(generated.formattedCode.replace(/\s/g, '').startsWith('0')).toBe(true);
  });

  it('encodes GTIN-14 as ITF-14 and rejects an invalid check digit', () => {
    const calculated = generateGtin14Bars('1001234500001');
    expect(calculated.error).toBeUndefined();
    expect(calculated.formattedCode).toHaveLength(14);
    expect(calculated.bars.length).toBeGreaterThan(70);
    expect(generateGtin14Bars('10012345000010').error).toBeDefined();
  });

  it('encodes parenthesized GS1 application identifiers and inserts a separator after variable-length data', () => {
    const input = '(01)09506000134352(17)250101(10)LOT-7';
    const generated = generateGs1Code128Bars(input);
    expect(generated.error).toBeUndefined();
    expect(generated.bars.length).toBeGreaterThan(0);
    expect(normalizeGs1Data(input)).toBe('01095060001343521725010110LOT-7');
    expect(generateGs1Code128Bars('(01)123(17)250101').error).toBeDefined();
  });
});
