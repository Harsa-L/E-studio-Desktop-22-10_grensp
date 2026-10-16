import { describe, it, expect } from 'vitest';
import jsPDF from 'jspdf';
import { drawPdfItem } from '../render/drawPdfItem';
import { PriceBlockItemProperties, ProductRecord } from '../types';

describe('drawPdfItem Specification Tests', () => {
  it('un gabarit fixe avec un price_block produit un PDF dont le texte extrait contient le montant, et ne contient pas le rectangle « PALIERS DE PRIX » ni un unique !', () => {
    const doc = new jsPDF({ unit: 'mm', format: [100, 50] });

    const priceBlockItem: PriceBlockItemProperties = {
      id: 'price_block_fixed',
      type: 'price_block',
      x_mm: 10,
      y_mm: 10,
      w_mm: 40,
      h_mm: 20,
      rotation: 0,
      z_index: 1,
      locked: false,
      binding_key: 'SELLING_PRICE',
      currency_symbol: '€',
      decimal_separator: ',',
      integer_style: { font_size_pt: 24, font_weight: 'bold', text_color: '#000000' },
      decimal_style: { font_size_pt: 12, baseline_shift: 'superscript' },
      currency_style: { font_size_pt: 12 },
    };

    const record: ProductRecord = {
      id: 'prod_99',
      ITEMNAME: 'Article Test Prix',
      SELLING_PRICE: 29.99,
    };

    drawPdfItem(doc, priceBlockItem, 10, 10, record);

    const pdfOutput = doc.output('datauristring');
    // Also extract raw text stream representation
    const rawPdf = doc.output();

    // Check that PDF output stream contains formatted price numbers "29" and "99"
    expect(rawPdf).toContain('29');
    expect(rawPdf).toContain('99');

    // Must NOT contain dummy/error text
    expect(rawPdf).not.toContain('PALIERS DE PRIX');
    // Ensure it's not a single exclamation mark isolated error placeholder
    expect(rawPdf).not.toMatch(/\(!\)\s*Tj/);
  });
});
