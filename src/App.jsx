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
  Settings
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toolSearch, setToolSearch] = useState('');
  const [toolStatusFilter, setToolStatusFilter] = useState('all');

  const [editingTool, setEditingTool] = useState(null);
  const [editToolForm, setEditToolForm] = useState({ assignedTo: '', status: '' });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalData, setUserModalData] = useState({ firestoreId: '', name: '', phone: '', role: 'Employé', password: '' });

  // Données Firestore
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);

  const [selectedTool, setSelectedTool] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteData, setNewSiteData] = useState({ name: '', client: '', address: '', manager: 'Marc Vasseur' });
  
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
  const [planningViewMode, setPlanningViewMode] = useState('week');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('all');
  
  const [newPlanData, setNewPlanData] = useState({
    title: '',
    targetUserId: 'all',
    date: new Date().toISOString().split('T')[0],
    description: '',
    files: []
  });

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

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      
      if (usersList.length === 0) {
        const defaultAdmin = {
          userIdNum: 1,
          name: 'Jean Dupont',
          email: 'admin@btppro.fr',
          phone: '06 12 34 56 78',
          password: 'admin',
          role: 'admin',
          team: 'Direction',
          status: 'approved',
          joinedAt: '2024-01-10'
        };
        addDoc(collection(db, "users"), defaultAdmin);
      } else {
        setUsers(usersList);
      }
    });

    const unsubEquipment = onSnapshot(collection(db, "equipment"), (snapshot) => {
      const eqList = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
      if (eqList.length === 0) {
        const defaultTools = [
          { id: 'REM-01', name: 'Sertisseuse radiale REMS Power-Press', brand: 'REMS', category: 'Sertissage', status: 'Disponible', assignedTo: 'Dépôt Central', notes: [] },
          { id: 'REM-02', name: 'Carotteuse diamant REMS Picus S1', brand: 'REMS', category: 'Carottage', status: 'En service', assignedTo: 'Chantier Air Bel', notes: [] },
          { id: 'VIR-03', name: 'Cintreuse hydraulique Virax', brand: 'Virax', category: 'Cintrage', status: 'Disponible', assignedTo: 'Dépôt Central', notes: [] }
        ];
        defaultTools.forEach(t => addDoc(collection(db, "equipment"), t));
      } else {
        setEquipment(eqList);
      }
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
      unsubUsers();
      unsubEquipment();
      unsubSites();
      unsubRequests();
      unsubPlans();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.firestoreId === currentUser.firestoreId);
      if (updated) {
        setCurrentUser(updated);
      }
    }
  }, [users]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(tool => {
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
  }, [equipment, toolSearch, toolStatusFilter]);

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
        notes: []
      });
      setShowAddToolModal(false);
      setNewToolData({ id: '', name: '', brand: 'REMS', category: 'Sertissage', status: 'Disponible', assignedTo: 'Dépôt Central' });
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
    setEditToolForm({ assignedTo: tool.assignedTo || 'Dépôt Central', status: tool.status || 'Disponible' });
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
        requesterId: currentUser.userIdNum || currentUser.id,
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
    const myId = currentUser.userIdNum || currentUser.id;
    let list = currentUser.role === 'admin' ? requests : requests.filter(r => r.requesterId === myId);
    
    if (requestStatusFilter !== 'all') {
      list = list.filter(r => r.status === requestStatusFilter);
    }
    return list;
  }, [requests, currentUser, requestStatusFilter]);

  const approvedUsers = useMemo(() => users.filter(u => u.status === 'approved'), [users]);

  const filteredWorkers = useMemo(() => {
    return approvedUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(workerSearch.toLowerCase().trim());
      const matchesRole = workerRoleFilter === 'all' || user.role === workerRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [approvedUsers, workerSearch, workerRoleFilter]);

  const handleOpenUserModal = (userToEdit) => {
    setUserModalData({
      firestoreId: userToEdit.firestoreId,
      name: userToEdit.name,
      phone: userToEdit.phone || '',
      role: userToEdit.role,
      password: userToEdit.password || ''
    });
    setShowUserModal(true);
  };

  const handleSaveUserModal = async (e) => {
    e.preventDefault();
    if (!userModalData.firestoreId) return;

    try {
      const userRef = doc(db, "users", userModalData.firestoreId);
      const updatePayload = {
        name: userModalData.name,
        phone: userModalData.phone,
        password: userModalData.password
      };
      if (currentUser.role === 'admin') {
        updatePayload.role = userModalData.role;
      }

      await updateDoc(userRef, updatePayload);
      setShowUserModal(false);
    } catch (error) {
      console.error("Erreur mise à jour profil :", error);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const handleDeleteUser = async (firestoreId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Il n'aura plus accès à l'application.")) {
      try {
        await deleteDoc(doc(db, "users", firestoreId));
      } catch (error) {
        console.error("Erreur suppression utilisateur :", error);
      }
    }
  };

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
      const foundUser = users.find(u => (u.userIdNum || u.id) === Number(newPlanData.targetUserId));
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
      setAuthError("Adresse email introuvable. Veuillez vous inscrire d'abord.");
      return;
    }

    if (loginPassword !== found.password) {
      setAuthError("Mot de passe incorrect.");
      return;
    }

    if (found.status === 'pending') {
      setAuthMode('pending');
      return;
    }

    setCurrentUser(found);
    setActiveTab('dashboard');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setAuthError('Veuillez remplir tous les champs, y compris le numéro de téléphone.');
      return;
    }

    const existing = users.find(u => u.email.toLowerCase() === regEmail.toLowerCase().trim());
    if (existing) {
      setAuthError('Cette adresse email est déjà utilisée.');
      return;
    }

    const newUser = {
      userIdNum: Date.now(),
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword, 
      role: 'Employé', 
      team: 'Ouvriers',
      status: 'pending', 
      joinedAt: new Date().toISOString().split('T')[0]
    };

    try {
      await addDoc(collection(db, "users"), newUser);
      setAuthMode('pending');
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      setAuthError("Erreur lors de l'enregistrement en ligne.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleApproveAccount = async (firestoreId) => {
    try {
      await updateDoc(doc(db, "users", firestoreId), { status: 'approved' });
    } catch (error) {
      console.error("Erreur approbation :", error);
    }
  };

  const handleRejectAccount = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "users", firestoreId));
    } catch (error) {
      console.error("Erreur refus :", error);
    }
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  
  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.userIdNum || currentUser.id;
    if (currentUser.role !== 'admin') {
      return plans.filter(p => p.targetUserId === 'all' || p.targetUserId === myId);
    }
    if (selectedWorkerFilter === 'all') return plans;
    return plans.filter(p => p.targetUserId === Number(selectedWorkerFilter));
  }, [plans, currentUser, selectedWorkerFilter]);

  const isAdmin = currentUser?.role === 'admin';

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 p-6 text-center">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-3 backdrop-blur-sm">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">BÂTIR+</h1>
            <p className="text-xs text-blue-100 mt-1">Plateforme Chantiers, Matériel & Équipes</p>
          </div>

          <div className="p-6">
            {authMode === 'pending' ? (
              <div className="text-center py-6 space-y-4">
                <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                <h2 className="text-lg font-semibold text-slate-800">Compte en Attente de Validation</h2>
                <p className="text-xs text-slate-600">Votre inscription a bien été enregistrée. L'administrateur doit valider votre compte et vous attribuer un rôle avant de vous donner l'accès.</p>
                <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium transition-colors">Retour à la connexion</button>
              </div>
            ) : (
              <>
                <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>Connexion</button>
                  <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'}`}>Inscription</button>
                </div>

                {authError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">{authError}</div>}

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@btppro.fr" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe</label>
                      <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 transition-colors font-semibold rounded-xl text-xs text-white shadow-md shadow-blue-500/20">Se Connecter</button>
                    <div className="pt-3 border-t border-slate-100 flex justify-center gap-2">
                      <button type="button" onClick={() => { setLoginEmail('admin@btppro.fr'); setLoginPassword('admin'); }} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-blue-600 text-[11px] font-medium rounded-lg transition-colors">Démo Admin</button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nom complet</label>
                      <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="Jean Martin" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean@btppro.fr" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de téléphone <span className="text-red-500">*</span></label>
                      <input type="tel" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="06 12 34 56 78" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe</label>
                      <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition-colors font-semibold rounded-xl text-xs text-white shadow-md shadow-emerald-500/20">S'inscrire</button>
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
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-wide">BÂTIR+</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="font-bold text-slate-900">{currentUser.name}</span>
            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">{isAdmin ? 'ADMIN' : currentUser.role.toUpperCase()}</span>
          </div>
          
          <button 
            onClick={() => handleOpenUserModal(currentUser)} 
            title="Modifier mon profil"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs px-2.5 font-medium border border-slate-200"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" /> <span className="hidden sm:inline">Mon Profil</span>
          </button>

          <button onClick={handleLogout} title="Se déconnecter" className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab !== 'dashboard' && (
            <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition-all shadow-sm font-medium border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5" /> Retour au Tableau de bord
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {activeTab === 'dashboard' ? '📊 Vue d\'ensemble de l\'activité' : `📂 Module : ${activeTab.toUpperCase()}`}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>👋 Bienvenue sur ton espace, {currentUser.name}</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Sélectionne un module ci-dessous pour gérer tes chantiers, plannings, matériel ou effectifs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div onClick={() => setActiveTab('planning')} className="group bg-white border border-slate-200 hover:border-cyan-400 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-cyan-50 rounded-xl border border-cyan-100">📅</span>
                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[11px] font-bold rounded-full border border-cyan-200">{visiblePlans.length} dispo</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600">Planning & PDF</h3>
                  <p className="text-xs text-slate-500 mt-1">Feuilles de route et plans d'exécution nominatifs.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-600">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('requests')} className="group bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-amber-50 rounded-xl border border-amber-100">📋</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full border border-amber-200">{visibleRequests.length} demandes</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600">Demandes de Matériel</h3>
                  <p className="text-xs text-slate-500 mt-1">Besoins en raccords, tubes et fournitures.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('workers')} className="group bg-white border border-slate-200 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">👷‍♂️</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">{approvedUsers.length} actifs</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600">Gestion des Effectifs</h3>
                  <p className="text-xs text-slate-500 mt-1">Annuaire, rôles et coordonnées.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('sites')} className="group bg-white border border-slate-200 hover:border-blue-400 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-blue-50 rounded-xl border border-blue-100">🏗️</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200">{sites.length} chantiers</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600">Chantiers</h3>
                  <p className="text-xs text-slate-500 mt-1">Suivi des résidences et travaux.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('tools')} className="group bg-white border border-slate-200 hover:border-indigo-400 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-3xl p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">🔧</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full border border-indigo-200">{equipment.length} machines</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">Parc Outillage</h3>
                  <p className="text-xs text-slate-500 mt-1">Sertisseuses, carotteuses et entretien.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Accéder au module</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {isAdmin && (
                <div onClick={() => setActiveTab('accounts')} className="group bg-white border border-slate-200 hover:border-purple-400 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl p-2.5 bg-purple-50 rounded-xl border border-purple-100">🛡️</span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-full border border-purple-200">{pendingUsers.length} à valider</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600">Validation des Comptes</h3>
                    <p className="text-xs text-slate-500 mt-1">Validation des accès collaborateurs.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600">
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-cyan-600" /> Planning des interventions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAdmin ? "Gestion globale des affectations et plans d'exécution" : "Tes tâches et feuilles de route attribuées"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button onClick={() => setPlanningViewMode('week')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${planningViewMode === 'week' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600'}`}>Vue Semaine</button>
                  <button onClick={() => setPlanningViewMode('month')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${planningViewMode === 'month' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600'}`}>Vue Mois</button>
                </div>

                {isAdmin && (
                  <select value={selectedWorkerFilter} onChange={e => setSelectedWorkerFilter(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl focus:outline-none">
                    <option value="all">Tous les ouvriers</option>
                    {approvedUsers.map(u => (<option key={u.firestoreId} value={u.userIdNum || u.id}>{u.name}</option>))}
                  </select>
                )}

                {isAdmin && (
                  <button onClick={() => setShowAddPlanModal(true)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm">
                    <Plus className="w-4 h-4" /> Assigner Tâche & PDFs
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiblePlans.map(plan => (
                <div key={plan.firestoreId || plan.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">📅 {plan.formattedDate || formatDateFr(plan.date)}</span>
                      <span className="text-slate-500 font-medium">Pour : <strong className="text-slate-800">{plan.targetName}</strong></span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{plan.title}</h3>
                    {plan.description && <p className="text-xs text-slate-600 mt-1">{plan.description}</p>}

                    <div className="mt-3 space-y-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Documents associés ({plan.files ? plan.files.length : (plan.fileName ? 1 : 0)}) :</span>
                      {(!plan.files || plan.files.length === 0) && plan.fileData && (
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-xs text-slate-800 font-medium truncate max-w-[140px]">{plan.fileName}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf({ name: plan.fileName, data: plan.fileData })} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] rounded-lg font-semibold">Ouvrir</button>
                        </div>
                      )}
                      {plan.files && plan.files.map((fileObj, fIdx) => (
                        <div key={fIdx} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-xs text-slate-800 font-medium truncate max-w-[140px]">{fileObj.name}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf(fileObj)} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] rounded-lg font-semibold flex items-center gap-1">
                            <Download className="w-3 h-3" /> Ouvrir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button onClick={() => handleDeletePlan(plan.firestoreId)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg transition-colors font-medium">Supprimer</button>
                    </div>
                  )}
                </div>
              ))}

              {visiblePlans.length === 0 && (
                <div className="col-span-full py-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic shadow-sm">Aucune tâche ou planning attribué pour cette période.</div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE DEMANDES DE MATÉRIEL --- */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" /> Demandes de matériel & fournitures
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAdmin ? "Gérez les besoins chantier, validez ou refusez les commandes" : "Retrouvez vos demandes de matériel et suivez leur statut"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select 
                  value={requestStatusFilter} 
                  onChange={e => setRequestStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="all">🔍 Tous les statuts</option>
                  <option value="En attente">⏳ En attente</option>
                  <option value="Validé / Commandé">✅ Validé / Commandé</option>
                  <option value="Reçu au dépôt">📦 Reçu au dépôt</option>
                  <option value="Refusé">❌ Refusé</option>
                </select>

                <button onClick={() => setShowAddRequestModal(true)} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm">
                  <Plus className="w-4 h-4" /> Nouvelle Demande
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRequests.map(req => {
                let urgencyBadge = <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">Normal</span>;
                if (req.urgency === 'Urgent') urgencyBadge = <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">⚡ Urgent</span>;
                if (req.urgency === 'Critique') urgencyBadge = <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-200">🔥 Critique</span>;

                return (
                  <div key={req.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-slate-500">Demandeur : <strong className="text-slate-800">{req.requester}</strong></span>
                        {urgencyBadge}
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">{req.items}</h3>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200">Qté : {req.quantity || 1}</span>
                      </div>

                      {req.description && <p className="text-xs text-slate-600 mt-1">{req.description}</p>}

                      {req.attachmentData && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-600 shrink-0" />
                            <span className="text-xs text-slate-800 font-medium truncate max-w-[140px]">{req.attachmentName || 'Pièce jointe'}</span>
                          </div>
                          <button onClick={() => handleDownloadSinglePdf({ name: req.attachmentName, data: req.attachmentData })} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] rounded-lg font-semibold flex items-center gap-1">
                            <Download className="w-3 h-3" /> Ouvrir
                          </button>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Statut :</span>
                        {isAdmin ? (
                          <select 
                            value={req.status} 
                            onChange={(e) => handleUpdateRequestStatus(req.firestoreId, e.target.value)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-xl border focus:outline-none ${
                              req.status === 'Validé / Commandé' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              req.status === 'Reçu au dépôt' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              req.status === 'Refusé' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="En attente" className="bg-white text-slate-800">⏳ En attente</option>
                            <option value="Validé / Commandé" className="bg-white text-slate-800">✅ Validé / Commandé</option>
                            <option value="Reçu au dépôt" className="bg-white text-slate-800">📦 Reçu au dépôt</option>
                            <option value="Refusé" className="bg-white text-slate-800">❌ Refusé</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                            req.status === 'Validé / Commandé' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            req.status === 'Reçu au dépôt' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            req.status === 'Refusé' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {req.status === 'Reçu au dépôt' ? `📦 Reçu (${req.receivedDate})` : req.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <button onClick={() => handleDeleteRequest(req.firestoreId)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg transition-colors flex items-center gap-1 font-medium">
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {visibleRequests.length === 0 && (
                <div className="col-span-full py-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic shadow-sm">Aucune demande de matériel ne correspond à ce filtre.</div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULE EFFECTIFS --- */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Annuaire des Effectifs Inscrits
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liste de tous les collaborateurs validés. {isAdmin ? "Vous pouvez modifier leurs rôles/fiches ou supprimer des accès." : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={workerSearch} 
                    onChange={e => setWorkerSearch(e.target.value)} 
                    placeholder="Rechercher par nom..." 
                    className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 w-full sm:w-48 focus:outline-none" 
                  />
                </div>

                <select 
                  value={workerRoleFilter} 
                  onChange={e => setWorkerRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="all">🔍 Tous les rôles</option>
                  <option value="Employé">Employé</option>
                  <option value="Intérimaire">Intérimaire</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkers.map(user => {
                let roleBadge = <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">Employé</span>;
                if (user.role === 'Intérimaire') roleBadge = <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">⚡ Intérimaire</span>;
                if (user.role === 'admin') roleBadge = <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">🛡️ Admin</span>;

                return (
                  <div key={user.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                        {roleBadge}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono font-medium">{user.phone || 'Non renseigné'}</span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400">Inscrit le : {user.joinedAt}</div>
                    </div>

                    {(isAdmin || user.email === currentUser.email) && (
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenUserModal(user)} 
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium transition-colors border border-slate-200"
                        >
                          ✏️ Modifier la fiche
                        </button>
                        {isAdmin && user.email !== currentUser.email && (
                          <button 
                            onClick={() => handleDeleteUser(user.firestoreId)} 
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg transition-colors font-medium border border-red-200"
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredWorkers.length === 0 && (
                <div className="col-span-full py-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic shadow-sm">Aucun collaborateur ne correspond à votre recherche.</div>
              )}
            </div>
          </div>
        )}

        {/* --- MODULES SECONDAIRES --- */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Chantiers en cours</h2>
              {isAdmin && (<button onClick={() => setShowAddSiteModal(true)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"><Plus className="w-4 h-4" /> Nouveau Chantier</button>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <div key={site.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-sm">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-slate-900">{site.name}</h3>
                    {isAdmin && <button onClick={() => handleDeleteSite(site.firestoreId)} className="text-red-500 hover:text-red-700 text-xs font-medium">🗑️</button>}
                  </div>
                  <p className="text-xs text-slate-600">Client : {site.client}</p>
                  <p className="text-xs text-slate-600">Adresse : {site.address}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- MODULE PARC OUTILLAGE --- */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" /> Parc Outillage & Matériel
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Suivi des sertisseuses, carotteuses et de leur affectation sur chantier</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select 
                  value={toolStatusFilter} 
                  onChange={e => setToolStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="all">🔍 Tous les statuts</option>
                  <option value="Disponible">🟢 Disponible</option>
                  <option value="En service">⚡ En service</option>
                  <option value="En révision">🛠️ En révision</option>
                </select>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    value={toolSearch} 
                    onChange={e => setToolSearch(e.target.value)} 
                    placeholder="Rechercher machine..." 
                    className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 w-full sm:w-44 focus:outline-none" 
                  />
                </div>

                {isAdmin && (
                  <button onClick={() => setShowAddToolModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm">
                    <Plus className="w-4 h-4" /> Machine
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map(tool => (
                <div key={tool.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded border border-indigo-200">{tool.id}</span>
                      <span className="text-slate-500 font-medium">{tool.brand || 'REMS'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{tool.name}</h3>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-500">Statut :</span>
                        <span className="font-semibold text-emerald-600">{tool.status || 'Disponible'}</span>
                      </div>
                      <div className="flex justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-500">Affecté à :</span>
                        <span className="font-semibold text-slate-800">{tool.assignedTo || 'Dépôt Central'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-lg font-medium border border-slate-200">
                      💬 Notes ({tool.notes ? tool.notes.length : 0})
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleOpenEditModal(tool)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-lg border border-amber-200 font-medium">Modifier</button>
                        <button onClick={() => handleDeleteTool(tool.firestoreId)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg border border-red-200 font-medium">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {filteredEquipment.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic shadow-sm">
                  Aucune machine trouvée. Ajoute un nouvel outil ou modifie tes filtres de recherche.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Validation des comptes en attente</h2>
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.firestoreId} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name} ({user.email})</p>
                    <p className="text-xs text-slate-500">Téléphone : {user.phone || 'Non renseigné'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveAccount(user.firestoreId)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-semibold shadow-sm">Approuver</button>
                    <button onClick={() => handleRejectAccount(user.firestoreId)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs rounded-lg font-medium border border-red-200">Refuser</button>
                  </div>
                </div>
              ))}
              {pendingUsers.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-xs italic bg-white border border-slate-200 rounded-xl shadow-sm">Aucun compte en attente de validation.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALE NOTES / HISTORIQUE OUTIL --- */}
      {selectedTool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{selectedTool.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedTool.name}</h3>
              </div>
              <button onClick={() => setSelectedTool(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-600">Ajouter une note de suivi (panne, révision, entretien...)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newNoteText} 
                  onChange={e => setNewNoteText(e.target.value)} 
                  placeholder="Ex: Changement de mâchoire Ø26..." 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" 
                />
                <button onClick={() => handleAddNote(selectedTool)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm">Ajouter</button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">Historique des notes :</span>
              {selectedTool.notes && selectedTool.notes.map((note) => (
                <div key={note.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>Par {note.author}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-slate-700">{note.text}</p>
                </div>
              ))}
              {(!selectedTool.notes || selectedTool.notes.length === 0) && (
                <p className="text-xs text-slate-400 italic">Aucune note enregistrée pour cet outil.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedTool(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE EDITION OUTIL (ADMIN) --- */}
      {editingTool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveToolEdit} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Modifier l'affectation / Statut</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Affecté à (Ouvrier ou Dépôt)</label>
              <select 
                value={editToolForm.assignedTo} 
                onChange={e => setEditToolForm({...editToolForm, assignedTo: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="Dépôt Central">📦 Dépôt Central</option>
                {approvedUsers.map(u => (
                  <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
              <select value={editToolForm.status} onChange={e => setEditToolForm({...editToolForm, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none">
                <option value="Disponible">🟢 Disponible</option>
                <option value="En service">⚡ En service</option>
                <option value="En révision">🛠️ En révision</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingTool(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold rounded-xl shadow-sm">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODALE MODIFICATION FICHE UTILISATEUR / PROFIL --- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveUserModal} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>✏️ Modifier la fiche</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom complet</label>
              <input 
                type="text" 
                required 
                value={userModalData.name} 
                onChange={e => setUserModalData({...userModalData, name: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de téléphone</label>
              <input 
                type="tel" 
                required 
                value={userModalData.phone} 
                onChange={e => setUserModalData({...userModalData, phone: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe (optionnel)</label>
              <input 
                type="password" 
                value={userModalData.password} 
                onChange={e => setUserModalData({...userModalData, password: e.target.value})} 
                placeholder="Laisser vide ou entrer un nouveau mdp" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" 
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rôle (Réservé Admin)</label>
                <select 
                  value={userModalData.role} 
                  onChange={e => setUserModalData({...userModalData, role: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Employé">Employé</option>
                  <option value="Intérimaire">Intérimaire</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold rounded-xl shadow-sm">Enregistrer les modifications</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODALE NOUVELLE DEMANDE DE MATÉRIEL --- */}
      {showAddRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateRequest} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Nouvelle Demande de Matériel</h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Matériel / Fournitures souhaitées</label>
              <input type="text" placeholder="ex: Couronnes multicouche Ø16, coudes..." value={newRequestData.items} onChange={e => setNewRequestData({...newRequestData, items: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantité</label>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit">
                <button 
                  type="button" 
                  onClick={() => setNewRequestData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                  className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-sm transition-colors shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-blue-600">{newRequestData.quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setNewRequestData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="w-8 h-8 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-sm transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Niveau d'urgence</label>
              <select value={newRequestData.urgency} onChange={e => setNewRequestData({...newRequestData, urgency: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none">
                <option value="Normal">🟢 Normal</option>
                <option value="Urgent">⚡ Urgent</option>
                <option value="Critique">🔥 Critique (Chantier bloqué)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pièce jointe (Optionnel : Photo ou PDF)</label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={handleRequestAttachmentChange} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer" 
              />
              {newRequestData.attachmentName && (
                <div className="mt-1.5 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span>📎 Fichier joint : {newRequestData.attachmentName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Précisions (Chantier, référence...)</label>
              <textarea placeholder="Ex: Pour le bâtiment B, R+2..." value={newRequestData.description} onChange={e => setNewRequestData({...newRequestData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-20 focus:outline-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddRequestModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-xs text-white font-semibold rounded-xl shadow-sm">Envoyer la demande</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODALE CREATION TÂCHE PLANNING --- */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUploadPlan} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Assigner Tâche & Plusieurs PDFs</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Titre de l'intervention / Chantier</label>
              <input type="text" placeholder="ex: Pose colonnes Bâtiment A" value={newPlanData.title} onChange={e => setNewPlanData({...newPlanData, title: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Attribuer à</label>
              <select value={newPlanData.targetUserId} onChange={e => setNewPlanData({...newPlanData, targetUserId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none">
                <option value="all">Toute l'équipe (Général)</option>
                {approvedUsers.map(u => (<option key={u.firestoreId} value={u.userIdNum || u.id}>{u.name} ({u.team})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date d'intervention</label>
              <input type="date" value={newPlanData.date} onChange={e => setNewPlanData({...newPlanData, date: e.target.value})} onClick={(e) => e.target.showPicker?.()} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 cursor-pointer focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sélectionner un ou plusieurs fichiers PDF</label>
              <input type="file" accept=".pdf" multiple onChange={handleMultipleFilesChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer" />
              {newPlanData.files.length > 0 && (
                <div className="mt-2 space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-cyan-600 font-bold">Fichiers prêts ({newPlanData.files.length}) :</span>
                  {newPlanData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <span className="truncate max-w-[200px]">📄 {file.name}</span>
                      <button type="button" onClick={() => handleRemoveFileIndex(idx)} className="text-red-500 hover:text-red-700 font-bold px-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Consignes complémentaires</label>
              <textarea placeholder="Instruction pour l'ouvrier..." value={newPlanData.description} onChange={e => setNewPlanData({...newPlanData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-20 focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-xs text-white font-semibold rounded-xl shadow-sm">Enregistrer & Publier</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALES SECONDAIRES */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSite} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Nouveau Chantier</h3>
            <input type="text" placeholder="Nom du chantier" value={newSiteData.name} onChange={e => setNewSiteData({...newSiteData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddSiteModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs text-white rounded-xl shadow-sm">Créer</button>
            </div>
          </form>
        </div>
      )}

      {showAddToolModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Ajouter une machine</h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ID Machine (ex: REM-04)</label>
              <input type="text" placeholder="REM-04" value={newToolData.id} onChange={e => setNewToolData({...newToolData, id: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom de la machine</label>
              <input type="text" placeholder="ex: Sertisseuse électro-hydraulique" value={newToolData.name} onChange={e => setNewToolData({...newToolData, name: e.target.value})} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Marque</label>
              <input type="text" value={newToolData.brand} onChange={e => setNewToolData({...newToolData, brand: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Affecter à (Ouvrier ou Dépôt)</label>
              <select 
                value={newToolData.assignedTo} 
                onChange={e => setNewToolData({...newToolData, assignedTo: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="Dépôt Central">📦 Dépôt Central</option>
                {approvedUsers.map(u => (
                  <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut initial</label>
              <select value={newToolData.status} onChange={e => setNewToolData({...newToolData, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none">
                <option value="Disponible">🟢 Disponible</option>
                <option value="En service">⚡ En service</option>
                <option value="En révision">🛠️ En révision</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-xl font-medium border border-slate-200">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold rounded-xl shadow-sm">Ajouter</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}