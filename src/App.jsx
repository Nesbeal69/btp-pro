import React, { useState, useMemo } from 'react';
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

const INITIAL_SITES = [
  { id: 1, name: 'Résidence Les Olives (Apt 42)', client: 'Nexity', address: '14 Av. de la Gare, Avignon', status: 'En cours', manager: 'Marc Vasseur', workersCount: 6 },
  { id: 2, name: 'Centre Médical Saint-Roch', client: 'Ville de Cavaillon', address: '8 Rue des Écoles, Cavaillon', status: 'En cours', manager: 'Kévin Roux', workersCount: 5 },
  { id: 3, name: 'Villa Moderne Pertuis', client: 'Particulier (M. Dupuis)', address: 'Chemin des Vignes, Pertuis', status: 'En attente', manager: 'Non assigné', workersCount: 3 }
];

const INITIAL_EQUIPMENT = [
  { 
    id: 'OUT-101', 
    name: 'Sertisseuse Électro-Hydraulique Akku-Press', 
    brand: 'REMS', 
    category: 'Sertissage', 
    status: 'Sur chantier', 
    assignedTo: 'Thomas Bernard', 
    serialNumber: 'SN-99482-B',
    notes: [
      { id: 1, author: 'Jean Dupont', date: '2026-10-14', text: 'Révision annuelle effectuée.' }
    ]
  },
  { 
    id: 'OUT-102', 
    name: 'Carotteuse Diamant Picus SR', 
    brand: 'REMS', 
    category: 'Perçage', 
    status: 'Disponible', 
    assignedTo: 'Dépôt Central', 
    serialNumber: 'SN-88210-C',
    notes: []
  }
];

const INITIAL_REQUESTS = [
  { id: 'REQ-01', siteId: 1, requester: 'Thomas Bernard', items: '2x Raccords sertir Ø32, 1x Tube PER 50m Ø20', status: 'Urgent', timeAgo: 'Il y a 30 min' },
  { id: 'REQ-02', siteId: 2, requester: 'Kévin Roux', items: '10x Cartouches Mastic Visserie inox Ø8', status: 'En attente', timeAgo: 'Il y a 2h' }
];

