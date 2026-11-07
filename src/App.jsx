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
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Key,
  Layers,
  SlidersHorizontal,
  FolderOpen,
  Archive,
  Smartphone
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regIsAdmin, setRegIsAdmin] = useState(false);
  const [regProjectCode, setRegProjectCode] = useState('');
  const [authError, setAuthError] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalData, setUserModalData] = useState({ firestoreId: '', name: '', phone: '', role: 'Employé', password: '' });

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState('Employé');

  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);

  // État pour la gestion du prompt d'installation PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const [toolSearch, setToolSearch] = useState('');
  const [toolStatusFilter, setToolStatusFilter] = useState('all');
  const [editingTool, setEditingTool] = useState(null);
  const [editToolForm, setEditToolForm] = useState({ assignedTo: '', status: '' });
  const [selectedTool, setSelectedTool] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [newToolData, setNewToolData] = useState({ 
    id: '', 
    name: '', 
    brand: 'REMS', 
    category: 'Sertissage', 
    status: 'Disponible',
    assignedTo: 'Dépôt Central' 
  });

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('all');
  const [newPlanData, setNewPlanData] = useState({ title: '', targetUserId: 'all', date: new Date().toISOString().split('T')[0], description: '', files: [] });

  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [newRequestData, setNewRequestData] = useState({ items: '', quantity: 1, urgency: 'Normal', description: '', attachmentName: '', attachmentData: '' });

  const [workerSearch, setWorkerSearch] = useState('');
  const [workerRoleFilter, setWorkerRoleFilter] = useState('all');

  // Détection si l'application est déjà installée sur l'écran d'accueil
  useEffect(() => {
    const checkStandalone = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setIsStandalone(isInStandaloneMode);
    };
    checkStandalone();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Pour installer l'application sur votre iPhone ou téléphone :\n1. Ouvrez le menu de votre navigateur (Partager ou 3 points).\n2. Sélectionnez 'Ajouter à l'écran d'accueil'.");
    }
  };

  const formatPhoneFr = (phoneStr) => {
    if (!phoneStr) return 'Non renseigné';
    const cleaned = phoneStr.replace(/\s+/g, '');
    const match = cleaned.match(/.{1,2}/g);
    return match ? match.join(' ') : phoneStr;
  };

  const formatDateFr = (dateString) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
      }
    } catch (e) {
      console.error(e);
    }
    return dateString;
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubArchived = onSnapshot(collection(db, "archivedUsers"), (snapshot) => {
      setArchivedUsers(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubEquipment = onSnapshot(collection(db, "equipment"), (snapshot) => {
      setEquipment(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    const unsubPlans = onSnapshot(collection(db, "plans"), (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    return () => {
      unsubUsers();
      unsubArchived();
      unsubEquipment();
      unsubRequests();
      unsubPlans();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.firestoreId === currentUser.firestoreId);
      if (updated) setCurrentUser(updated);
    }
  }, [users]);

  const myProjectCode = currentUser ? (currentUser.projectCode || currentUser.adminProjectCode) : null;

  const projectEquipment = useMemo(() => {
    if (!myProjectCode) return [];
    return equipment.filter(t => t.projectCode === myProjectCode);
  }, [equipment, myProjectCode]);

  const projectRequests = useMemo(() => {
    if (!myProjectCode) return [];
    return requests.filter(r => r.projectCode === myProjectCode);
  }, [requests, myProjectCode]);

  const projectPlans = useMemo(() => {
    if (!myProjectCode) return [];
    return plans.filter(p => p.projectCode === myProjectCode);
  }, [plans, myProjectCode]);

  const projectUsers = useMemo(() => {
    if (!myProjectCode) return [];
    return users.filter(u => u.projectCode === myProjectCode || u.adminProjectCode === myProjectCode);
  }, [users, myProjectCode]);

  const projectArchivedUsers = useMemo(() => {
    if (!myProjectCode) return [];
    return archivedUsers.filter(u => u.projectCode === myProjectCode);
  }, [archivedUsers, myProjectCode]);

  const approvedUsers = useMemo(() => projectUsers.filter(u => u.status === 'approved'), [projectUsers]);
  const pendingUsers = useMemo(() => projectUsers.filter(u => u.status === 'pending' && u.role !== 'admin'), [projectUsers]);

  const filteredEquipment = useMemo(() => {
    return projectEquipment.filter(tool => {
      const query = toolSearch.toLowerCase().trim();
      const matchesSearch = (
        tool.name?.toLowerCase().includes(query) ||
        tool.id?.toLowerCase().includes(query) ||
        tool.brand?.toLowerCase().includes(query) ||
        (tool.assignedTo && tool.assignedTo.toLowerCase().includes(query))
      );
      const matchesStatus = toolStatusFilter === 'all' || tool.status === toolStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectEquipment, toolSearch, toolStatusFilter]);

  const handleCreateTool = async (e) => {
    e.preventDefault();
    if (!newToolData.name || !newToolData.id || !myProjectCode || !currentUser) return;
    try {
      const initialNote = {
        id: Date.now(),
        author: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        text: `Création de la machine et affectation initiale à : ${newToolData.assignedTo}`
      };
      await addDoc(collection(db, "equipment"), {
        ...newToolData,
        projectCode: myProjectCode,
        notes: [initialNote]
      });
      setShowAddToolModal(false);
      setNewToolData({ id: '', name: '', brand: 'REMS', category: 'Sertissage', status: 'Disponible', assignedTo: 'Dépôt Central' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTool = async (firestoreId) => {
    try { if (firestoreId) await deleteDoc(doc(db, "equipment", firestoreId)); } catch (e) { console.error(e); }
  };

  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setEditToolForm({ assignedTo: tool.assignedTo || 'Dépôt Central', status: tool.status || 'Disponible' });
  };

  const handleSaveToolEdit = async (e) => {
    e.preventDefault();
    if (!editingTool || !editingTool.firestoreId || !currentUser) return;
    try {
      const toolRef = doc(db, "equipment", editingTool.firestoreId);
      const newHistoryNote = {
        id: Date.now(),
        author: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        text: `Mise à jour statut/affectation`
      };
      await updateDoc(toolRef, {
        assignedTo: editToolForm.assignedTo,
        status: editToolForm.status,
        notes: [newHistoryNote, ...(editingTool.notes || [])]
      });
      setEditingTool(null);
    } catch (e) { console.error(e); }
  };

  const handleAddNote = async (tool) => {
    if (!newNoteText.trim() || !tool.firestoreId || !currentUser) return;
    const noteObj = { id: Date.now(), author: currentUser.name, date: new Date().toISOString().split('T')[0], text: newNoteText };
    try {
      const toolRef = doc(db, "equipment", tool.firestoreId);
      const updatedNotes = [noteObj, ...(tool.notes || [])];
      await updateDoc(toolRef, { notes: updatedNotes });
      setNewNoteText('');
      setSelectedTool(prev => ({ ...prev, notes: updatedNotes }));
    } catch (e) { console.error(e); }
  };

  const handleRequestAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRequestData(prev => ({ ...prev, attachmentName: file.name, attachmentData: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequestData.items || !myProjectCode || !currentUser) return;
    try {
      await addDoc(collection(db, "requests"), {
        ...newRequestData,
        projectCode: myProjectCode,
        requester: currentUser.name,
        requesterId: currentUser.userIdNum || currentUser.id,
        status: 'En attente',
        createdAt: new Date().toISOString().split('T')[0],
        receivedDate: null
      });
      setShowAddRequestModal(false);
      setNewRequestData({ items: '', quantity: 1, urgency: 'Normal', description: '', attachmentName: '', attachmentData: '' });
    } catch (e) { console.error(e); }
  };

  const handleUpdateRequestStatus = async (firestoreId, newStatus) => {
    try {
      const reqRef = doc(db, "requests", firestoreId);
      const updateData = { status: newStatus };
      if (newStatus === 'Reçu au dépôt') updateData.receivedDate = new Date().toISOString().split('T')[0];
      await updateDoc(reqRef, updateData);
    } catch (e) { console.error(e); }
  };

  const handleDeleteRequest = async (firestoreId) => {
    try { if (firestoreId) await deleteDoc(doc(db, "requests", firestoreId)); } catch (e) { console.error(e); }
  };

  const visibleRequests = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.userIdNum || currentUser.id;
    let list = currentUser.role === 'admin' ? projectRequests : projectRequests.filter(r => r.requesterId === myId);
    if (requestStatusFilter !== 'all') list = list.filter(r => r.status === requestStatusFilter);
    return list;
  }, [projectRequests, currentUser, requestStatusFilter]);

  const filteredWorkers = useMemo(() => {
    return approvedUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(workerSearch.toLowerCase().trim());
      const matchesRole = workerRoleFilter === 'all' || user.role === workerRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [approvedUsers, workerSearch, workerRoleFilter]);

  const handleOpenUserModal = (userToEdit) => {
    setUserModalData({ firestoreId: userToEdit.firestoreId, name: userToEdit.name, phone: userToEdit.phone || '', role: userToEdit.role, password: userToEdit.password || '' });
    setShowUserModal(true);
  };

  const handleSaveUserModal = async (e) => {
    e.preventDefault();
    if (!userModalData.firestoreId || !currentUser) return;
    try {
      await updateDoc(doc(db, "users", userModalData.firestoreId), {
        name: userModalData.name,
        phone: userModalData.phone,
        password: userModalData.password,
        ...(currentUser.role === 'admin' ? { role: userModalData.role } : {})
      });
      setShowUserModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (userObj) => {
    if (window.confirm(`Voulez-vous vraiment supprimer ${userObj.name} ? Il n'aura plus accès au site, mais son nom sera conservé dans l'historique des effectifs.`)) {
      try {
        await addDoc(collection(db, "archivedUsers"), {
          name: userObj.name,
          email: userObj.email,
          phone: userObj.phone || '',
          role: userObj.role,
          projectCode: userObj.projectCode || myProjectCode,
          joinedAt: userObj.joinedAt || '',
          deletedAt: new Date().toISOString().split('T')[0]
        });
        await deleteDoc(doc(db, "users", userObj.firestoreId));
      } catch (e) {
        console.error("Erreur suppression utilisateur :", e);
      }
    }
  };

  const handleOpenApproveModal = (user) => {
    setUserToApprove(user);
    setSelectedRoleToAssign('Employé');
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!userToApprove) return;
    try {
      await updateDoc(doc(db, "users", userToApprove.firestoreId), { 
        status: 'approved',
        role: selectedRoleToAssign 
      });
      setShowApproveModal(false);
      setUserToApprove(null);
    } catch (e) { 
      console.error("Erreur approbation :", e); 
    }
  };

  const handleRejectAccount = async (firestoreId) => {
    try { await deleteDoc(doc(db, "users", firestoreId)); } catch (e) { console.error(e); }
  };

  const handleMultipleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    let processedFiles = [];
    let loadedCount = 0;
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        processedFiles.push({ name: file.name, data: reader.result });
        loadedCount++;
        if (loadedCount === selectedFiles.length) {
          setNewPlanData(prev => ({ ...prev, files: [...prev.files, ...processedFiles] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!newPlanData.title || !myProjectCode) return;
    let targetName = 'Toute l’équipe';
    if (newPlanData.targetUserId !== 'all') {
      const foundUser = users.find(u => (u.userIdNum || u.id) === Number(newPlanData.targetUserId));
      if (foundUser) targetName = foundUser.name;
    }
    try {
      await addDoc(collection(db, "plans"), {
        ...newPlanData,
        projectCode: myProjectCode,
        targetUserId: newPlanData.targetUserId === 'all' ? 'all' : Number(newPlanData.targetUserId),
        targetName,
        formattedDate: formatDateFr(newPlanData.date)
      });
      setShowAddPlanModal(false);
      setNewPlanData({ title: '', targetUserId: 'all', date: new Date().toISOString().split('T')[0], description: '', files: [] });
    } catch (e) { console.error(e); }
  };

  const handleDeletePlan = async (firestoreId) => {
    try { if (firestoreId) await deleteDoc(doc(db, "plans", firestoreId)); } catch (e) { console.error(e); }
  };

  const handleDownloadSinglePdf = (fileObj) => {
    if (!fileObj.data) return;
    const link = document.createElement('a');
    link.href = fileObj.data;
    link.download = fileObj.name || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.userIdNum || currentUser.id;
    if (currentUser.role !== 'admin') {
      return projectPlans.filter(p => p.targetUserId === 'all' || p.targetUserId === myId);
    }
    if (selectedWorkerFilter === 'all') return projectPlans;
    return projectPlans.filter(p => p.targetUserId === Number(selectedWorkerFilter));
  }, [projectPlans, currentUser, selectedWorkerFilter]);

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const found = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (!found) { setAuthError("Email introuvable. Veuillez vous inscrire."); return; }
    if (loginPassword !== found.password) { setAuthError("Mot de passe incorrect."); return; }
    if (found.status === 'pending') { setAuthMode('pending'); return; }
    setCurrentUser(found);
    setActiveTab('dashboard');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setAuthError('Veuillez remplir tous les champs.');
      return;
    }
    const existing = users.find(u => u.email.toLowerCase() === regEmail.toLowerCase().trim());
    if (existing) { setAuthError('Cet email est déjà utilisé.'); return; }

    let assignedProjectCode = '';

    if (regIsAdmin) {
      assignedProjectCode = 'CHANTIER-' + Math.floor(1000 + Math.random() * 9000);
    } else {
      const trimmedCode = regProjectCode.toUpperCase().trim();
      const chefExists = users.some(u => u.role === 'admin' && u.projectCode === trimmedCode);
      if (!chefExists) {
        setAuthError("Code de chantier introuvable. Vérifiez le code avec votre chef d'équipe.");
        return;
      }
      assignedProjectCode = trimmedCode;
    }

    const newUser = {
      userIdNum: Date.now(),
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: regIsAdmin ? 'admin' : 'Employé',
      team: regIsAdmin ? 'Direction Chantier' : 'Ouvriers',
      status: regIsAdmin ? 'approved' : 'pending',
      projectCode: assignedProjectCode,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    try {
      await addDoc(collection(db, "users"), newUser);
      if (regIsAdmin) {
        setCurrentUser(newUser);
        setActiveTab('dashboard');
      } else {
        setAuthMode('pending');
      }
    } catch (e) {
      console.error(e);
      setAuthError("Erreur lors de l'inscription.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setLoginEmail('');
    setLoginPassword('');
  };

  const isAdmin = currentUser?.role === 'admin';

  if (!currentUser) {
    return (
      <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 filter brightness-[0.35] scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=2000&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/60 z-0" />

        <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden">
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 bg-blue-600/20 border border-blue-400/30 rounded-2xl mb-3 shadow-inner">
              <Building2 className="w-9 h-9 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider">BÂTIR+ <span className="text-blue-400 font-light">PRO</span></h1>
            <p className="text-xs text-slate-300 mt-1 font-medium tracking-wide">La solution globale pour le suivi de vos chantiers, matériels et équipes.</p>
          </div>

          {authMode === 'pending' ? (
            <div className="text-center py-6 space-y-4">
              <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
              <h2 className="text-lg font-semibold text-white">Compte en Attente de Validation</h2>
              <p className="text-xs text-slate-300">Votre inscription a bien été enregistrée. Votre administrateur doit valider votre accès avec votre code de chantier.</p>
              <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl font-medium transition-colors border border-white/10">Retour à la connexion</button>
            </div>
          ) : (
            <>
              <div className="flex rounded-xl bg-black/30 p-1 mb-6 border border-white/10">
                <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Connexion</button>
                <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Inscription</button>
              </div>

              {authError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-200 font-medium">{authError}</div>}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="votre@email.fr" className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
                    <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 transition-colors font-bold rounded-xl text-xs text-white shadow-lg shadow-blue-600/30">Se Connecter</button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nom complet</label>
                    <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="Jean Martin" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean@batipluspro.fr" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Numéro de téléphone</label>
                    <input type="tel" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="06 12 34 56 78" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
                    <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input type="checkbox" checked={regIsAdmin} onChange={e => setRegIsAdmin(e.target.checked)} className="rounded border-slate-700 bg-black/40 text-blue-600 focus:ring-blue-500" />
                      <span>Je crée un compte administrateur</span>
                    </label>

                    {!regIsAdmin && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Code de chantier de votre administrateur</label>
                        <input type="text" required={!regIsAdmin} value={regProjectCode} onChange={e => setRegProjectCode(e.target.value)} placeholder="ex: CHANTIER-4821" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none" />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors font-bold rounded-xl text-xs text-white shadow-lg shadow-emerald-600/30 mt-2">S'inscrire</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-wide">BÂTIR+ <span className="text-blue-600 font-light">PRO</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="font-bold text-slate-900">{currentUser.name}</span>
            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">{isAdmin ? 'CHEF / ADMIN' : currentUser.role.toUpperCase()}</span>
            {isAdmin && <span className="ml-2 font-mono text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-200">Code : {myProjectCode}</span>}
          </div>
          
          <button onClick={() => handleOpenUserModal(currentUser)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs px-2.5 font-medium border border-slate-200 flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-slate-500" /> <span className="hidden sm:inline">Mon Profil</span>
          </button>
          <button onClick={handleLogout} title="Se déconnecter" className="p-1.5 text-slate-400 hover:text-red-600"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="bg-white/85 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab !== 'dashboard' && (
            <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5" /> Retour
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium">{activeTab === 'dashboard' ? '📊 Tableau de bord du chantier' : `📂 Module : ${activeTab.toUpperCase()}`}</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        
        {/* BANDEAU D'INSTALLATION PWA (S'affiche uniquement si l'app n'est PAS installée) */}
        {!isStandalone && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 rounded-3xl shadow-lg border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md">
                <Smartphone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Installez BÂTIR+ PRO sur votre téléphone !</h4>
                <p className="text-xs text-slate-300 mt-0.5">Accédez à l'application en un clic depuis votre écran d'accueil, sans passer par le navigateur.</p>
              </div>
            </div>
            <button 
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              📱 Installer l'application
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-blue-900/50">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 border border-blue-400/30">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-wide">BÂTIR+ <span className="text-blue-400 font-light">PRO</span></h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-md">Espace de gestion de votre équipe et de votre chantier.</p>

                {isAdmin && (
                  <div className="mt-4 px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-xs flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-300" />
                    <span>Votre code de chantier à partager : <strong className="font-mono font-bold text-white tracking-widest">{myProjectCode}</strong></span>
                  </div>
                )}

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connecté : <strong className="text-white">{currentUser.name}</strong> 
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div onClick={() => setActiveTab('planning')} className="group bg-white border border-slate-200/80 hover:border-cyan-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-2xl"><CalendarIcon className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-full">{projectPlans.length} dispo</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600">Planning </h3>
                  <p className="text-xs text-slate-500 mt-1"> Retrouvez vos tâches programmées </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('requests')} className="group bg-white border border-slate-200/80 hover:border-amber-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl"><ClipboardList className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">{visibleRequests.length} demandes</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600">Demandes Matériel & Fournitures </h3>
                  <p className="text-xs text-slate-500 mt-1">Transmettez tous vos besoins EPI, outillage, fournitures. </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('workers')} className="group bg-white border border-slate-200/80 hover:border-emerald-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl"><Users className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">{approvedUsers.length} actifs</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600">Effectifs</h3>
                  <p className="text-xs text-slate-500 mt-1">Annuaire de votre équipe et numéros.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('tools')} className="group bg-white border border-slate-200/80 hover:border-indigo-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl"><Wrench className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{projectEquipment.length} machines</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">Parc Outillage</h3>
                  <p className="text-xs text-slate-500 mt-1">Suivi du parc et des maintenances.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {isAdmin && (
                <div onClick={() => setActiveTab('accounts')} className="group bg-white border border-slate-200/80 hover:border-purple-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl"><UserCheck className="w-6 h-6" /></div>
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">{pendingUsers.length} en attente</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600">Validation des Comptes</h3>
                    <p className="text-xs text-slate-500 mt-1">Validez les comptes qui ont utilisé votre code.</p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                    <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE PLANNING --- */}
        {activeTab === 'planning' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-cyan-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-cyan-600/20 border border-cyan-400/30 rounded-2xl">
                  <CalendarIcon className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Planning & Feuilles de Route</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Suivi des interventions chantier et documents techniques associés.</p>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => setShowAddPlanModal(true)} className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
                  <Plus className="w-4 h-4" /> Assigner une Tâche 
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlans.map(plan => (
                <div key={plan.firestoreId} className="bg-white border border-slate-200/80 hover:border-cyan-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span className="px-3 py-1 rounded-xl font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">📅 {plan.formattedDate || formatDateFr(plan.date)}</span>
                      <span className="text-slate-500 font-medium">Pour : <strong className="text-slate-800">{plan.targetName}</strong></span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{plan.title}</h3>
                    {plan.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{plan.description}</p>}

                    <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documents ({plan.files ? plan.files.length : 0})</span>
                      {plan.files && plan.files.map((fileObj, fIdx) => (
                        <div key={fIdx} className="p-2.5 bg-slate-50 hover:bg-cyan-50/50 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-red-50 text-red-500 rounded-xl"><FileText className="w-4 h-4" /></div>
                            <span className="text-xs text-slate-800 font-semibold truncate max-w-[130px]">{fileObj.name}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf(fileObj)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] rounded-xl font-bold flex items-center gap-1 shadow-sm transition-all">
                            <Download className="w-3 h-3" /> Ouvrir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button onClick={() => handleDeletePlan(plan.firestoreId)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-xl font-semibold transition-colors">Supprimer</button>
                    </div>
                  )}
                </div>
              ))}

              {visiblePlans.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                  <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl mx-auto flex items-center justify-center">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aucune tâche assignée</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Il n'y a actuellement aucun planning ou feuille de route à afficher pour cette période.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE DEMANDES DE MATÉRIEL --- */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-amber-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-600/20 border border-amber-400/30 rounded-2xl">
                  <ClipboardList className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Demandes de Matériel & Fournitures</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Suivi des besoins en raccords, tubes et équipements pour les chantiers.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select value={requestStatusFilter} onChange={e => setRequestStatusFilter(e.target.value)} className="px-3.5 py-2.5 bg-black/40 border border-white/20 text-xs text-white rounded-xl focus:outline-none">
                  <option value="all" className="bg-slate-900">🔍 Tous les statuts</option>
                  <option value="En attente" className="bg-slate-900">⏳ En attente</option>
                  <option value="Validé / Commandé" className="bg-slate-900">✅ Validé</option>
                  <option value="Reçu au dépôt" className="bg-slate-900">📦 Reçu</option>
                </select>
                <button onClick={() => setShowAddRequestModal(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all">
                  <Plus className="w-4 h-4" /> Nouvelle Demande
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleRequests.map(req => (
                <div key={req.firestoreId} className="bg-white border border-slate-200/80 hover:border-amber-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span className="text-slate-500 font-medium">Par : <strong className="text-slate-800">{req.requester}</strong></span>
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${req.urgency === 'Urgent' ? 'bg-amber-50 text-amber-700 border border-amber-200' : req.urgency === 'Critique' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{req.urgency}</span>
                    </div>
                    
                    <h3 className="text-base font-bold text-slate-900">{req.items}</h3>
                    <div className="inline-block mt-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded-lg border border-slate-200">Qté : {req.quantity}</div>

                    {req.description && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{req.description}</p>}

                    {req.attachmentData && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                        <span className="text-xs text-slate-800 font-medium truncate max-w-[130px]">📎 {req.attachmentName}</span>
                        <button onClick={() => handleDownloadSinglePdf({ name: req.attachmentName, data: req.attachmentData })} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] rounded-xl font-bold">Ouvrir</button>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">STATUT</span>
                      {isAdmin ? (
                        <select value={req.status} onChange={(e) => handleUpdateRequestStatus(req.firestoreId, e.target.value)} className="px-3 py-1.5 text-xs font-semibold rounded-xl border bg-slate-50 border-slate-200 focus:outline-none">
                          <option value="En attente">⏳ En attente</option>
                          <option value="Validé / Commandé">✅ Validé</option>
                          <option value="Reçu au dépôt">📦 Reçu</option>
                          <option value="Refusé">❌ Refusé</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200">{req.status}</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button onClick={() => handleDeleteRequest(req.firestoreId)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors">Supprimer</button>
                    </div>
                  )}
                </div>
              ))}

              {visibleRequests.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aucune demande de matériel</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Aucune commande ou besoin matériel n'a été enregistré pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE EFFECTIFS --- */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-600/20 border border-emerald-400/30 rounded-2xl">
                  <Users className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Annuaire & Gestion des Effectifs</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Liste des collaborateurs rattachés à votre chantier.</p>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input type="text" value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Rechercher un collaborateur..." className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(user => (
                <div key={user.firestoreId} className="bg-white border border-slate-200/80 hover:border-emerald-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">{user.role}</span>
                    </div>

                    <a 
                      href={`tel:${user.phone ? user.phone.replace(/\s+/g, '') : ''}`}
                      className="mt-4 flex items-center gap-3 text-xs text-slate-700 bg-emerald-50/50 hover:bg-emerald-100/80 p-3 rounded-2xl border border-emerald-200/60 transition-colors group cursor-pointer"
                      title="Cliquer pour appeler"
                    >
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Téléphone (Appel direct)</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{formatPhoneFr(user.phone)}</span>
                      </div>
                    </a>

                    <div className="mt-2 text-[11px] text-slate-400 font-medium">Inscrit le : {user.joinedAt}</div>
                  </div>

                  {(isAdmin || user.email === currentUser.email) && (
                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <button onClick={() => handleOpenUserModal(user)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">Modifier</button>
                      {isAdmin && user.email !== currentUser.email && (
                        <button onClick={() => handleDeleteUser(user)} className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-xl transition-colors font-bold" title="Supprimer et archiver">🗑️</button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredWorkers.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aucun collaborateur trouvé</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Aucun membre ne correspond à votre recherche ou l'équipe est vide.</p>
                </div>
              )}
            </div>

            {isAdmin && projectArchivedUsers.length > 0 && (
              <div className="mt-12 space-y-4 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Archive className="w-5 h-5 text-slate-500" />
                  <h3 className="text-base font-bold">Historique des effectifs archivés</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {projectArchivedUsers.map((arch, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800 text-sm">{arch.name}</span>
                          <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">{arch.role}</span>
                          <p className="text-slate-400 mt-0.5">Tél : {formatPhoneFr(arch.phone)} | Supprimé le : {arch.deletedAt}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 font-semibold rounded-xl border border-red-100">Accès révoqué</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- MODULE PARC OUTILLAGE --- */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-indigo-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600/20 border border-indigo-400/30 rounded-2xl">
                  <Wrench className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Parc Outillage</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Suivi du parc, des maintenances et de leur affectation.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select value={toolStatusFilter} onChange={e => setToolStatusFilter(e.target.value)} className="px-3.5 py-2.5 bg-black/40 border border-white/20 text-xs text-white rounded-xl focus:outline-none">
                  <option value="all" className="bg-slate-900">🔍 Tous les statuts</option>
                  <option value="Disponible" className="bg-slate-900">🟢 Disponible</option>
                  <option value="En service" className="bg-slate-900">⚡ Attribué</option>
                  <option value="En révision" className="bg-slate-900">🛠️ En révision</option>
                </select>
                {isAdmin && (
                  <button onClick={() => setShowAddToolModal(true)} className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                    <Plus className="w-4 h-4" /> Ajouter une Machine
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map(tool => (
                <div key={tool.firestoreId} className="bg-white border border-slate-200/80 hover:border-indigo-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded-xl border border-indigo-100">{tool.id}</span>
                      <span className="text-xs text-slate-500 font-medium">{tool.brand || 'REMS'}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{tool.name}</h3>

                    <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <div className="flex justify-between"><span className="text-slate-500 font-medium">Statut :</span><span className="font-bold text-emerald-600">{tool.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-medium">Affecté à :</span><span className="font-bold text-slate-800">{tool.assignedTo}</span></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold rounded-xl transition-colors">
                      💬 Notes ({tool.notes?.length || 0})
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleOpenEditModal(tool)} className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-colors">Modifier</button>
                        <button onClick={() => handleDeleteTool(tool.firestoreId)} className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {filteredEquipment.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aucune machine trouvée</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Aucun outil ne correspond à votre recherche ou le parc est vide.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VALIDATION COMPTES (ADMIN) --- */}
        {activeTab === 'accounts' && isAdmin && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-purple-900/40 flex items-center gap-4">
              <div className="p-4 bg-purple-600/20 border border-purple-400/30 rounded-2xl">
                <UserCheck className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-wide">Validation des Collaborateurs</h2>
                <p className="text-xs text-slate-300 mt-0.5">Gérez les demandes d'accès des utilisateurs : <strong className="font-mono text-white">{myProjectCode}</strong></p>
              </div>
            </div>

            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.firestoreId} className="bg-white border border-slate-200/80 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{user.name} <span className="text-xs font-normal text-slate-500">({user.email})</span></h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-600" /> <span className="font-mono">{formatPhoneFr(user.phone)}</span></p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => handleOpenApproveModal(user)} className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all">Approuver & Assigner un rôle</button>
                    <button onClick={() => handleRejectAccount(user.firestoreId)} className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">Refuser</button>
                  </div>
                </div>
              ))}

              {pendingUsers.length === 0 && (
                <div className="py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aucun compte en attente</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Tous les utilisateurs ayant demandé l'accès avec votre code de chantier ont été validés.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALES --- */}
      {showApproveModal && userToApprove && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmApprove} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Approuver l'accès pour {userToApprove.name}</h3>
            <p className="text-xs text-slate-500">Veuillez choisir le rôle à attribuer à ce collaborateur au sein de votre équipe :</p>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Rôle dans l'équipe</label>
              <select 
                value={selectedRoleToAssign} 
                onChange={e => setSelectedRoleToAssign(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold"
              >
                <option value="Employé">👷‍♂️ Employé</option>
                <option value="Intérimaire">⚡ Intérimaire</option>
                <option value="admin">🛡️ Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold rounded-xl transition-colors">Annuler</button>
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold rounded-xl shadow-md transition-all">Valider l'entrée</button>
            </div>
          </form>
        </div>
      )}

      {selectedTool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">{selectedTool.name}</h3>
              <button onClick={() => setSelectedTool(null)}>✕</button>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Ajouter une note..." className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
              <button onClick={() => handleAddNote(selectedTool)} className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-xl">Ajouter</button>
            </div>
            <div className="space-y-2">
              {selectedTool.notes?.map(note => (
                <div key={note.id} className="p-2 bg-slate-50 rounded-lg text-xs"><span className="text-slate-400 font-bold">{note.date} : </span>{note.text}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingTool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveToolEdit} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Modifier l'outil</h3>
            <select value={editToolForm.assignedTo} onChange={e => setEditToolForm({...editToolForm, assignedTo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="Dépôt">📦 Dépôt</option>
              {approvedUsers.map(u => <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>)}
            </select>
            <select value={editToolForm.status} onChange={e => setEditToolForm({...editToolForm, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="Disponible">🟢 Disponible</option>
              <option value="Attribué">⚡ Attribué</option>
              <option value="En révision">🛠️ En révision</option>
            </select>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingTool(null)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl">Enregistrer</button></div>
          </form>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveUserModal} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Modifier mon profil</h3>
            <input type="text" value={userModalData.name} onChange={e => setUserModalData({...userModalData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" required />
            <input type="tel" value={userModalData.phone} onChange={e => setUserModalData({...userModalData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" required />
            <input type="password" placeholder="Nouveau mot de passe" value={userModalData.password} onChange={e => setUserModalData({...userModalData, password: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs rounded-xl">Enregistrer</button></div>
          </form>
        </div>
      )}

      {showAddRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateRequest} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Demande de matériel</h3>
            <input type="text" placeholder="Matériel (ex: Coudes Ø20)" value={newRequestData.items} onChange={e => setNewRequestData({...newRequestData, items: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <input type="number" min="1" value={newRequestData.quantity} onChange={e => setNewRequestData({...newRequestData, quantity: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <select value={newRequestData.urgency} onChange={e => setNewRequestData({...newRequestData, urgency: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critique">Critique</option>
            </select>
            <input type="file" accept="image/*,.pdf" onChange={handleRequestAttachmentChange} className="w-full text-xs" />
            <textarea placeholder="Précisions..." value={newRequestData.description} onChange={e => setNewRequestData({...newRequestData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs h-20" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddRequestModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-amber-600 text-white text-xs rounded-xl font-semibold">Envoyer</button></div>
          </form>
        </div>
      )}

      {showAddPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadPlan} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Assigner une Tâche</h3>
            <input type="text" placeholder="Titre intervention" value={newPlanData.title} onChange={e => setNewPlanData({...newPlanData, title: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <select value={newPlanData.targetUserId} onChange={e => setNewPlanData({...newPlanData, targetUserId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="all">Toute l'équipe</option>
              {approvedUsers.map(u => <option key={u.firestoreId} value={u.userIdNum || u.id}>{u.name}</option>)}
            </select>
            <input type="date" value={newPlanData.date} onChange={e => setNewPlanData({...newPlanData, date: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <input type="file" accept=".pdf" multiple onChange={handleMultipleFilesChange} className="w-full text-xs" />
            <textarea placeholder="Consignes..." value={newPlanData.description} onChange={e => setNewPlanData({...newPlanData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs h-20" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-cyan-600 text-white text-xs rounded-xl font-semibold">Publier</button></div>
          </form>
        </div>
      )}

      {showAddToolModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Ajouter une machine</h3>
            <input type="text" placeholder="ID (ex: REM-04)" value={newToolData.id} onChange={e => setNewToolData({...newToolData, id: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <input type="text" placeholder="Nom de la machine" value={newToolData.name} onChange={e => setNewToolData({...newToolData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <select value={newToolData.assignedTo} onChange={e => setNewToolData({...newToolData, assignedTo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="Dépôt">📦 Dépôt</option>
              {approvedUsers.map(u => <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>)}
            </select>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-semibold">Ajouter</button></div>
          </form>
        </div>
      )}
    </div>
  );
}