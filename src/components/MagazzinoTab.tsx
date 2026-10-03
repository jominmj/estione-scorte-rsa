import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { type Medication, type MedicationInsert, totalQty } from '@/lib/supabase';

const SAFETY_THRESHOLD = 5;

type Props = {
  medications: Medication[];
  onAdd: (med: MedicationInsert) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Medication>) => Promise<void>;
};

export default function MagazzinoTab({ medications, onAdd, onDelete, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [ai, setAi] = useState('');
  const [dos, setDos] = useState('');
  const [cn, setCn] = useState('');
  const [pack, setPack] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ai.trim()) return;
    setSaving(true);
    await onAdd({
      active_ingredient: ai.trim(),
      dosage: dos.trim(),
      commercial_name: cn.trim(),
      pack_size: pack,
      qty_pt: 0,
      qty_1: 0,
      qty_2: 0,
      qty_3: 0,
    });
    setSaving(false);
    setAi('');
    setDos('');
    setCn('');
    setPack(1);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Magazzino Generale</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Aggiungi farmaco</span>
        </button>
      </div>

      {medications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-slate-500">
            Nessun farmaco in magazzino. Clicca "Aggiungi farmaco" per iniziare.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Principio Attivo</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Dosaggio</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Nome Commerciale</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">PT</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">1</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">2</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">3</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">TOT</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => {
                  const total = totalQty(med);
                  const isLow = total <= SAFETY_THRESHOLD;
                  const isConfirming = deleteId === med.id;
                  return (
                    <tr
                      key={med.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors ${
                        isLow ? 'bg-amber-100' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <EditableText
                          value={med.active_ingredient}
                          onSave={(v) => onUpdate(med.id, { active_ingredient: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableText
                          value={med.dosage}
                          onSave={(v) => onUpdate(med.id, { dosage: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableText
                          value={med.commercial_name}
                          onSave={(v) => onUpdate(med.id, { commercial_name: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty
                          value={med.qty_pt}
                          onSave={(v) => onUpdate(med.id, { qty_pt: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty
                          value={med.qty_1}
                          onSave={(v) => onUpdate(med.id, { qty_1: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty
                          value={med.qty_2}
                          onSave={(v) => onUpdate(med.id, { qty_2: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty
                          value={med.qty_3}
                          onSave={(v) => onUpdate(med.id, { qty_3: v })}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-base font-bold tabular-nums ${isLow ? 'text-amber-700' : 'text-slate-900'}`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isConfirming ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { onDelete(med.id); setDeleteId(null); }}
                              className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Si
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(med.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 mx-auto"
                            title="Elimina"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-200 border border-amber-300" />
          Allerta: Totale minore o uguale a 5 confezioni
        </span>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-6 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Nuovo farmaco</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">Principio Attivo *</label>
                <input
                  type="text"
                  value={ai}
                  onChange={(e) => setAi(e.target.value)}
                  className="input"
                  placeholder="es. Paracetamolo"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Dosaggio</label>
                <input
                  type="text"
                  value={dos}
                  onChange={(e) => setDos(e.target.value)}
                  className="input"
                  placeholder="es. 500mg"
                />
              </div>
              <div>
                <label className="label">Nome Commerciale</label>
                <input
                  type="text"
                  value={cn}
                  onChange={(e) => setCn(e.target.value)}
                  className="input"
                  placeholder="es. Tachipirina (facoltativo)"
                />
              </div>
              <div>
                <label className="label">Pezzi per Scatola</label>
                <input
                  type="number"
                  min="1"
                  value={pack}
                  onChange={(e) => setPack(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input"
                  placeholder="es. 28"
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Salvataggio...' : 'Aggiungi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline editable text cell
function EditableText({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => {
          if (temp.trim() !== value) onSave(temp.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (temp.trim() !== value) onSave(temp.trim());
            setEditing(false);
          }
          if (e.key === 'Escape') {
            setTemp(value);
            setEditing(false);
          }
        }}
        className="w-full rounded-lg border border-teal-400 px-2 py-1 text-sm outline-none ring-2 ring-teal-100"
      />
    );
  }

  return (
    <span
      onClick={() => { setTemp(value); setEditing(true); }}
      className="block cursor-text rounded px-2 py-1 text-slate-800 hover:bg-teal-50 whitespace-nowrap"
    >
      {value || <span className="text-slate-300 italic">—</span>}
    </span>
  );
}

// Inline editable quantity cell with +/- buttons
function EditableQty({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = (v: number) => {
    if (v < 0) v = 0;
    if (v !== value) onSave(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => commit(Math.max(0, value - 1))}
          className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-orange-600 hover:bg-orange-200"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          onBlur={() => commit(parseInt(temp) || 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(parseInt(temp) || 0);
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-12 rounded-lg border border-teal-400 px-1 py-0.5 text-center text-sm outline-none ring-2 ring-teal-100"
        />
        <button
          onClick={() => commit(value + 1)}
          className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={() => { setTemp(String(value)); setEditing(true); }}
      className="block cursor-pointer rounded px-2 py-1 text-center font-semibold tabular-nums text-slate-800 hover:bg-teal-50"
    >
      {value}
    </span>
  );
}
