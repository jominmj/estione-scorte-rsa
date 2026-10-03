import { AlertTriangle, Package } from 'lucide-react';
import type { Medication } from '@/lib/supabase';
import { totalQty } from '@/lib/supabase';

const SAFETY_THRESHOLD = 5;

type Props = {
  medications: Medication[];
};

type OrderRow = {
  active_ingredient: string;
  dosage: string;
  commercial_name: string;
  current_boxes: number;
  needed_units: number;
  pack_size: number;
  order_boxes: number;
};

/**
 * Raggruppa i farmaci in allerta per Principio Attivo + Dosaggio,
 * calcola il fabbisogno mensile in unita e lo converte in scatole intere
 * arrotondando per eccesso.
 */
function computeOrders(medications: Medication[]): OrderRow[] {
  const lowStock = medications.filter((m) => totalQty(m) <= SAFETY_THRESHOLD);

  const grouped = new Map<string, {
    active_ingredient: string;
    dosage: string;
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
        commercial_name: m.commercial_name,
        current_boxes: totalQty(m),
        pack_size: m.pack_size || 1,
      });
    }
  }

  return Array.from(grouped.values()).map((g) => {
    const packSize = g.pack_size || 1;
    // Fabbisogno mensile: 30 giorni di terapia (approssimato a scatole)
    const neededUnits = packSize * 30;
    // Scatole necessarie = fabbisogno totale / pezzi per scatola, arrotondato per eccesso
    const totalBoxesNeeded = Math.ceil((neededUnits + g.current_boxes * packSize) / packSize);
    const orderBoxes = Math.max(0, totalBoxesNeeded - g.current_boxes);

    return {
      active_ingredient: g.active_ingredient,
      dosage: g.dosage,
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

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Lista Generazione Ordini</h2>
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <span className="text-2xl">{'\u2713'}</span>
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Lista Generazione Ordini</h2>
        <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
          {orders.length} farmaci da ordinare
        </span>
      </div>

      <div className="card p-4 flex items-start gap-3 border-amber-200 bg-amber-50/50">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          I farmaci con Totale Generale uguale o inferiore a 5 confezioni sono automaticamente inseriti in questa lista.
          La quantita da ordinare e calcolata in scatole intere: il fabbisogno mensile di unita
          viene diviso per i pezzi contenuti in ogni scatola e arrotondato per eccesso.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Principio Attivo</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Dosaggio</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Nome Commerciale</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Giacenza (scatole)</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Pezzi/Scatola</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Ordinare</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 bg-amber-50/30">
                  <td className="px-4 py-3 font-medium text-slate-800">{o.active_ingredient}</td>
                  <td className="px-4 py-3 text-slate-600">{o.dosage || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{o.commercial_name || '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold tabular-nums text-amber-700">{o.current_boxes}</td>
                  <td className="px-4 py-3 text-center text-slate-500 tabular-nums">{o.pack_size}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 font-bold tabular-nums text-red-700">
                      <Package className="h-4 w-4" />
                      {o.order_boxes} Confezioni
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
