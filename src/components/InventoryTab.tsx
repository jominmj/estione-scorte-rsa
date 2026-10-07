import { useState, useRef, useEffect, useMemo } from 'react';
import { Minus, Plus, Trash2, X, EyeOff, Eye, AlertCircle, Camera } from 'lucide-react';
import {
  type Medication,
  type MedicationInsert,
  type ItemType,
  ITEM_TYPES,
  totalQty,
} from '@/lib/supabase';
import ScannerModal from '@/components/ScannerModal';

const SAFETY_THRESHOLD = 5;

type Props = {
  title: string;
  medications: Medication[];
  category: 'farmaco' | 'presidio';
  onAdd: (med: MedicationInsert) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Medication>) => Promise<void>;
};

export default function InventoryTab({ title, medications, category, onAdd, onDelete, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [ai, setAi] = useState('');
  const [dos, setDos] = useState('');
  const [type, setType] = useState<ItemType>(category === 'presidio' ? 'Presidio' : 'Compresse');
  const [cn, setCn] = useState('');
  const [pack, setPack] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [confirmEditId, setConfirmEditId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medications.filter((m) => {
      if (m.category !== category) return false;
      if (m.hidden && !showHidden) return false;
      if (!q) return true;
      return (
        m.active_ingredient.toLowerCase().includes(q) ||
        m.dosage.toLowerCase().includes(q) ||
        m.commercial_name.toLowerCase().includes(q) ||
        m.item_type.toLowerCase().includes(q)
      );
    });
  }, [medications, category, search, showHidden]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ai.trim()) return;
    setSaving(true);
    await onAdd({
      active_ingredient: ai.trim(),
      dosage: dos.trim(),
      item_type: type,
      commercial_name: cn.trim(),
      pack_size: pack,
      qty_pt: 0,
      qty_1: 0,
      qty_2: 0,
      qty_3: 0,
      category,
    });
    setSaving(false);
    setAi('');
    setDos('');
    setType(category === 'presidio' ? 'Presidio' : 'Compresse');
    setCn('');
    setPack(1);
    setShowForm(false);
  };

  const handleScannerConfirm = (name: string) => {
    setSearch(name);
  };

  const nameCol = category === 'farmaco' ? 'Principio Attivo' : 'Nome Presidio';
  const dosCol = category === 'farmaco' ? 'Dosaggio' : 'Formato';

  return (
    <div className="space-y-4">
      {/* Sticky search bar + scanner + toggles */}
      <div className="sticky top-[105px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
              placeholder="Cerca per nome, dosaggio, tipo..."
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {category === 'farmaco' && (
            <button
              onClick={() => setScannerOpen(true)}
              className="btn-secondary whitespace-nowrap"
              title="Scanner farmaco"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
          )}
          <button
            onClick={() => setShowHidden((v) => !v)}
            className={`btn-secondary whitespace-nowrap ${showHidden ? '!bg-teal-50 !border-teal-300 !text-teal-700' : ''}`}
          >
            {showHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="hidden sm:inline">{showHidden ? 'Nascosti visibili' : 'Mostra nascosti'}</span>
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Aggiungi</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{filtered.length} voci</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-slate-500">Nessuna voce trovata.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Dual-scroll container: max-height with both vertical and horizontal scroll */}
          <div
            className="overflow-auto"
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap min-w-[140px]">{nameCol}</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap min-w-[90px]">{dosCol}</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap min-w-[100px]">Tipo</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap min-w-[140px]">Nome Commerciale</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap min-w-[60px]">PT</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap min-w-[60px]">1</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap min-w-[60px]">2</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap min-w-[60px]">3</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap min-w-[60px]">TOT</th>
                  <th className="px-3 py-3 font-semibold text-slate-600 text-center whitespace-nowrap min-w-[100px]">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((med) => {
                  const total = totalQty(med);
                  const isLow = total <= SAFETY_THRESHOLD;
                  const isConfirming = deleteId === med.id;
                  const isConfirmEdit = confirmEditId === med.id;
                  return (
                    <tr
                      key={med.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors ${
                        med.hidden ? 'opacity-50' : ''
                      } ${isLow ? 'bg-amber-100' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-3 py-2">
                        <ProtectedEditableText
                          value={med.active_ingredient}
                          onSave={(v) => onUpdate(med.id, { active_ingredient: v })}
                          confirmPrompt="Vuoi modificare il Principio Attivo?"
                          showConfirm={isConfirmEdit}
                          onRequestConfirm={() => setConfirmEditId(med.id)}
                          onCancelConfirm={() => setConfirmEditId(null)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableText
                          value={med.dosage}
                          onSave={(v) => onUpdate(med.id, { dosage: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableType
                          value={med.item_type}
                          onSave={(v) => onUpdate(med.id, { item_type: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableText
                          value={med.commercial_name}
                          onSave={(v) => onUpdate(med.id, { commercial_name: v })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty value={med.qty_pt} onSave={(v) => onUpdate(med.id, { qty_pt: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty value={med.qty_1} onSave={(v) => onUpdate(med.id, { qty_1: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty value={med.qty_2} onSave={(v) => onUpdate(med.id, { qty_2: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <EditableQty value={med.qty_3} onSave={(v) => onUpdate(med.id, { qty_3: v })} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-base font-bold tabular-nums ${isLow ? 'text-amber-700' : 'text-slate-900'}`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-3 py-2">
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onUpdate(med.id, { hidden: !med.hidden })}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                med.hidden
                                  ? 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                              title={med.hidden ? 'Mostra' : 'Nascondi'}
                            >
                              {med.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteId(med.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                              title="Elimina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
              <h2 className="text-lg font-bold text-slate-900">Nuova voce</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">{nameCol} *</label>
                <input
                  type="text"
                  value={ai}
                  onChange={(e) => setAi(e.target.value)}
                  className="input"
                  placeholder={category === 'farmaco' ? 'es. Paracetamolo' : 'es. Mascherine ossigeno'}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">{dosCol}</label>
                <input
                  type="text"
                  value={dos}
                  onChange={(e) => setDos(e.target.value)}
                  className="input"
                  placeholder={category === 'farmaco' ? 'es. 500mg' : 'es. Adulti'}
                />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select
  value={type}
  onChange={(e) => setType(e.target.value as ItemType)}
  className="input"
>
  <option value="Compresse">Compresse</option>
  <option value="Collirio">Collirio</option>
  <option value="Cerotti">Cerotti</option>
  <option value="Puff">Puff</option>
  <option value="Sciroppo">Sciroppo</option>
  <option value="Gocce">Gocce</option>
  <option value="Fiale">Fiale</option>
  <option value="Crema">Crema</option>
  <option value="Presidio">Presidio</option>
  <option value="Bustine">Bustine</option>
  <option value="Flacone">Flacone</option>
  <option value="Compresse effervescenti">Compresse effervescenti</option>
  <option value="Flaconi monodose">Flaconi monodose</option>
  <option value="Altro">Altro</option>
</select>

                </select>
              </div>
              <div>
                <label className="label">Nome Commerciale (facoltativo, separa piu nomi con la virgola)</label>
                <input
                  type="text"
                  value={cn}
                  onChange={(e) => setCn(e.target.value)}
                  className="input"
                  placeholder="es. Cardioaspirin, Aspirinetta"
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

      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleScannerConfirm}
      />
    </div>
  );
}

function ProtectedEditableText({
  value,
  onSave,
  confirmPrompt,
  showConfirm,
  onRequestConfirm,
  onCancelConfirm,
}: {
  value: string;
  onSave: (v: string) => void;
  confirmPrompt: string;
  showConfirm: boolean;
  onRequestConfirm: () => void;
  onCancelConfirm: () => void;
}) {
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

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <span className="text-xs text-slate-600 mr-1">{confirmPrompt}</span>
        <button
          onClick={() => {
            setTemp(value);
            setEditing(true);
            onCancelConfirm();
          }}
          className="rounded-lg bg-teal-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-teal-700"
        >
          Si
        </button>
        <button
          onClick={onCancelConfirm}
          className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={onRequestConfirm}
      className="block cursor-pointer rounded px-2 py-1 text-slate-800 hover:bg-teal-50 whitespace-nowrap"
    >
      {value || <span className="text-slate-300 italic">—</span>}
    </span>
  );
}

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

function EditableType({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) selectRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => {
          onSave(e.target.value);
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        className="w-full rounded-lg border border-teal-400 px-2 py-1 text-sm outline-none ring-2 ring-teal-100 bg-white"
      >
        {ITEM_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="block cursor-pointer rounded px-2 py-1 text-slate-700 hover:bg-teal-50 whitespace-nowrap text-xs font-medium"
    >
      {value}
    </span>
  );
}

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
