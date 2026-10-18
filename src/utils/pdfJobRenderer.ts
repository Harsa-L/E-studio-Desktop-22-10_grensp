import jsPDF from 'jspdf';
import { ImpositionConfig, LabelTemplate, ProductRecord } from '../types';
import { ImpositionCalculator } from './impositionCalculator';
import { drawPdfItem } from '../render/drawPdfItem';

export function renderImposedPdfJob(
  template: LabelTemplate,
  products: ProductRecord[],
  config: ImpositionConfig
): jsPDF {
  const imposition = ImpositionCalculator.calculate(
    template.width_mm,
    template.height_mm,
    template.outer_margins_mm,
    config
  );
  if (imposition.total_per_page < 1) throw new Error('The label does not fit on the selected page.');
  if (products.length === 0) throw new Error('The print job has no product snapshot to render.');

  const format = config.page_size === 'CUSTOM'
    ? [config.custom_page_w_mm || imposition.page_w_mm, config.custom_page_h_mm || imposition.page_h_mm]
    : config.page_size.toLowerCase();
  const doc = new jsPDF({
    orientation: config.orientation === 'landscape' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: format as any,
  });
  const labelsPerPage = imposition.total_per_page;
  const startOffset = Math.max(0, Math.min(labelsPerPage - 1, config.start_offset_slot || 0));
  const totalPages = Math.max(1, Math.ceil((products.length + startOffset) / labelsPerPage));
  const gapX = Math.max(0, config.gap_x_mm ?? config.gap_mm ?? 2);
  const gapY = Math.max(0, config.gap_y_mm ?? config.gap_mm ?? 2);
  let productCursor = 0;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) doc.addPage();
    for (let slot = 0; slot < labelsPerPage; slot++) {
      if (page === 0 && slot < startOffset) continue;
      if (productCursor >= products.length) break;

      const product = products[productCursor++];
      const column = slot % imposition.cols;
      const row = Math.floor(slot / imposition.cols);
      const nudge = config.slot_nudges?.[slot] || (config.slot_nudges as any)?.[String(slot)];
      const x = imposition.horizontal_offset_mm + column * (imposition.label_total_w_mm + gapX)
        + (nudge?.nudge_x_mm ?? (nudge as any)?.dx_mm ?? 0);
      const y = imposition.vertical_offset_mm + row * (imposition.label_total_h_mm + gapY)
        + (nudge?.nudge_y_mm ?? (nudge as any)?.dy_mm ?? 0);

      if (template.bg_color && template.bg_color !== 'transparent') {
        const hex = template.bg_color.replace('#', '');
        doc.setFillColor(
          parseInt(hex.substring(0, 2), 16) || 255,
          parseInt(hex.substring(2, 4), 16) || 255,
          parseInt(hex.substring(4, 6), 16) || 255
        );
        doc.rect(x, y, template.width_mm, template.height_mm, 'F');
      }
      if (template.background_image_path && template.background_image_in_output) {
        doc.addImage(template.background_image_path, 'JPEG', x, y, template.width_mm, template.height_mm);
      }
      if (config.show_cut_marks) {
        doc.setDrawColor(180, 180, 180);
        doc.line(x - 1.5, y, x + 1.5, y);
        doc.line(x, y - 1.5, x, y + 1.5);
        doc.line(x + template.width_mm - 1.5, y + template.height_mm, x + template.width_mm + 1.5, y + template.height_mm);
        doc.line(x + template.width_mm, y + template.height_mm - 1.5, x + template.width_mm, y + template.height_mm + 1.5);
      }
      template.items.forEach((item) => drawPdfItem(doc, item, x + item.x_mm, y + item.y_mm, product));
    }
  }

  return doc;
}