const INITIAL_PLANS = [
  { id: 1, title: 'Planning Semaine 46 - Chauffage', fileName: 'Planning_S46_Chauffage.pdf', targetUserId: 'all', targetName: 'Toute l’équipe', date: '2026-11-06' },
  { id: 2, title: 'Feuille de route - Thomas Bernard', fileName: 'Route_Thomas_Olives.pdf', targetUserId: 3, targetName: 'Thomas Bernard', date: '2026-11-06' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [editingTool, setEditingTool] = useState(null);
  const [editToolForm, setEditToolForm] = useState({ assignedTo: '', status: '' });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('ouvrier');
  const [authError, setAuthError] = useState('');

  const [users, setUsers] = useState(INITIAL_USERS);
  const [sites, setSites] = useState(INITIAL_SITES);
  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [plans, setPlans] = useState(INITIAL_PLANS);

  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setEditToolForm({
      assignedTo: tool.assignedTo || '',
      status: tool.status || 'Disponible'
    });
  };

  const handleDeleteTool = (toolId) => {
    setEquipment(equipment.filter(t => t.id !== toolId));
  };

  const handleSaveToolEdit = (e) => {
    e.preventDefault();
    if (!editingTool) return;

    const changes = [];
    if (editToolForm.assignedTo !== editingTool.assignedTo) {
      changes.push(`Affecté à : "${editingTool.assignedTo}" → "${editToolForm.assignedTo}"`);
    }
    if (editToolForm.status !== editingTool.status) {
      changes.push(`Statut : "${editingTool.status}" → "${editToolForm.status}"`);
    }

    if (changes.length === 0) {
      setEditingTool(null);
      return;
    }

    const autoHistoryNote = {
      id: Date.now(),
      author: currentUser ? currentUser.name : 'Système',
      date: new Date().toISOString().split('T')[0],
      text: `✏️ Modification : ${changes.join(' | ')}`
    };

    const updatedEquipment = equipment.map(t => {
      if (t.id === editingTool.id) {
        return {
          ...t,
          assignedTo: editToolForm.assignedTo,
          status: editToolForm.status,
          notes: [autoHistoryNote, ...(t.notes || [])]
        };
      }
      return t;
    });

    setEquipment(updatedEquipment);
    setEditingTool(null);
  };

  const [selectedTool, setSelectedTool] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteData, setNewSiteData] = useState({ name: '', client: '', address: '', manager: 'Marc Vasseur' });
  
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [newToolData, setNewToolData] = useState({ id: '', name: '', brand: 'REMS', category: 'Sertissage', status: 'Disponible' });

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanTarget, setNewPlanTarget] = useState('all');
  const [newPlanFile, setNewPlanFile] = useState(null);

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

  const handleCreateSite = (e) => {
    e.preventDefault();
    if (!newSiteData.name) return;
    const created = {
      id: Date.now(),
      name: newSiteData.name,
      client: newSiteData.client || 'Client Privé',
      address: newSiteData.address || 'Adresse à préciser',
      status: 'En cours',
      manager: newSiteData.manager,
      workersCount: 0
    };
    setSites([...sites, created]);
    setShowAddSiteModal(false);
    setNewSiteData({ name: '', client: '', address: '', manager: 'Marc Vasseur' });
  };

  const handleDeleteSite = (siteId) => {
    setSites(sites.filter(s => s.id !== siteId));
  };

  const handleCreateTool = (e) => {
    e.preventDefault();
    if (!newToolData.name || !newToolData.id) return;
    const createdTool = {
      ...newToolData,
      assignedTo: 'Dépôt Central',
      notes: []
    };
    setEquipment([...equipment, createdTool]);
    setShowAddToolModal(false);
    setNewToolData({ id: '', name: '', brand: 'REMS', category: 'Sertissage', status: 'Disponible' });
  };
  const handleAddNote = (toolId) => {
    if (!newNoteText.trim() || !currentUser) return;
    const noteObj = {
      id: Date.now(),
      author: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      text: newNoteText
    };
    setEquipment(equipment.map(t => t.id === toolId ? { ...t, notes: [noteObj, ...(t.notes || [])] } : t));
    if (selectedTool && selectedTool.id === toolId) {
      setSelectedTool(prev => ({ ...prev, notes: [noteObj, ...(prev.notes || [])] }));
    }
    setNewNoteText('');
  };

  const handleValidateRequest = (reqId) => {
    setRequests(requests.filter(r => r.id !== reqId));
  };

  const handleUploadPlan = (e) => {
    e.preventDefault();
    if (!newPlanTitle) return;

    let targetName = 'Toute l’équipe';
    if (newPlanTarget !== 'all') {
      const foundUser = users.find(u => u.id === Number(newPlanTarget));
      if (foundUser) targetName = foundUser.name;
    }

    const newPlanObj = {
      id: Date.now(),
      title: newPlanTitle,
      fileName: newPlanFile ? newPlanFile.name : 'Planning_General.pdf',
      fileUrl: newPlanFile ? URL.createObjectURL(newPlanFile) : '',
      targetUserId: newPlanTarget === 'all' ? 'all' : Number(newPlanTarget),
      targetName: targetName,
      date: new Date().toISOString().split('T')[0]
    };

    setPlans([newPlanObj, ...plans]);
    setShowAddPlanModal(false);
    setNewPlanTitle('');
    setNewPlanTarget('all');
    setNewPlanFile(null);
  };

  const handleDeletePlan = (planId) => {
    setPlans(plans.filter(p => p.id !== planId));
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved'), [users]);
  
  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return plans;
    return plans.filter(p => p.targetUserId === 'all' || p.targetUserId === currentUser.id);
  }, [plans, currentUser]);

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

  const isAdmin = currentUser.role === 'admin';

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

        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>📅</span> Plannings & Documents PDF</h2>
              {isAdmin && (
                <button onClick={() => setShowAddPlanModal(true)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 transition-colors text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow">
                  <Upload className="w-4 h-4" /> Partager un planning PDF
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePlans.map(plan => (
                <div key={plan.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-cyan-400 font-bold px-2 py-0.5 bg-cyan-500/10 rounded">{plan.date}</span>
                      <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">🎯 Pour : {plan.targetName}</span>
                    </div>
                    <div className="text-sm font-bold text-white">{plan.title}</div>
                    <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg text-xs text-slate-300 border border-slate-800">
                      <FileText className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="truncate font-mono">{plan.fileName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = plan.fileUrl;
                        link.download = plan.fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-lg transition-colors text-center"
                    >
                      📄 Télécharger PDF
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeletePlan(plan.id)} 
                        className="ml-2 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs rounded-lg transition-colors"
                        title="Supprimer ce planning"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {visiblePlans.length === 0 && (
                <p className="text-xs text-slate-400 italic">Aucun planning disponible pour le moment.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>📋</span> Demandes de Matériel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map(req => (
                <div key={req.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{req.timeAgo}</span>
                    <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded">{req.status}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{req.requester}</div>
                  <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-mono text-slate-200 border border-slate-800">
                    {req.items}
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleValidateRequest(req.id)}
                      className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✓ Valider et archiver
                    </button>
                  )}
                </div>
              ))}
              {requests.length === 0 && (
                <p className="text-xs text-slate-400 italic">Aucune demande en attente.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'workers' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>👷‍♂️</span> Effectifs Actifs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedUsers.map(u => (
                <div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded">{u.role.toUpperCase()}</span>
                    <span className="text-slate-400">Depuis {u.joinedAt}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.team} • <span className="font-mono text-slate-300">{u.email}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🏗️</span> Chantiers en Cours</h2>
              {isAdmin && (
                <button onClick={() => setShowAddSiteModal(true)} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow">
                  <Plus className="w-4 h-4" /> Nouveau Chantier
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map(s => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-blue-400 font-bold px-2 py-0.5 bg-blue-500/10 rounded">{s.client}</span>
                      <span className="text-emerald-400 text-[11px] font-semibold">{s.status}</span>
                    </div>
                    <div className="text-sm font-bold text-white">{s.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{s.address}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Chef : <strong className="text-slate-200">{s.manager}</strong></span>
                    {isAdmin && (
                      <button onClick={() => handleDeleteSite(s.id)} className="text-red-400 hover:text-red-300 text-xs">Supprimer</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

{activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🔧</span> Parc Outillage & Matériel</h2>
              {isAdmin && (
                <button onClick={() => setShowAddToolModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow">
                  <Plus className="w-4 h-4" /> Ajouter une machine
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map(tool => (
                <div key={tool.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-indigo-400 font-mono font-bold">{tool.id}</span>
                      <span className="text-slate-400">{tool.brand}</span>
                    </div>
                    <div className="text-sm font-bold text-white">{tool.name}</div>
                    <div className="text-xs text-slate-400">
                      Statut : <span className="text-emerald-400 font-medium">{tool.status}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 my-1">
                    {tool.assignedTo && (
                      <div className="text-slate-500">
                        Assigné à : <strong className="text-slate-300">{tool.assignedTo}</strong>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedTool(tool)} 
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 transition-colors text-xs text-slate-200 rounded-lg"
                    >
                      Carnet ({tool.notes?.length || 0})
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(tool)}
                          className="px-2.5 py-1.5 bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                          title="Supprimer cette machine"
                        >
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

        {isAdmin && activeTab === 'accounts' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🛡️</span> Validation des Comptes en Attente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded">EN ATTENTE</span>
                    <span className="text-slate-400">{u.joinedAt}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email} • <span className="font-mono text-slate-300">{u.role}</span></div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button onClick={() => handleApproveAccount(u.id)} className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg">Approuver</button>
                    <button onClick={() => handleRejectAccount(u.id)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg">Refuser</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && (
                <p className="text-xs text-slate-400 italic">Aucun compte en attente de validation.</p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODALE : CARNET D'ENTRETIEN OUTIL */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-indigo-400 font-mono font-bold">{selectedTool.id}</span>
                <h3 className="text-base font-bold text-white">{selectedTool.name}</h3>
              </div>
              <button onClick={() => setSelectedTool(null)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historique & Notes</h4>
              {selectedTool.notes && selectedTool.notes.length > 0 ? (
                selectedTool.notes.map(note => (
                  <div key={note.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-300">{note.author}</span>
                      <span>{note.date}</span>
                    </div>
                    <p className="text-xs text-slate-200">{note.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Aucune note enregistrée sur ce carnet.</p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs text-slate-400">Ajouter une note de suivi</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newNoteText} 
                  onChange={e => setNewNoteText(e.target.value)} 
                  placeholder="Ex: Révision flexible, changement de mors..." 
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button onClick={() => handleAddNote(selectedTool.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl">Ajouter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : MODIFICATION RAPIDE OUTIL */}
      {editingTool && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveToolEdit} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Modifier l'outillage : {editingTool.id}</h3>
              <button type="button" onClick={() => setEditingTool(null)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Assigné à (Chantier ou Personne)</label>
                <input 
                  type="text" 
                  value={editToolForm.assignedTo} 
                  onChange={e => setEditToolForm({ ...editToolForm, assignedTo: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Statut</label>
                <select 
                  value={editToolForm.status} 
                  onChange={e => setEditToolForm({ ...editToolForm, status: e.target.value })} 
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Sur chantier">Sur chantier</option>
                  <option value="En révision">En révision</option>
                  <option value="Hors service">Hors service</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setEditingTool(null)} className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE : AJOUTER UN CHANTIER */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSite} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Nouveau Chantier</h3>
              <button type="button" onClick={() => setShowAddSiteModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom du chantier</label>
                <input type="text" required value={newSiteData.name} onChange={e => setNewSiteData({ ...newSiteData, name: e.target.value })} placeholder="Ex: Résidence Les Jardins" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Client / Maître d'ouvrage</label>
                <input type="text" value={newSiteData.client} onChange={e => setNewSiteData({ ...newSiteData, client: e.target.value })} placeholder="Ex: Nexity, GCC..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Adresse</label>
                <input type="text" value={newSiteData.address} onChange={e => setNewSiteData({ ...newSiteData, address: e.target.value })} placeholder="Adresse complète" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Chef de chantier / Responsable</label>
                <input type="text" value={newSiteData.manager} onChange={e => setNewSiteData({ ...newSiteData, manager: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddSiteModal(false)} className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl">Créer</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE : AJOUTER UN OUTIL */}
      {showAddToolModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Ajouter une machine</h3>
              <button type="button" onClick={() => setShowAddToolModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ID / Référence (ex: OUT-103)</label>
                <input type="text" required value={newToolData.id} onChange={e => setNewToolData({ ...newToolData, id: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom de la machine</label>
                <input type="text" required value={newToolData.name} onChange={e => setNewToolData({ ...newToolData, name: e.target.value })} placeholder="Ex: Coupe-tube sans fil" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Marque</label>
                <input type="text" value={newToolData.brand} onChange={e => setNewToolData({ ...newToolData, brand: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Catégorie</label>
                <input type="text" value={newToolData.category} onChange={e => setNewToolData({ ...newToolData, category: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddToolModal(false)} className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl">Ajouter</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE : PARTAGER UN PLANNING */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadPlan} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Partager un planning PDF</h3>
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Titre du planning</label>
                <input type="text" required value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} placeholder="Ex: Planning S47 - Réseau Chauffage" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Destinataire</label>
                <select value={newPlanTarget} onChange={e => setNewPlanTarget(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                  <option value="all">Toute l'équipe</option>
                  {approvedUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fichier PDF</label>
                <input type="file" accept=".pdf" onChange={e => setNewPlanFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl">Partager</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}