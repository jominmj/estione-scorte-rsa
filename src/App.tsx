import { useCallback, useEffect, useState } from 'react';
import { Package, Warehouse, ShoppingCart, RefreshCw } from 'lucide-react';
import { supabase, type Medication, type MedicationInsert, totalQty } from '@/lib/supabase';
import MagazzinoTab from '@/components/MagazzinoTab';
import OrdiniTab from '@/components/OrdiniTab';

type Tab = 'magazzino' | 'ordini';

export default function App() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('magazzino');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedications = useCallback(async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('active_ingredient', { ascending: true });

    if (error) {
      setError('Errore nel caricamento dei dati.');
      return;
    }
    setMedications((data as Medication[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMedications();
      setLoading(false);
    })();
  }, [fetchMedications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedications();
    setRefreshing(false);
  };

  const handleAdd = async (med: MedicationInsert) => {
    const { error } = await supabase.from('medications').insert(med);
    if (error) {
      setError("Errore durante l'aggiunta.");
      return;
    }
    await fetchMedications();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) {
      setError("Errore durante l'eliminazione.");
      return;
    }
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdate = async (id: string, updates: Partial<Medication>) => {
    const { error } = await supabase
      .from('medications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      setError("Errore durante l'aggiornamento.");
      return;
    }
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const lowStockCount = medications.filter((m) => totalQty(m) <= 5).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'magazzino', label: 'Magazzino', icon: <Warehouse className="h-4 w-4" /> },
    { id: 'ordini', label: 'Ordini', icon: <ShoppingCart className="h-4 w-4" />, badge: lowStockCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Gestione Scorte RSA
                </h1>
                <p className="text-xs text-slate-500">Le Residenze — Gestione condivisa</p>
              </div>
            </div>
            <button onClick={handleRefresh} className="btn-secondary !p-2.5" title="Aggiorna">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-sm">
              Chiudi
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === 'magazzino' && (
              <MagazzinoTab
                medications={medications}
                onAdd={handleAdd}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            )}
            {activeTab === 'ordini' && <OrdiniTab medications={medications} />}
          </>
        )}
      </main>
    </div>
  );
}
