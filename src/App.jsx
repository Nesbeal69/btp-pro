import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { 
  Building2, 
  Users, 
  Wrench, 
  ClipboardList, 
  UserCheck, 
  Plus, 
  X, 
  Clock, 
  MapPin, 
  LogOut,
  ChevronRight,
  ArrowLeft,
  Calendar,
  FileText,
  Upload
} from 'lucide-react';

const INITIAL_USERS = [
  { id: 1, name: 'Jean Dupont', email: 'admin@btppro.fr', role: 'admin', team: 'Direction', siteId: null, status: 'approved', joinedAt: '2024-01-10' },
  { id: 2, name: 'Marc Vasseur', email: 'marc@btppro.fr', role: 'chef', team: 'Équipe Chauffage', siteId: 1, status: 'approved', joinedAt: '2024-02-15' },
  { id: 3, name: 'Thomas Bernard', email: 'thomas@btppro.fr', role: 'ouvrier', team: 'Équipe Plomberie 1', siteId: 1, status: 'approved', joinedAt: '2024-03-01' },
  { id: 4, name: 'Lucas Morel', email: 'lucas@btppro.fr', role: 'ouvrier', team: 'Équipe Sanitaire', siteId: 2, status: 'pending', joinedAt: '2026-11-05' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toolSearch, setToolSearch] = useState('');

  const [editingTool, setEditingTool] = useState(null);
  const [editToolForm, setEditToolForm] = useState({ assignedTo: '', status: '' });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('ouvrier');
  const [authError, setAuthError] = useState('');

  // États alimentés directement par Firebase Firestore
  const [users, setUsers] = useState(INITIAL_USERS);
  const [sites, setSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedTool, setSelectedTool] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteData, setNewSiteData] = useState({ name: '', client: '', address: '', manager: 'Marc Vasseur' });
  
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [newToolData, setNewToolData] = useState({ id: '', name: '', brand: 'REMS', category: 'Sertissage', status: 'Disponible' });

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanTarget, setNewPlanTarget] = useState('all');

  // Synchronisation en temps réel Firebase pour TOUTES les collections
  useEffect(() => {
    const unsubEquipment = onSnapshot(collection(db, "equipment"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      setEquipment(items);
    });

    const unsubSites = onSnapshot(collection(db, "sites"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      setSites(items);
    });

    const unsubRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      setRequests(items);
    });

    const unsubPlans = onSnapshot(collection(db, "plans"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      setPlans(items);
    });

    return () => {
      unsubEquipment();
      unsubSites();
      unsubRequests();
      unsubPlans();
    };
  }, []);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(tool => {
      const query = toolSearch.toLowerCase().trim();
      return (
        tool.name?.toLowerCase().includes(query) ||
        tool.id?.toLowerCase().includes(query) ||
        tool.brand?.toLowerCase().includes(query) ||
        (tool.assignedTo && tool.assignedTo.toLowerCase().includes(query))
      );
    });
  }, [equipment, toolSearch]);

  // --- ACTIONS CHANTIERS (FIRESTORE) ---
  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!newSiteData.name) return;
    try {
      await addDoc(collection(db, "sites"), {
        name: newSiteData.name,
        client: newSiteData.client || 'Client Privé',
        address: newSiteData.address || 'Adresse à préciser',
        status: 'En cours',
        manager: newSiteData.manager,
        workersCount: 0
      });
      setShowAddSiteModal(false);
      setNewSiteData({ name: '', client: '', address: '', manager: 'Marc Vasseur' });
    } catch (error) {
      console.error("Erreur ajout chantier :", error);
    }
  };

  const handleDeleteSite = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "sites", firestoreId));
    } catch (error) {
      console.error("Erreur suppression chantier :", error);
    }
  };

  // --- ACTIONS OUTILLAGE (FIRESTORE) ---
  const handleCreateTool = async (e) => {
    e.preventDefault();
    if (!newToolData.name || !newToolData.id) return;
    try {
      await addDoc(collection(db, "equipment"), {
        ...newToolData,
        assignedTo: 'Dépôt Central',
        notes: []
      });
      setShowAddToolModal(false);
      setNewToolData({ id: '', name: '', brand: 'REMS', category: 'Sertissage', status: 'Disponible' });
    } catch (error) {
      console.error("Erreur ajout outil :", error);
    }
  };

  const handleDeleteTool = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "equipment", firestoreId));
    } catch (error) {
      console.error("Erreur suppression outil :", error);
    }
  };

  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setEditToolForm({
      assignedTo: tool.assignedTo || '',
      status: tool.status || 'Disponible'
    });
  };

  const handleSaveToolEdit = async (e) => {
    e.preventDefault();
    if (!editingTool || !editingTool.firestoreId) return;
    try {
      const toolRef = doc(db, "equipment", editingTool.firestoreId);
      await updateDoc(toolRef, {
        assignedTo: editToolForm.assignedTo,
        status: editToolForm.status
      });
      setEditingTool(null);
    } catch (error) {
      console.error("Erreur modification outil :", error);
    }
  };

  const handleAddNote = async (tool) => {
    if (!newNoteText.trim() || !currentUser || !tool.firestoreId) return;
    const noteObj = {
      id: Date.now(),
      author: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      text: newNoteText
    };
    try {
      const toolRef = doc(db, "equipment", tool.firestoreId);
      const updatedNotes = [noteObj, ...(tool.notes || [])];
      await updateDoc(toolRef, { notes: updatedNotes });
      setNewNoteText('');
      setSelectedTool(prev => ({ ...prev, notes: updatedNotes }));
    } catch (error) {
      console.error("Erreur ajout note :", error);
    }
  };

  // --- ACTIONS BESOINS / COMMANDES (FIRESTORE) ---
  const handleValidateRequest = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "requests", firestoreId));
    } catch (error) {
      console.error("Erreur validation demande :", error);
    }
  };

  // --- ACTIONS PLANNINGS (FIRESTORE) ---
  const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!newPlanTitle) return;

    let targetName = 'Toute l’équipe';
    if (newPlanTarget !== 'all') {
      const foundUser = users.find(u => u.id === Number(newPlanTarget));
      if (foundUser) targetName = foundUser.name;
    }

    try {
      await addDoc(collection(db, "plans"), {
        title: newPlanTitle,
        fileName: 'Planning_Equipe.pdf',
        targetUserId: newPlanTarget === 'all' ? 'all' : Number(newPlanTarget),
        targetName: targetName,
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddPlanModal(false);
      setNewPlanTitle('');
      setNewPlanTarget('all');
    } catch (error) {
      console.error("Erreur ajout planning :", error);
    }
  };

  const handleDeletePlan = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "plans", firestoreId));
    } catch (error) {
      console.error("Erreur suppression planning :", error);
    }
  };

  // Auth & Rôles
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const found = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!found) {
      setCurrentUser({ name: 'Mohamed (Admin)', role: 'admin', email: loginEmail });
    } else {
      setCurrentUser(found);
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved'), [users]);
  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return plans;
    return plans.filter(p => p.targetUserId === 'all' || p.targetUserId === currentUser.id);
  }, [plans, currentUser]);

  const isAdmin = currentUser?.role === 'admin';

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-center">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-3">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">BÂTIR+</h1>
            <p className="text-xs text-blue-200 mt-1">Plateforme Chantiers, Matériel & Équipes</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email professionnel</label>
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@btppro.fr" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
                <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 transition-colors font-semibold rounded-xl text-xs shadow-lg">Se Connecter</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <Building2 className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm text-white tracking-wide">BÂTIR+</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="font-bold text-white">{currentUser.name}</span>
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">{isAdmin ? 'ADMIN' : 'CHEF'}</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab !== 'dashboard' && (
            <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Tableau de bord
            </button>
          )}
          <span className="text-xs text-slate-400 font-medium">
            {activeTab === 'dashboard' ? '📊 Vue globale' : `📂 ${activeTab.toUpperCase()}`}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div onClick={() => setActiveTab('planning')} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl cursor-pointer">
              <span className="text-3xl">📅</span>
              <h3 className="text-base font-bold text-white mt-2">Plannings</h3>
              <p className="text-xs text-slate-400">{plans.length} partagés</p>
            </div>

            <div onClick={() => setActiveTab('sites')} className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl cursor-pointer">
              <span className="text-3xl">🏗️</span>
              <h3 className="text-base font-bold text-white mt-2">Chantiers</h3>
              <p className="text-xs text-slate-400">{sites.length} enregistrés</p>
            </div>

            <div onClick={() => setActiveTab('tools')} className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl cursor-pointer">
              <span className="text-3xl">🔧</span>
              <h3 className="text-base font-bold text-white mt-2">Outillage</h3>
              <p className="text-xs text-slate-400">{equipment.length} machines</p>
            </div>

            <div onClick={() => setActiveTab('requests')} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl cursor-pointer">
              <span className="text-3xl">📋</span>
              <h3 className="text-base font-bold text-white mt-2">Commandes</h3>
              <p className="text-xs text-slate-400">{requests.length} en attente</p>
            </div>
          </div>
        )}

        {/* --- MODULE CHANTIERS --- */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Chantiers (Synchronisés)</h2>
              <button onClick={() => setShowAddSiteModal(true)} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1">
                <Plus className="w-4 h-4" /> Ajouter Chantier
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <div key={site.firestoreId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-white">{site.name}</h3>
                    <button onClick={() => handleDeleteSite(site.firestoreId)} className="text-red-400 text-xs">🗑️</button>
                  </div>
                  <p className="text-xs text-slate-400">Client : {site.client}</p>
                  <p className="text-xs text-slate-400">Adresse : {site.address}</p>
                </div>
              ))}
              {sites.length === 0 && <p className="text-xs text-slate-500 italic">Aucun chantier enregistré dans Firebase.</p>}
            </div>
          </div>
        )}

        {/* --- MODULE OUTILLAGE --- */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-bold text-white">Parc Outillage (Synchronisé)</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="text" value={toolSearch} onChange={e => setToolSearch(e.target.value)} placeholder="Rechercher..." className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                <button onClick={() => setShowAddToolModal(true)} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0">
                  <Plus className="w-4 h-4" /> Machine
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredEquipment.map(tool => (
                <div key={tool.firestoreId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-indigo-400 font-mono font-bold">{tool.id}</span>
                      <span className="text-slate-400">{tool.brand}</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{tool.name}</div>
                    <div className="text-xs text-slate-400 mt-1">Statut : <span className="text-emerald-400">{tool.status}</span></div>
                    {tool.assignedTo && <div className="text-xs text-slate-500 mt-1">Assigné : <strong>{tool.assignedTo}</strong></div>}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-1 bg-slate-800 text-xs text-slate-200 rounded-lg">Notes ({tool.notes?.length || 0})</button>
                    <button onClick={() => handleOpenEditModal(tool)} className="px-2 py-1 bg-amber-600/30 text-amber-300 text-xs rounded-lg">✏️</button>
                    <button onClick={() => handleDeleteTool(tool.firestoreId)} className="px-2 py-1 bg-red-600/20 text-red-300 text-xs rounded-lg">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE COMMANDES --- */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Demandes de matériel</h2>
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.firestoreId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{req.items}</p>
                    <p className="text-xs text-slate-400">Demandeur : {req.requester}</p>
                  </div>
                  <button onClick={() => handleValidateRequest(req.firestoreId)} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 text-xs font-semibold rounded-lg">Valider / Archiver</button>
                </div>
              ))}
              {requests.length === 0 && <p className="text-xs text-slate-500 italic">Aucune commande en attente.</p>}
            </div>
          </div>
        )}

        {/* --- MODULE PLANNINGS --- */}
        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Plannings & PDF</h2>
              <button onClick={() => setShowAddPlanModal(true)} className="px-3 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1">
                <Upload className="w-4 h-4" /> Publier Planning
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visiblePlans.map(plan => (
                <div key={plan.firestoreId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-cyan-400 font-bold">
                    <span>{plan.date}</span>
                    <span className="text-slate-400">Pour : {plan.targetName}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{plan.title}</div>
                  <button onClick={() => handleDeletePlan(plan.firestoreId)} className="w-full py-1 bg-red-600/20 text-red-300 text-xs rounded-lg mt-2">Supprimer</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALES */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSite} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Créer Chantier</h3>
            <input type="text" placeholder="Nom du chantier" value={newSiteData.name} onChange={e => setNewSiteData({...newSiteData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <input type="text" placeholder="Adresse" value={newSiteData.address} onChange={e => setNewSiteData({...newSiteData, address: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddSiteModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs text-white rounded-xl">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {showAddToolModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Ajouter Outil</h3>
            <input type="text" placeholder="ID (ex: REMS-05)" value={newToolData.id} onChange={e => setNewToolData({...newToolData, id: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <input type="text" placeholder="Nom de l'outil" value={newToolData.name} onChange={e => setNewToolData({...newToolData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs text-white rounded-xl">Ajouter</button>
            </div>
          </form>
        </div>
      )}

      {editingTool && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveToolEdit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Modifier Outil</h3>
            <input type="text" placeholder="Assigné à" value={editToolForm.assignedTo} onChange={e => setEditToolForm({...editToolForm, assignedTo: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <select value={editToolForm.status} onChange={e => setEditToolForm({...editToolForm, status: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
              <option value="Disponible">Disponible</option>
              <option value="Sur chantier">Sur chantier</option>
              <option value="En révision">En révision</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingTool(null)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-amber-600 text-xs text-white rounded-xl">Sauvegarder</button>
            </div>
          </form>
        </div>
      )}

      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadPlan} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Publier un Planning</h3>
            <input type="text" placeholder="Titre du planning" value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-xs text-white rounded-xl">Publier</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}