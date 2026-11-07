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
  Minus,
  X, 
  Clock, 
  MapPin, 
  LogOut,
  ChevronRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Upload,
  Download,
  Eye,
  Filter,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Phone,
  Search
} from 'lucide-react';

const INITIAL_USERS = [
  { id: 1, name: 'Jean Dupont', email: 'admin@btppro.fr', phone: '06 12 34 56 78', role: 'admin', team: 'Direction', status: 'approved', joinedAt: '2024-01-10' },
  { id: 2, name: 'Marc Vasseur', email: 'marc@btppro.fr', phone: '06 98 76 54 32', role: 'Employé', team: 'Équipe Chauffage', status: 'approved', joinedAt: '2024-02-15' },
  { id: 3, name: 'Thomas Bernard', email: 'thomas@btppro.fr', phone: '06 11 22 33 44', role: 'Intérimaire', team: 'Équipe Plomberie 1', status: 'approved', joinedAt: '2024-03-01' }
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
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // États pour la modification d'un utilisateur par l'Admin dans l'onglet Effectifs
  const [editingUser, setEditingUser] = useState(null);
  const [editUserRole, setEditUserRole] = useState('Employé');

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

  // États Planning
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [planningViewMode, setPlanningViewMode] = useState('week');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('all');
  
  const [newPlanData, setNewPlanData] = useState({
    title: '',
    targetUserId: 'all',
    date: new Date().toISOString().split('T')[0],
    description: '',
    files: []
  });

  // États Module Demandes de Matériel & Filtre de statut
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [newRequestData, setNewRequestData] = useState({
    items: '',
    quantity: 1,
    urgency: 'Normal',
    description: '',
    attachmentName: '',
    attachmentData: ''
  });

  // États Module Effectifs (Recherche & Filtre)
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerRoleFilter, setWorkerRoleFilter] = useState('all');

  const formatDateFr = (dateString) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return d.toLocaleDateString('fr-FR', options).toUpperCase();
      }
    } catch (e) {
      console.error(e);
    }
    return dateString;
  };

  // Synchronisation Firestore
  useEffect(() => {
    const unsubEquipment = onSnapshot(collection(db, "equipment"), (snapshot) => {
      setEquipment(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubSites = onSnapshot(collection(db, "sites"), (snapshot) => {
      setSites(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubPlans = onSnapshot(collection(db, "plans"), (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
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
      console.error(error);
    }
  };

  const handleDeleteSite = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "sites", firestoreId));
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  const handleDeleteTool = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "equipment", firestoreId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setEditToolForm({ assignedTo: tool.assignedTo || '', status: tool.status || 'Disponible' });
  };

  const handleSaveToolEdit = async (e) => {
    e.preventDefault();
    if (!editingTool || !editingTool.firestoreId) return;
    try {
      await updateDoc(doc(db, "equipment", editingTool.firestoreId), {
        assignedTo: editToolForm.assignedTo,
        status: editToolForm.status
      });
      setEditingTool(null);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  // --- GESTION DEMANDES DE MATÉRIEL ---
  const handleRequestAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRequestData(prev => ({
          ...prev,
          attachmentName: file.name,
          attachmentData: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequestData.items || !currentUser) return;

    try {
      await addDoc(collection(db, "requests"), {
        items: newRequestData.items,
        quantity: newRequestData.quantity || 1,
        urgency: newRequestData.urgency,
        description: newRequestData.description || '',
        requester: currentUser.name,
        requesterId: currentUser.id,
        status: 'En attente',
        createdAt: new Date().toISOString().split('T')[0],
        receivedDate: null,
        attachmentName: newRequestData.attachmentName || '',
        attachmentData: newRequestData.attachmentData || ''
      });
      setShowAddRequestModal(false);
      setNewRequestData({ items: '', quantity: 1, urgency: 'Normal', description: '', attachmentName: '', attachmentData: '' });
    } catch (error) {
      console.error("Erreur création demande :", error);
    }
  };

  const handleUpdateRequestStatus = async (firestoreId, newStatus) => {
    try {
      const reqRef = doc(db, "requests", firestoreId);
      const updateData = { status: newStatus };
      if (newStatus === 'Reçu au dépôt') {
        updateData.receivedDate = new Date().toISOString().split('T')[0];
      }
      await updateDoc(reqRef, updateData);
    } catch (error) {
      console.error("Erreur mise à jour statut :", error);
    }
  };

  const handleDeleteRequest = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "requests", firestoreId));
    } catch (error) {
      console.error(error);
    }
  };

  const visibleRequests = useMemo(() => {
    if (!currentUser) return [];
    let list = currentUser.role === 'admin' ? requests : requests.filter(r => r.requesterId === currentUser.id);
    
    if (requestStatusFilter !== 'all') {
      list = list.filter(r => r.status === requestStatusFilter);
    }
    return list;
  }, [requests, currentUser, requestStatusFilter]);

  // --- GESTION EFFECTIFS & UTILISATEURS ---
  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved'), [users]);

  const filteredWorkers = useMemo(() => {
    return approvedUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(workerSearch.toLowerCase().trim());
      const matchesRole = workerRoleFilter === 'all' || user.role === workerRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [approvedUsers, workerSearch, workerRoleFilter]);

  const handleUpdateUserRole = (userId, newRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setEditingUser(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Il n'aura plus accès à l'application.")) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  // Gestion de plusieurs fichiers PDF Planning
  const handleMultipleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    let processedFiles = [];
    let loadedCount = 0;

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        processedFiles.push({
          name: file.name,
          data: reader.result
        });
        loadedCount++;
        if (loadedCount === selectedFiles.length) {
          setNewPlanData(prev => ({
            ...prev,
            files: [...prev.files, ...processedFiles]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFileIndex = (indexToRemove) => {
    setNewPlanData(prev => ({
      ...prev,
      files: prev.files.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!newPlanData.title) return;

    let targetName = 'Toute l’équipe';
    if (newPlanData.targetUserId !== 'all') {
      const foundUser = users.find(u => u.id === Number(newPlanData.targetUserId));
      if (foundUser) targetName = foundUser.name;
    }

    try {
      await addDoc(collection(db, "plans"), {
        title: newPlanData.title,
        description: newPlanData.description || '',
        files: newPlanData.files || [],
        targetUserId: newPlanData.targetUserId === 'all' ? 'all' : Number(newPlanData.targetUserId),
        targetName: targetName,
        date: newPlanData.date,
        formattedDate: formatDateFr(newPlanData.date)
      });
      setShowAddPlanModal(false);
      setNewPlanData({ title: '', targetUserId: 'all', date: new Date().toISOString().split('T')[0], description: '', files: [] });
    } catch (error) {
      console.error("Erreur ajout planning :", error);
    }
  };

  const handleDeletePlan = async (firestoreId) => {
    try {
      if (firestoreId) await deleteDoc(doc(db, "plans", firestoreId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadSinglePdf = (fileObj) => {
    if (!fileObj.data) {
      alert("Fichier introuvable.");
      return;
    }
    const link = document.createElement('a');
    link.href = fileObj.data;
    link.download = fileObj.name || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setAuthError('Veuillez remplir tous les champs, y compris le numéro de téléphone.');
      return;
    }
    const newUser = {
      id: Date.now(),
      name: regName,
      email: regEmail,
      phone: regPhone,
      role: 'Employé', // Rôle par défaut, l'admin pourra le changer
      team: 'Ouvriers',
      status: 'approved', // Accepté direct pour l'exemple ou en attente selon besoin
      joinedAt: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setActiveTab('dashboard');
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
  
  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role !== 'admin') {
      return plans.filter(p => p.targetUserId === 'all' || p.targetUserId === currentUser.id);
    }
    if (selectedWorkerFilter === 'all') return plans;
    return plans.filter(p => p.targetUserId === Number(selectedWorkerFilter));
  }, [plans, currentUser, selectedWorkerFilter]);

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
                      <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="Jean Martin" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean@btppro.fr" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Numéro de téléphone <span className="text-red-400">*</span></label>
                      <input type="tel" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="06 12 34 56 78" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Mot de passe</label>
                      <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
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
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab !== 'dashboard' && (
            <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-all shadow-sm font-medium">
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
              <div onClick={() => setActiveTab('planning')} className="group bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-cyan-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-cyan-500/10 rounded-xl">📅</span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[11px] font-bold rounded-full">{visiblePlans.length} dispo</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400">Planning & PDF</h3>
                  <p className="text-xs text-slate-400 mt-1">Feuilles de route et plans d'exécution nominatifs.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('requests')} className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-amber-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-amber-500/10 rounded-xl">📋</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-full">{visibleRequests.length} demandes</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400">Demandes de Matériel</h3>
                  <p className="text-xs text-slate-400 mt-1">Besoins en raccords, tubes et fournitures.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('workers')} className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-emerald-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-emerald-500/10 rounded-xl">👷‍♂️</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full">{approvedUsers.length} actifs</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400">Gestion des Effectifs</h3>
                  <p className="text-xs text-slate-400 mt-1">Annuaire, rôles et coordonnées.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('sites')} className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-blue-500/10 rounded-xl">🏗️</span>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[11px] font-bold rounded-full">{sites.length} chantiers</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400">Chantiers</h3>
                  <p className="text-xs text-slate-400 mt-1">Suivi des résidences et travaux.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('tools')} className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-indigo-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-indigo-500/10 rounded-xl">🔧</span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-full">{equipment.length} machines</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400">Parc Outillage</h3>
                  <p className="text-xs text-slate-400 mt-1">Sertisseuses, carotteuses et entretien.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-400">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {isAdmin && (
                <div onClick={() => setActiveTab('accounts')} className="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl cursor-pointer shadow-lg hover:shadow-purple-500/10 transform hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl p-2.5 bg-purple-500/10 rounded-xl">🛡️</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[11px] font-bold rounded-full">{pendingUsers.length} à valider</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-400">Validation des Comptes</h3>
                    <p className="text-xs text-slate-400 mt-1">Validation des accès collaborateurs.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-400">
                    <span>Accéder au module</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE PLANNING --- */}
        {activeTab === 'planning' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-cyan-400" /> Planning des interventions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAdmin ? "Gestion globale des affectations et plans d'exécution" : "Tes tâches et feuilles de route attribuées"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button onClick={() => setPlanningViewMode('week')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${planningViewMode === 'week' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Vue Semaine</button>
                  <button onClick={() => setPlanningViewMode('month')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${planningViewMode === 'month' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Vue Mois</button>
                </div>

                {isAdmin && (
                  <select value={selectedWorkerFilter} onChange={e => setSelectedWorkerFilter(e.target.value)} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl focus:outline-none">
                    <option value="all">Tous les ouvriers</option>
                    {approvedUsers.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                  </select>
                )}

                {isAdmin && (
                  <button onClick={() => setShowAddPlanModal(true)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow">
                    <Plus className="w-4 h-4" /> Assigner Tâche & PDFs
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePlans.map(plan => (
                <div key={plan.firestoreId || plan.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300">📅 {plan.formattedDate || formatDateFr(plan.date)}</span>
                      <span className="text-slate-400 font-medium">Pour : <strong className="text-slate-200">{plan.targetName}</strong></span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2">{plan.title}</h3>
                    {plan.description && <p className="text-xs text-slate-300 mt-1">{plan.description}</p>}

                    <div className="mt-3 space-y-2">
                      <span className="text-[11px] text-slate-400 font-semibold">Documents associés ({plan.files ? plan.files.length : (plan.fileName ? 1 : 0)}) :</span>
                      {(!plan.files || plan.files.length === 0) && plan.fileData && (
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-xs text-slate-200 font-medium truncate max-w-[140px]">{plan.fileName}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf({ name: plan.fileName, data: plan.fileData })} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] rounded-lg font-semibold">Ouvrir</button>
                        </div>
                      )}
                      {plan.files && plan.files.map((fileObj, fIdx) => (
                        <div key={fIdx} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-xs text-slate-200 font-medium truncate max-w-[140px]">{fileObj.name}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf(fileObj)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] rounded-lg font-semibold flex items-center gap-1">
                            <Download className="w-3 h-3" /> Ouvrir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-800 flex justify-end">
                      <button onClick={() => handleDeletePlan(plan.firestoreId)} className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs rounded-lg transition-colors">Supprimer</button>
                    </div>
                  )}
                </div>
              ))}

              {visiblePlans.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs italic">Aucune tâche ou planning attribué pour cette période.</div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE DEMANDES DE MATÉRIEL (REQUESTS) --- */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400" /> Demandes de matériel & fournitures
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAdmin ? "Gérez les besoins chantier, validez ou refusez les commandes" : "Retrouvez vos demandes de matériel et suivez leur statut"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select 
                  value={requestStatusFilter} 
                  onChange={e => setRequestStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">🔍 Tous les statuts</option>
                  <option value="En attente">⏳ En attente</option>
                  <option value="Validé / Commandé">✅ Validé / Commandé</option>
                  <option value="Reçu au dépôt">📦 Reçu au dépôt</option>
                  <option value="Refusé">❌ Refusé</option>
                </select>

                <button onClick={() => setShowAddRequestModal(true)} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow">
                  <Plus className="w-4 h-4" /> Nouvelle Demande
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRequests.map(req => {
                let urgencyBadge = <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">Normal</span>;
                if (req.urgency === 'Urgent') urgencyBadge = <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded">⚡ Urgent</span>;
                if (req.urgency === 'Critique') urgencyBadge = <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold rounded">🔥 Critique</span>;

                return (
                  <div key={req.firestoreId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-slate-400">Demandeur : <strong className="text-slate-200">{req.requester}</strong></span>
                        {urgencyBadge}
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">{req.items}</h3>
                        <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 text-xs font-mono font-bold rounded-lg">Qté : {req.quantity || 1}</span>
                      </div>

                      {req.description && <p className="text-xs text-slate-300 mt-1">{req.description}</p>}

                      {req.attachmentData && (
                        <div className="mt-2 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span className="text-xs text-slate-200 font-medium truncate max-w-[140px]">{req.attachmentName || 'Pièce jointe'}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf({ name: req.attachmentName, data: req.attachmentData })} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] rounded-lg font-semibold flex items-center gap-1">
                            <Download className="w-3 h-3" /> Ouvrir
                          </button>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Statut :</span>
                        {isAdmin ? (
                          <select 
                            value={req.status} 
                            onChange={(e) => handleUpdateRequestStatus(req.firestoreId, e.target.value)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-700 focus:outline-none ${
                              req.status === 'Validé / Commandé' ? 'bg-blue-600/30 text-blue-300' :
                              req.status === 'Reçu au dépôt' ? 'bg-emerald-600/30 text-emerald-300' :
                              req.status === 'Refusé' ? 'bg-red-600/30 text-red-300' :
                              'bg-amber-600/30 text-amber-300'
                            }`}
                          >
                            <option value="En attente" className="bg-slate-900 text-amber-300">⏳ En attente</option>
                            <option value="Validé / Commandé" className="bg-slate-900 text-blue-300">✅ Validé / Commandé</option>
                            <option value="Reçu au dépôt" className="bg-slate-900 text-emerald-300">📦 Reçu au dépôt</option>
                            <option value="Refusé" className="bg-slate-900 text-red-300">❌ Refusé</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            req.status === 'Validé / Commandé' ? 'bg-blue-500/20 text-blue-300' :
                            req.status === 'Reçu au dépôt' ? 'bg-emerald-500/20 text-emerald-300' :
                            req.status === 'Refusé' ? 'bg-red-500/20 text-red-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {req.status === 'Reçu au dépôt' ? `📦 Reçu (${req.receivedDate})` : req.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-800 flex justify-end">
                        <button onClick={() => handleDeleteRequest(req.firestoreId)} className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs rounded-lg transition-colors flex items-center gap-1">
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {visibleRequests.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs italic">Aucune demande de matériel ne correspond à ce filtre.</div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE EFFECTIFS (ANNUAIRE INSCRITS) --- */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" /> Annuaire des Effectifs Inscrits
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Liste de tous les collaborateurs validés. {isAdmin ? "Vous pouvez modifier leurs rôles ou supprimer des accès." : ""}
                </p>
              </div>

              {/* Barre de recherche par nom et Filtre par rôle (Intérimaire, Employé, Admin) */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={workerSearch} 
                    onChange={e => setWorkerSearch(e.target.value)} 
                    placeholder="Rechercher par nom..." 
                    className="pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white w-full sm:w-48" 
                  />
                </div>

                <select 
                  value={workerRoleFilter} 
                  onChange={e => setWorkerRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">🔍 Tous les rôles</option>
                  <option value="Employé">Employé</option>
                  <option value="Intérimaire">Intérimaire</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Grille des membres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkers.map(user => {
                let roleBadge = <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg">Employé</span>;
                if (user.role === 'Intérimaire') roleBadge = <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg">⚡ Intérimaire</span>;
                if (user.role === 'admin') roleBadge = <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-lg">🛡️ Admin</span>;

                return (
                  <div key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-white">{user.name}</h3>
                        {roleBadge}
                      </div>

                      {/* Affichage du Numéro de téléphone (pas d'e-mail affiché) */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono font-medium">{user.phone || 'Non renseigné'}</span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500">Inscrit le : {user.joinedAt}</div>
                    </div>

                    {/* Actions Admin : Modifier le rôle ou Supprimer le compte */}
                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        {editingUser === user.id ? (
                          <div className="flex gap-2 items-center">
                            <select 
                              value={editUserRole} 
                              onChange={e => setEditUserRole(e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg flex-1"
                            >
                              <option value="Employé">Employé</option>
                              <option value="Intérimaire">Intérimaire</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button onClick={() => handleUpdateUserRole(user.id, editUserRole)} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-lg font-semibold">OK</button>
                            <button onClick={() => setEditingUser(null)} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">✕</button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center gap-2">
                            <button 
                              onClick={() => { setEditingUser(user.id); setEditUserRole(user.role); }} 
                              className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium transition-colors"
                            >
                              Modifier rôle
                            </button>
                            {user.id !== currentUser.id && (
                              <button 
                                onClick={() => handleDeleteUser(user.id)} 
                                className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs rounded-lg transition-colors"
                              >
                                🗑️ Supprimer
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredWorkers.length === 0 && (
                <div className="col-span-full py-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs italic">Aucun collaborateur ne correspond à votre recherche.</div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULES SECONDAIRES --- */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Chantiers en cours</h2>
              {isAdmin && (<button onClick={() => setShowAddSiteModal(true)} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Nouveau Chantier</button>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <div key={site.firestoreId} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-white">{site.name}</h3>
                    {isAdmin && <button onClick={() => handleDeleteSite(site.firestoreId)} className="text-red-400 text-xs">🗑️</button>}
                  </div>
                  <p className="text-xs text-slate-400">Client : {site.client}</p>
                  <p className="text-xs text-slate-400">Adresse : {site.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-bold text-white">Parc Outillage</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="text" value={toolSearch} onChange={e => setToolSearch(e.target.value)} placeholder="Rechercher..." className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white" />
                {isAdmin && (<button onClick={() => setShowAddToolModal(true)} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Machine</button>)}
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
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-1 bg-slate-800 text-xs text-slate-200 rounded-lg">Notes</button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleOpenEditModal(tool)} className="px-2 py-1 bg-amber-600/30 text-amber-300 text-xs rounded-lg">Modifier</button>
                        <button onClick={() => handleDeleteTool(tool.firestoreId)} className="px-2 py-1 bg-red-600/20 text-red-300 text-xs rounded-lg">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Validation des comptes en attente</h2>
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{user.name} ({user.email})</p>
                    <p className="text-xs text-slate-400">Téléphone : {user.phone || 'Non renseigné'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveAccount(user.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg">Approuver</button>
                    <button onClick={() => handleRejectAccount(user.id)} className="px-3 py-1.5 bg-red-600/20 text-red-300 text-xs rounded-lg">Refuser</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs italic bg-slate-900 border border-slate-800 rounded-xl">Aucun compte en attente de validation.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALE NOUVELLE DEMANDE DE MATÉRIEL --- */}
      {showAddRequestModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateRequest} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Nouvelle Demande de Matériel</h3>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Matériel / Fournitures souhaitées</label>
              <input type="text" placeholder="ex: Couronnes multicouche Ø16, coudes..." value={newRequestData.items} onChange={e => setNewRequestData({...newRequestData, items: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Quantité</label>
              <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
                <button 
                  type="button" 
                  onClick={() => setNewRequestData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-cyan-400">{newRequestData.quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setNewRequestData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Niveau d'urgence</label>
              <select value={newRequestData.urgency} onChange={e => setNewRequestData({...newRequestData, urgency: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                <option value="Normal">🟢 Normal</option>
                <option value="Urgent">⚡ Urgent</option>
                <option value="Critique">🔥 Critique (Chantier bloqué)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Pièce jointe (Optionnel : Photo ou PDF)</label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={handleRequestAttachmentChange} 
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer" 
              />
              {newRequestData.attachmentName && (
                <div className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1">
                  <span>📎 Fichier joint : {newRequestData.attachmentName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Précisions (Chantier, référence...)</label>
              <textarea placeholder="Ex: Pour le bâtiment B, R+2..." value={newRequestData.description} onChange={e => setNewRequestData({...newRequestData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white h-20" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddRequestModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-amber-600 text-xs text-white font-semibold rounded-xl">Envoyer la demande</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODALE CREATION TÂCHE PLANNING --- */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadPlan} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Assigner Tâche & Plusieurs PDFs</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Titre de l'intervention / Chantier</label>
              <input type="text" placeholder="ex: Pose colonnes Bâtiment A" value={newPlanData.title} onChange={e => setNewPlanData({...newPlanData, title: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Attribuer à</label>
              <select value={newPlanData.targetUserId} onChange={e => setNewPlanData({...newPlanData, targetUserId: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white">
                <option value="all">Toute l'équipe (Général)</option>
                {approvedUsers.map(u => (<option key={u.id} value={u.id}>{u.name} ({u.team})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date d'intervention</label>
              <input type="date" value={newPlanData.date} onChange={e => setNewPlanData({...newPlanData, date: e.target.value})} onClick={(e) => e.target.showPicker?.()} required style={{ colorScheme: 'dark' }} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sélectionner un ou plusieurs fichiers PDF</label>
              <input type="file" accept=".pdf" multiple onChange={handleMultipleFilesChange} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer" />
              {newPlanData.files.length > 0 && (
                <div className="mt-2 space-y-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-cyan-400 font-bold">Fichiers prêts ({newPlanData.files.length}) :</span>
                  {newPlanData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-200 bg-slate-900 px-2 py-1 rounded-lg">
                      <span className="truncate max-w-[200px]">📄 {file.name}</span>
                      <button type="button" onClick={() => handleRemoveFileIndex(idx)} className="text-red-400 hover:text-red-300 font-bold px-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Consignes complémentaires</label>
              <textarea placeholder="Instruction pour l'ouvrier..." value={newPlanData.description} onChange={e => setNewPlanData({...newPlanData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white h-20" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-xs text-white font-semibold rounded-xl">Enregistrer & Publier</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALES SECONDAIRES */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSite} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Nouveau Chantier</h3>
            <input type="text" placeholder="Nom du chantier" value={newSiteData.name} onChange={e => setNewSiteData({...newSiteData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddSiteModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs text-white rounded-xl">Créer</button>
            </div>
          </form>
        </div>
      )}

      {showAddToolModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Ajouter une machine</h3>
            <input type="text" placeholder="ID Machine" value={newToolData.id} onChange={e => setNewToolData({...newToolData, id: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <input type="text" placeholder="Nom de l'outil" value={newToolData.name} onChange={e => setNewToolData({...newToolData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs text-white rounded-xl">Ajouter</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}