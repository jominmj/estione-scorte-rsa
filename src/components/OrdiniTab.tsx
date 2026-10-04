import { AlertTriangle, Package, Download, Mail } from 'lucide-react';
import type { Medication } from '@/lib/supabase';
import { totalQty } from '@/lib/supabase';
import { exportOrderExcel } from '@/lib/excel';

const SAFETY_THRESHOLD = 5;
const ORDER_TARGET = 30;

type Props = {
  medications: Medication[];
};

type OrderRow = {
  active_ingredient: string;
  dosage: string;
  item_type: string;
  commercial_name: string;
  current_boxes: number;
  needed_units: number;
  pack_size: number;
  order_boxes: number;
};

function computeOrders(medications: Medication[]): OrderRow[] {
  const lowStock = medications.filter((m) => totalQty(m) <= SAFETY_THRESHOLD);

  const grouped = new Map<string, {
    active_ingredient: string;
    dosage: string;
    item_type: string;
    commercial_name: string;
    current_boxes: number;
    pack_size: number;
  }>();

  for (const m of lowStock) {
    const key = `${m.active_ingredient.toLowerCase()}-${m.dosage.toLowerCase()}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.current_boxes += totalQty(m);
    } else {
      grouped.set(key, {
        active_ingredient: m.active_ingredient,
        dosage: m.dosage,
        item_type: m.item_type,
        commercial_name: m.commercial_name,
        current_boxes: totalQty(m),
        pack_size: m.pack_size || 1,
      });
    }
  }

  return Array.from(grouped.values()).map((g) => {
    const packSize = g.pack_size || 1;
    const neededUnits = packSize * ORDER_TARGET;
    const totalBoxesNeeded = Math.ceil((neededUnits + g.current_boxes * packSize) / packSize);
    const orderBoxes = Math.max(0, totalBoxesNeeded - g.current_boxes);

    return {
      active_ingredient: g.active_ingredient,
      dosage: g.dosage,
      item_type: g.item_type,
      commercial_name: g.commercial_name,
      current_boxes: g.current_boxes,
      needed_units: neededUnits,
      pack_size: packSize,
      order_boxes: orderBoxes,
    };
  });
}

export default function OrdiniTab({ medications }: Props) {
  const orders = computeOrders(medications);

  const handleExport = () => {
    if (orders.length === 0) return;
    exportOrderExcel(orders);
  };

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Lista Ordine Quindicinale</h2>
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <Package className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Tutte le scorte sono sopra la soglia di allerta. Nessun ordine da generare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Lista Ordine Quindicinale</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {orders.length} voci da ordinare
          </span>
          <button onClick={handleExport} className="btn-primary">
            <Download className="h-4 w-4" />
            Esporta Ordine in Excel
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-start gap-3 border-amber-200 bg-amber-50/50">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-amber-700">
            I farmaci e i presidi con Totale Generale uguale o inferiore a 5 confezioni sono automaticamente inseriti in questa lista.
            La quantita da ordinare e calcolata in scatole intere: il fabbisogno mensile di unita
            viene diviso per i pezzi contenuti in ogni scatola e arrotondato per eccesso.
          </p>
          <p className="text-sm text-amber-700 flex items-center gap-1.5">
            <Mail className="h-4 w-4" />
            L'ordine e pronto da inviare a: farmaci.leresidenze@leresidenze.it
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Principio Attivo / Presidio</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Dosaggio / Formato</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Nome Commerciale</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Giacenza</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Pezzi/Scatola</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Ordinare</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 bg-amber-50/30">
                  <td className="px-4 py-3 font-medium text-slate-800">{o.active_ingredient}</td>
                  <td className="px-4 py-3 text-slate-600">{o.dosage || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-medium">{o.item_type}</td>
                  <td className="px-4 py-3 text-slate-600">{o.commercial_name || '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold tabular-nums text-amber-700">{o.current_boxes}</td>
                  <td className="px-4 py-3 text-center text-slate-500 tabular-nums">{o.pack_size}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 font-bold tabular-nums text-red-700">
                      <Package className="h-4 w-4" />
                      {o.order_boxes} scatole
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
