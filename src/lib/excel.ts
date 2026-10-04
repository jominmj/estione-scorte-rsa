import * as XLSX from 'xlsx';

type OrderExportRow = {
  'Principio Attivo / Presidio': string;
  'Dosaggio / Formato': string;
  'Tipo': string;
  'Nome Commerciale': string;
  'Giacenza (confezioni)': number;
  'Pezzi per Scatola': number;
  'Scatole da Ordinare': number;
};

export function exportOrderExcel(
  orders: {
    active_ingredient: string;
    dosage: string;
    item_type: string;
    commercial_name: string;
    current_boxes: number;
    pack_size: number;
    order_boxes: number;
  }[]
): void {
  const rows: OrderExportRow[] = orders.map((o) => ({
    'Principio Attivo / Presidio': o.active_ingredient,
    'Dosaggio / Formato': o.dosage,
    'Tipo': o.item_type,
    'Nome Commerciale': o.commercial_name,
    'Giacenza (confezioni)': o.current_boxes,
    'Pezzi per Scatola': o.pack_size,
    'Scatole da Ordinare': o.order_boxes,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ordine Quindicinale');

  XLSX.utils.sheet_add_aoa(ws, [
    ['Ordine Farmaci Quindicinale RSA - Le Residenze'],
    ['Destinatario: farmaci.leresidenze@leresidenze.it'],
    [`Data: ${new Date().toLocaleDateString('it-IT')}`],
    [],
  ], { origin: 0 });

  XLSX.writeFile(wb, `Ordine_Quindicinale_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
