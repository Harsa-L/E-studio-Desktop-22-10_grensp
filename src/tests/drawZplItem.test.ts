import { describe, expect, it } from 'vitest';
import { drawZplItem } from '../render/drawZplItem';
import { PriceBlockItemProperties, ProductRecord } from '../types';

describe('drawZplItem price blocks', () => {
  const item: PriceBlockItemProperties = {
    id: 'price',
    type: 'price_block',
    x_mm: 5,
    y_mm: 5,
    w_mm: 30,
    h_mm: 12,
    rotation: 0,
    z_index: 1,
    locked: false,
    binding_key: 'SELLING_PRICE',
    currency_symbol: '€',
    integer_style: { font_size_pt: 24 },
    decimal_style: { font_size_pt: 12 },
    promo_takes_hero_style: true,
    extensions: [{
      id: 'compare',
      role: 'compare_at',
      anchor: 'above',
      binding_key: 'SELLING_PRICE',
    }],
  };

  const product: ProductRecord = {
    id: 'product',
    ITEMNAME: 'Promo product',
    SELLING_PRICE: 10,
    PROMOPRICE: 8,
  };

  it('uses the shared resolver for active promo hero and compare-at values', () => {
    const output = drawZplItem(item, 203, product).join('\n');

    expect(output).toContain('^FD8 €^FS');
    expect(output).toContain('^FD10,00 €^FS');
  });

  it('hides promo extensions when the promotion is inactive', () => {
    const output = drawZplItem(item, 203, {
      ...product,
      PROMO_END_DATE: '2000-01-01',
    }).join('\n');

    expect(output).toContain('^FD10 €^FS');
    expect(output).not.toContain('8,00 €');
  });
});
