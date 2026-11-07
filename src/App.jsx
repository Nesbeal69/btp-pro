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
  { id: 4, name: 'Lucas Morel', email: 'lucas@btppro.fr', role: 'ouvrier', team: 'Équipe Sanitaire', siteId: 2, status: 'pending', joinedAt: '2026-11-05' },
  { id: 5, name: 'Antoine Girard', email: 'antoine@btppro.fr', role: 'chef', team: 'Équipe Chauffage', siteId: null, status: 'pending', joinedAt: '2026-11-06' }
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

  // Données Firestore
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

  // Écoute en temps réel Firebase
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

  const handleValidateRequest = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "requests", firestoreId));
    } catch (error) {
      console.error("Erreur validation demande :", error);
    }
  };

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

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const found = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!found) {
      setAuthError('Adresse email introuvable.');
      return;
    }
    if (found.status === 'pending') {
      setAuthMode('pending');
      return;
    }
    setCurrentUser(found);
    setActiveTab('dashboard');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regName || !regEmail || !regPassword) {
      setAuthError('Veuillez remplir tous les champs.');
      return;
    }
    const newUser = {
      id: Date.now(),
      name: regName,
      email: regEmail,
      role: regRole,
      team: regRole === 'chef' ? 'Chef d\'équipe' : 'Ouvrier',
      siteId: null,
      status: 'pending',
      joinedAt: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, newUser]);
    setAuthMode('pending');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
  };

  const handleApproveAccount = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
  };

  const handleRejectAccount = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
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
            {authMode === 'pending' ? (
              <div className="text-center py-6 space-y-4">
                <Clock className="w-12 h-12 text-amber-400 mx-auto" />
                <h2 className="text-lg font-semibold text-amber-300">Compte en Attente de Validation</h2>
                <p className="text-xs text-slate-300">L'administrateur doit approuver votre compte.</p>
                <button onClick={() => setAuthMode('login')} className="w-full py-2 bg-slate-800 text-slate-200 text-xs rounded-xl">Retour</button>
              </div>
            ) : (
              <>
                <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${authMode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Connexion</button>
                  <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${authMode === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Inscription</button>
                </div>

                {authError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">{authError}</div>}

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@btppro.fr" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
                      <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 transition-colors font-semibold rounded-xl text-xs shadow-lg">Se Connecter</button>
                    <div className="pt-3 border-t border-slate-800 flex justify-center gap-2">
                      <button type="button" onClick={() => { setLoginEmail('admin@btppro.fr'); setLoginPassword('admin'); }} className="px-2 py-1 bg-slate-800 text-blue-400 text-[11px] rounded">Démo Admin</button>
                      <button type="button" onClick={() => { setLoginEmail('thomas@btppro.fr'); setLoginPassword('worker'); }} className="px-2 py-1 bg-slate-800 text-emerald-400 text-[11px] rounded">Démo Ouvrier</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nom complet</label>
                      <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
                      <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Rôle</label>
                      <select value={regRole} onChange={e => setRegRole(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                        <option value="ouvrier">Ouvrier / Plombier</option>
                        <option value="chef">Chef d'équipe</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 transition-colors font-semibold rounded-xl text-xs shadow-lg">S'inscrire</button>
                  </form>
                )}
              </>
            )}
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
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">{isAdmin ? 'ADMIN' : currentUser.role.toUpperCase()}</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Se déconnecter">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab !== 'dashboard' && (
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-all shadow-sm font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Retour au Tableau de bord
            </button>
          )}
          <span className="text-xs text-slate-400 font-medium">
            {activeTab === 'dashboard' ? '📊 Vue d\'ensemble de l\'activité' : `📂 Module : ${activeTab.toUpperCase()}`}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👋 Bienvenue sur ton espace, {currentUser.name}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Sélectionne un module ci-dessous pour gérer tes chantiers, plannings, matériel ou effectifs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div 
                onClick={() => setActiveTab('planning')}
                className="group bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-cyan-500/10 rounded-xl group-hover:scale-110 transition-transform">📅</span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[11px] font-bold rounded-full">{visiblePlans.length} dispo</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Planning</h3>
                  <p className="text-xs text-slate-400 mt-1">Consulter les plannings partagés.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('requests')}
                className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">📋</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-full">{requests.length} en attente</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">Demandes de Matériel</h3>
                  <p className="text-xs text-slate-400 mt-1">Validez les besoins en raccords, tubes et quincaillerie des équipes.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('workers')}
                className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">👷‍♂️</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full">{approvedUsers.length} actifs</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">Gestion des Effectifs</h3>
                  <p className="text-xs text-slate-400 mt-1">Suivi des équipes de plombiers, chauffagistes et chefs d'équipe.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('sites')}
                className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">🏗️</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[11px] font-bold rounded-full">{sites.length} chantiers</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">Chantiers & Résidences</h3>
                  <p className="text-xs text-slate-400 mt-1">Suivi des travaux de réhabilitation, adresses et chefs de chantier.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('tools')}
                className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">🔧</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-full">{equipment.length} machines</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">Parc Outillage</h3>
                  <p className="text-xs text-slate-400 mt-1">Suivi des sertisseuses, carotteuses et carnets d'entretien matériel.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {isAdmin && (
                <div 
                  onClick={() => setActiveTab('accounts')}
                  className="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl p-2.5 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">🛡️</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[11px] font-bold rounded-full">{pendingUsers.length} à valider</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">Validation des Comptes</h3>
                    <p className="text-xs text-slate-400 mt-1">Approuvez ou refusez les accès des nouveaux collaborateurs.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400">
                    <span>Accéder au module</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* --- MODULE CHANTIERS --- */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🏗️</span> Chantiers en cours</h2>
              {isAdmin && (
                <button onClick={() => setShowAddSiteModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow">
                  <Plus className="w-4 h-4" /> Nouveau Chantier
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <div key={site.firestoreId || site.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-white">{site.name}</h3>
                    {isAdmin && (
                      <button onClick={() => handleDeleteSite(site.firestoreId)} className="text-red-400 hover:text-red-300 text-xs p-1">🗑️</button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Client : {site.client}</p>
                  <p className="text-xs text-slate-400">Adresse : {site.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE OUTILLAGE --- */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🔧</span> Parc Outillage & Matériel</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="text"
                  value={toolSearch}
                  onChange={e => setToolSearch(e.target.value)}
                  placeholder="Rechercher (nom, ID, assigné...)"
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white w-full sm:w-64 focus:outline-none focus:border-indigo-500"
                />
                {isAdmin && (
                  <button onClick={() => setShowAddToolModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow shrink-0">
                    <Plus className="w-4 h-4" /> Ajouter une machine
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map(tool => (
                <div key={tool.firestoreId || tool.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-indigo-400 font-mono font-bold">{tool.id}</span>
                      <span className="text-slate-400">{tool.brand}</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">{tool.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Statut : <span className="text-emerald-400 font-medium">{tool.status}</span>
                    </div>
                    {tool.assignedTo && (
                      <div className="text-xs text-slate-500 mt-1">
                        Assigné à : <strong className="text-slate-300">{tool.assignedTo}</strong>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition-colors">
                      Carnet ({tool.notes?.length || 0})
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleOpenEditModal(tool)} className="px-2.5 py-1.5 bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 text-xs font-semibold rounded-lg transition-colors">
                          Modifier
                        </button>
                        <button onClick={() => handleDeleteTool(tool.firestoreId)} className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg transition-colors">
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE BESOINS --- */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>📋</span> Demandes de matériel</h2>
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.firestoreId || req.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-md">
                  <div>
                    <p className="text-sm font-bold text-white">{req.items}</p>
                    <p className="text-xs text-slate-400">Demandeur : {req.requester}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleValidateRequest(req.firestoreId)} className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg transition-colors">
                      Valider
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE EFFECTIFS --- */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>👷‍♂️</span> Équipes & Effectifs actifs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedUsers.map(user => (
                <div key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-white">{user.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 font-semibold rounded">{user.role}</span>
                  </div>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  <p className="text-xs text-slate-500">Équipe : {user.team}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE COMPTES (ADMIN) --- */}
        {activeTab === 'accounts' && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🛡️</span> Validation des comptes</h2>
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-md">
                  <div>
                    <p className="text-sm font-bold text-white">{user.name} ({user.email})</p>
                    <p className="text-xs text-slate-400">Rôle : {user.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveAccount(user.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors">Approuver</button>
                    <button onClick={() => handleRejectAccount(user.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg transition-colors">Refuser</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && (
                <p className="text-xs text-slate-400 italic">Aucun compte en attente de validation.</p>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE PLANNING --- */}
        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>📅</span> Plannings partagés</h2>
              {isAdmin && (
                <button onClick={() => setShowAddPlanModal(true)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow">
                  <Upload className="w-4 h-4" /> Publier Planning
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePlans.map(plan => (
                <div key={plan.firestoreId || plan.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md">
                  <div className="flex justify-between items-center text-xs text-cyan-400 font-bold">
                    <span>{plan.date}</span>
                    <span className="text-slate-400">Pour : {plan.targetName}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{plan.title}</div>
                  {isAdmin && (
                    <button onClick={() => handleDeletePlan(plan.firestoreId)} className="w-full py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs rounded-lg mt-2 transition-colors">
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALES --- */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSite} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Nouveau Chantier</h3>
            <input type="text" placeholder="Nom du chantier" value={newSiteData.name} onChange={e => setNewSiteData({...newSiteData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <input type="text" placeholder="Client" value={newSiteData.client} onChange={e => setNewSiteData({...newSiteData, client: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <input type="text" placeholder="Adresse" value={newSiteData.address} onChange={e => setNewSiteData({...newSiteData, address: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddSiteModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs text-white font-semibold rounded-xl">Créer</button>
            </div>
          </form>
        </div>
      )}

      {showAddToolModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Ajouter une machine</h3>
            <input type="text" placeholder="ID Machine (ex: REMS-03)" value={newToolData.id} onChange={e => setNewToolData({...newToolData, id: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <input type="text" placeholder="Nom de l'outil" value={newToolData.name} onChange={e => setNewToolData({...newToolData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs text-white font-semibold rounded-xl">Ajouter</button>
            </div>
          </form>
        </div>
      )}

      {editingTool && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveToolEdit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Modifier : {editingTool.name}</h3>
            <input type="text" placeholder="Assigné à" value={editToolForm.assignedTo} onChange={e => setEditToolForm({...editToolForm, assignedTo: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <select value={editToolForm.status} onChange={e => setEditToolForm({...editToolForm, status: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value="Disponible">Disponible</option>
              <option value="Sur chantier">Sur chantier</option>
              <option value="En révision">En révision</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingTool(null)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-amber-600 text-xs text-white font-semibold rounded-xl">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {selectedTool && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Carnet : {selectedTool.name}</h3>
              <button onClick={() => setSelectedTool(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedTool.notes?.length === 0 && <p className="text-xs text-slate-400 italic">Aucune note dans le carnet.</p>}
              {selectedTool.notes?.map(note => (
                <div key={note.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span className="font-bold text-indigo-300">{note.author}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-slate-200">{note.text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <input type="text" value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Ajouter une note..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
              <button onClick={() => handleAddNote(selectedTool)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold rounded-xl shadow">Ajouter au carnet</button>
            </div>
          </div>
        </div>
      )}

      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadPlan} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Publier un Planning</h3>
            <input type="text" placeholder="Titre" value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-xs text-white font-semibold rounded-xl">Publier</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}