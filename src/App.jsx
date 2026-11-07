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
  Video,
  Play,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Key
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'pending'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Champs Formulaires d'authentification
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regIsAdmin, setRegIsAdmin] = useState(false); // True = Créateur de chantier, False = Ouvrier/Intérimaire
  const [regProjectCode, setRegProjectCode] = useState(''); // Code chantier rentré par l'ouvrier
  const [authError, setAuthError] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalData, setUserModalData] = useState({ firestoreId: '', name: '', phone: '', role: 'Employé', password: '' });

  // Données Firestore globales
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [videos, setVideos] = useState([]);

  // États des modules internes
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

  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [newVideoData, setNewVideoData] = useState({ title: '', category: 'Sécurité & Posture', url: '', description: '' });

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('all');
  const [newPlanData, setNewPlanData] = useState({ title: '', targetUserId: 'all', date: new Date().toISOString().split('T')[0], description: '', files: [] });

  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [newRequestData, setNewRequestData] = useState({ items: '', quantity: 1, urgency: 'Normal', description: '', attachmentName: '', attachmentData: '' });

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
        return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
      }
    } catch (e) {
      console.error(e);
    }
    return dateString;
  };

  // Chargement des données Firestore
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
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

    const unsubVideos = onSnapshot(collection(db, "videos"), (snapshot) => {
      const vList = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      if (vList.length === 0) {
        const defaultVideos = [
          { title: 'Prévention des TMS - Motion Design', category: 'Sécurité & Posture', url: 'http://www.youtube.com/watch?v=a4niEbOorAk', description: 'Vidéo de sensibilisation en motion design sur la prévention des Troubles Musculosquelettiques (TMS).' },
          { title: 'Technique de sertissage Multicouche REMS', category: 'Technique Plomberie', url: 'https://www.youtube.com/watch?v=zlmTvpTUdNM', description: 'Procédure standard de préparation du tube, ébavurage et sertissage sécurisé.' }
        ];
        defaultVideos.forEach(v => addDoc(collection(db, "videos"), v));
      } else {
        setVideos(vList);
      }
    });

    return () => {
      unsubUsers();
      unsubEquipment();
      unsubRequests();
      unsubPlans();
      unsubVideos();
    };
  }, []);

  // Mettre à jour l'utilisateur connecté en temps réel si sa fiche change
  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.firestoreId === currentUser.firestoreId);
      if (updated) setCurrentUser(updated);
    }
  }, [users]);

  // ID du projet/chantier de l'utilisateur connecté (Si admin = son projectCode, si employé = son projectCode rattaché)
  const myProjectCode = currentUser?.projectCode || currentUser?.adminProjectCode;

  // --- FILTRAGE DES DONNÉES SELON LE CHANTIER ACTIF ---
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

  const approvedUsers = useMemo(() => projectUsers.filter(u => u.status === 'approved'), [projectUsers]);
  const pendingUsers = useMemo(() => projectUsers.filter(u => u.status === 'pending' && u.role !== 'admin'), [projectUsers]);

  // --- GESTION OUTILLAGE ---
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
    if (!newToolData.name || !newToolData.id || !myProjectCode) return;
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
    if (!editingTool || !editingTool.firestoreId) return;
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
    if (!newNoteText.trim() || !tool.firestoreId) return;
    const noteObj = { id: Date.now(), author: currentUser.name, date: new Date().toISOString().split('T')[0], text: newNoteText };
    try {
      const toolRef = doc(db, "equipment", tool.firestoreId);
      const updatedNotes = [noteObj, ...(tool.notes || [])];
      await updateDoc(toolRef, { notes: updatedNotes });
      setNewNoteText('');
      setSelectedTool(prev => ({ ...prev, notes: updatedNotes }));
    } catch (e) { console.error(e); }
  };

  // --- GESTION VIDÉOS ---
  const handleCreateVideo = async (e) => {
    e.preventDefault();
    if (!newVideoData.title || !newVideoData.url) return;
    try {
      await addDoc(collection(db, "videos"), newVideoData);
      setShowAddVideoModal(false);
      setNewVideoData({ title: '', category: 'Sécurité & Posture', url: '', description: '' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteVideo = async (firestoreId) => {
    try { if (firestoreId) await deleteDoc(doc(db, "videos", firestoreId)); } catch (e) { console.error(e); }
  };

  // --- GESTION DEMANDES DE MATÉRIEL ---
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
    if (!newRequestData.items || !myProjectCode) return;
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
    const myId = currentUser.userIdNum || currentUser.id;
    let list = currentUser.role === 'admin' ? projectRequests : projectRequests.filter(r => r.requesterId === myId);
    if (requestStatusFilter !== 'all') list = list.filter(r => r.status === requestStatusFilter);
    return list;
  }, [projectRequests, currentUser, requestStatusFilter]);

  // --- GESTION EFFECTIFS & COMPTES ---
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
    if (!userModalData.firestoreId) return;
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

  const handleDeleteUser = async (firestoreId) => {
    if (window.confirm("Supprimer cet utilisateur de votre chantier ?")) {
      try { await deleteDoc(doc(db, "users", firestoreId)); } catch (e) { console.error(e); }
    }
  };

  const handleApproveAccount = async (firestoreId) => {
    try { await updateDoc(doc(db, "users", firestoreId), { status: 'approved' }); } catch (e) { console.error(e); }
  };

  const handleRejectAccount = async (firestoreId) => {
    try { await deleteDoc(doc(db, "users", firestoreId)); } catch (e) { console.error(e); }
  };

  // --- GESTION PLANNING & PDFs ---
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

  const handleRemoveFileIndex = (idx) => {
    setNewPlanData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
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
    const myId = currentUser.userIdNum || currentUser.id;
    if (currentUser.role !== 'admin') {
      return projectPlans.filter(p => p.targetUserId === 'all' || p.targetUserId === myId);
    }
    if (selectedWorkerFilter === 'all') return projectPlans;
    return projectPlans.filter(p => p.targetUserId === Number(selectedWorkerFilter));
  }, [projectPlans, currentUser, selectedWorkerFilter]);

  // --- AUTHENTIFICATION ---
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
      // Création d'un nouveau chantier / Code unique
      assignedProjectCode = 'CHANTIER-' + Math.floor(1000 + Math.random() * 9000);
    } else {
      // Inscription d'un ouvrier avec le code de son chef
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
      status: regIsAdmin ? 'approved' : 'pending', // L'admin a accès direct, l'ouvrier est en attente
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

  // --- ÉCRAN DE CONNEXION / INSCRIPTION ---
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
            <p className="text-xs text-slate-300 mt-1 font-medium tracking-wide">Plateforme Chantiers, Matériel & Équipes</p>
          </div>

          {authMode === 'pending' ? (
            <div className="text-center py-6 space-y-4">
              <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
              <h2 className="text-lg font-semibold text-white">Compte en Attente de Validation</h2>
              <p className="text-xs text-slate-300">Votre inscription a bien été enregistrée. Votre chef d'équipe doit valider votre accès avec votre code de chantier.</p>
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean@btppro.fr" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Numéro de téléphone</label>
                    <input type="tel" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="06 12 34 56 78" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
                    <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                  </div>

                  {/* Choix : Créer un chantier (Admin) ou Rejoindre avec un code */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input type="checkbox" checked={regIsAdmin} onChange={e => setRegIsAdmin(e.target.checked)} className="rounded border-slate-700 bg-black/40 text-blue-600 focus:ring-blue-500" />
                      <span>Je suis Chef d'équipe / Je crée un nouveau chantier</span>
                    </label>

                    {!regIsAdmin && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Code de chantier de votre chef</label>
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

  // --- INTERFACE PRINCIPALE DE L'APPLICATION ---
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
                    <span>Votre code de chantier à partager à vos gars : <strong className="font-mono font-bold text-white tracking-widest">{myProjectCode}</strong></span>
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
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600">Planning & PDF</h3>
                  <p className="text-xs text-slate-500 mt-1">Feuilles de route et plans d'exécution.</p>
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
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600">Demandes de Matériel</h3>
                  <p className="text-xs text-slate-500 mt-1">Besoins en raccords, tubes et fournitures.</p>
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
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600">Gestion des Effectifs</h3>
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
                  <p className="text-xs text-slate-500 mt-1">Suivi des sertisseuses, carotteuses et entretien.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('videos')} className="group bg-white border border-slate-200/80 hover:border-rose-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl"><Video className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full">{videos.length} vidéos</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600">Tutos & Sécurité</h3>
                  <p className="text-xs text-slate-500 mt-1">Vidéos de prévention et bonnes pratiques.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
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
                    <p className="text-xs text-slate-500 mt-1">Validez les gars qui ont utilisé votre code.</p>
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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-cyan-600" /> Planning des interventions</h2>
              {isAdmin && (
                <button onClick={() => setShowAddPlanModal(true)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Assigner Tâche & PDFs
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePlans.map(plan => (
                <div key={plan.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">📅 {plan.formattedDate || formatDateFr(plan.date)}</span>
                      <span className="text-slate-500 font-medium">Pour : <strong className="text-slate-800">{plan.targetName}</strong></span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{plan.title}</h3>
                    {plan.description && <p className="text-xs text-slate-600 mt-1">{plan.description}</p>}
                    <div className="mt-3 space-y-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Documents ({plan.files ? plan.files.length : 0}) :</span>
                      {plan.files && plan.files.map((fileObj, fIdx) => (
                        <div key={fIdx} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-slate-800 font-medium truncate max-w-[140px]">📄 {fileObj.name}</span>
                          <button onClick={() => handleDownloadSinglePdf(fileObj)} className="px-2 py-1 bg-cyan-600 text-white text-[11px] rounded-lg font-semibold flex items-center gap-1"><Download className="w-3 h-3" /> Ouvrir</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isAdmin && <div className="pt-2 border-t border-slate-100 flex justify-end"><button onClick={() => handleDeletePlan(plan.firestoreId)} className="text-xs text-red-600 font-medium">Supprimer</button></div>}
                </div>
              ))}
              {visiblePlans.length === 0 && <div className="col-span-full py-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic">Aucune tâche assignée.</div>}
            </div>
          </div>
        )}

        {/* --- MODULE DEMANDES DE MATÉRIEL --- */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-amber-600" /> Demandes de matériel</h2>
              <div className="flex gap-2">
                <select value={requestStatusFilter} onChange={e => setRequestStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl">
                  <option value="all">🔍 Tous les statuts</option>
                  <option value="En attente">⏳ En attente</option>
                  <option value="Validé / Commandé">✅ Validé / Commandé</option>
                  <option value="Reçu au dépôt">📦 Reçu au dépôt</option>
                </select>
                <button onClick={() => setShowAddRequestModal(true)} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Nouvelle Demande
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRequests.map(req => (
                <div key={req.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-500">Par : <strong>{req.requester}</strong></span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">{req.urgency}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{req.items} (Qté : {req.quantity})</h3>
                    {req.description && <p className="text-xs text-slate-600 mt-1">{req.description}</p>}
                    {req.attachmentData && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-800 truncate max-w-[140px]">{req.attachmentName}</span>
                        <button onClick={() => handleDownloadSinglePdf({ name: req.attachmentName, data: req.attachmentData })} className="px-2 py-1 bg-cyan-600 text-white text-[11px] rounded-lg">Ouvrir</button>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Statut :</span>
                      {isAdmin ? (
                        <select value={req.status} onChange={(e) => handleUpdateRequestStatus(req.firestoreId, e.target.value)} className="px-2.5 py-1 text-xs font-semibold rounded-xl border bg-slate-50">
                          <option value="En attente">⏳ En attente</option>
                          <option value="Validé / Commandé">✅ Validé / Commandé</option>
                          <option value="Reçu au dépôt">📦 Reçu au dépôt</option>
                          <option value="Refusé">❌ Refusé</option>
                        </select>
                      ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-100">{req.status}</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && <div className="pt-2 border-t border-slate-100 flex justify-end"><button onClick={() => handleDeleteRequest(req.firestoreId)} className="text-xs text-red-600">Supprimer</button></div>}
                </div>
              ))}
              {visibleRequests.length === 0 && <div className="col-span-full py-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic">Aucune demande.</div>}
            </div>
          </div>
        )}

        {/* --- MODULE EFFECTIFS --- */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Annuaire de l'équipe</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input type="text" value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkers.map(user => (
                <div key={user.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> <span className="font-mono">{user.phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                  {(isAdmin || user.email === currentUser.email) && (
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button onClick={() => handleOpenUserModal(user)} className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium">Modifier</button>
                      {isAdmin && user.email !== currentUser.email && <button onClick={() => handleDeleteUser(user.firestoreId)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg">🗑️</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE TUTOS & SÉCURITÉ --- */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Video className="w-5 h-5 text-rose-600" /> Tutos & Sécurité</h2>
              {isAdmin && <button onClick={() => setShowAddVideoModal(true)} className="px-3 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl"><Plus className="w-4 h-4" /> Ajouter</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(vid => (
                <div key={vid.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-full">{vid.category}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{vid.title}</h3>
                    {vid.description && <p className="text-xs text-slate-600 mt-1">{vid.description}</p>}
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <a href={vid.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1"><Play className="w-3.5 h-3.5 fill-current" /> Regarder</a>
                    {isAdmin && <button onClick={() => handleDeleteVideo(vid.firestoreId)} className="px-3 bg-red-50 text-red-600 text-xs rounded-xl">🗑️</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE PARC OUTILLAGE --- */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Wrench className="w-5 h-5 text-indigo-600" /> Parc Outillage</h2>
              <div className="flex gap-2">
                <select value={toolStatusFilter} onChange={e => setToolStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl">
                  <option value="all">🔍 Tous</option>
                  <option value="Disponible">🟢 Disponible</option>
                  <option value="En service">⚡ En service</option>
                  <option value="En révision">🛠️ En révision</option>
                </select>
                {isAdmin && <button onClick={() => setShowAddToolModal(true)} className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"><Plus className="w-4 h-4" /> Machine</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map(tool => (
                <div key={tool.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded">{tool.id}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{tool.name}</h3>
                    <div className="mt-3 space-y-1.5 text-xs bg-slate-50 p-2 rounded-lg">
                      <div className="flex justify-between"><span className="text-slate-500">Statut :</span><span className="font-semibold text-emerald-600">{tool.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Affecté :</span><span className="font-semibold">{tool.assignedTo}</span></div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex gap-2">
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-1.5 bg-slate-100 text-xs rounded-lg">💬 Notes ({tool.notes?.length || 0})</button>
                    {isAdmin && <button onClick={() => handleOpenEditModal(tool)} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-lg">Modifier</button>}
                    {isAdmin && <button onClick={() => handleDeleteTool(tool.firestoreId)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg">🗑️</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VALIDATION COMPTES (ADMIN) --- */}
        {activeTab === 'accounts' && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Validation des collaborateurs (Code : {myProjectCode})</h2>
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name} ({user.email})</p>
                    <p className="text-xs text-slate-500">Tél : {user.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveAccount(user.firestoreId)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-semibold">Approuver</button>
                    <button onClick={() => handleRejectAccount(user.firestoreId)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg">Refuser</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && <div className="py-6 text-center text-slate-500 text-xs italic bg-white border border-slate-200 rounded-xl">Aucune attente.</div>}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALES (Vidéo, Note, Edit Outil, Profil, Demande, Planning, Machine) --- */}
      {showAddVideoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateVideo} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Ajouter une vidéo</h3>
            <input type="text" placeholder="Titre" value={newVideoData.title} onChange={e => setNewVideoData({...newVideoData, title: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <select value={newVideoData.category} onChange={e => setNewVideoData({...newVideoData, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="Sécurité & Posture">Sécurité & Posture</option>
              <option value="Technique Plomberie">Technique Plomberie</option>
            </select>
            <input type="url" placeholder="Lien YouTube" value={newVideoData.url} onChange={e => setNewVideoData({...newVideoData, url: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" />
            <textarea placeholder="Description" value={newVideoData.description} onChange={e => setNewVideoData({...newVideoData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs h-20" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddVideoModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-rose-600 text-white text-xs rounded-xl font-semibold">Publier</button></div>
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
              <option value="Dépôt Central">📦 Dépôt Central</option>
              {approvedUsers.map(u => <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>)}
            </select>
            <select value={editToolForm.status} onChange={e => setEditToolForm({...editToolForm, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs">
              <option value="Disponible">🟢 Disponible</option>
              <option value="En service">⚡ En service</option>
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
            <h3 className="text-lg font-bold text-slate-900">Assigner Tâche & PDFs</h3>
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
              <option value="Dépôt Central">📦 Dépôt Central</option>
              {approvedUsers.map(u => <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>)}
            </select>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl">Annuler</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-semibold">Ajouter</button></div>
          </form>
        </div>
      )}
    </div>
  );
}