import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import { 
  Building2, 
  Users, 
  Wrench, 
  ClipboardList, 
  UserCheck, 
  Plus, 
  X, 
  Clock, 
  LogOut,
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Download,
  Eye,
  EyeOff,
  Phone,
  Search,
  Settings,
  ArrowUpRight,
  Key,
  FolderOpen,
  Archive,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  History,
  Home,
  ShieldCheck,
  Edit3,
  Trash2
} from 'lucide-react';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('dashboard');

  const [loadingUser, setLoadingUser] = useState(true);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regIsAdmin, setRegIsAdmin] = useState(false);
  const [regProjectCode, setRegProjectCode] = useState('');
  const [authError, setAuthError] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalData, setUserModalData] = useState({ 
    firestoreId: '', 
    name: '', 
    phone: '', 
    role: 'Employé', 
    customRole: '',
    password: '', 
    photoURL: '',
    canAddReclamation: false,
    canAddRequest: true,
    canViewTools: true
  });

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [userToApprove, setUserToApprove] = useState(null);
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState('Employé');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [approvePermissions, setApprovePermissions] = useState({
    canAddReclamation: false,
    canAddRequest: true,
    canViewTools: true
  });

  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [reclamations, setReclamations] = useState([]);

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

  const [showAddReclamationModal, setShowAddReclamationModal] = useState(false);
  const [newReclamation, setNewReclamation] = useState({ apartment: '', floor: '', clientName: '', observation: '' });
  const [reclamationStatusFilter, setReclamationStatusFilter] = useState('all');
  const [reclamationSearch, setReclamationSearch] = useState('');
  
  const [selectedReclamationHistory, setSelectedReclamationHistory] = useState(null);
  const [resolvingReclamation, setResolvingReclamation] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  
  const [editingSignalement, setEditingSignalement] = useState(null);
  const [editSignalementText, setEditSignalementText] = useState('');

  const [workerSearch, setWorkerSearch] = useState('');
  const [workerRoleFilter, setWorkerRoleFilter] = useState('all');

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
    setLoadingUser(true);
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        const now = Date.now();

        if (loginTimestamp && (now - parseInt(loginTimestamp, 10) > ONE_DAY_IN_MS)) {
          localStorage.removeItem('loginTimestamp');
          await signOut(auth);
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    });

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

    const unsubReclamations = onSnapshot(collection(db, "reclamations"), (snapshot) => {
      setReclamations(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      unsubArchived();
      unsubEquipment();
      unsubRequests();
      unsubPlans();
      unsubReclamations();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.firestoreId === currentUser.firestoreId || u.uid === currentUser.uid || u.email?.toLowerCase() === currentUser.email?.toLowerCase());
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

  const projectReclamations = useMemo(() => {
    if (!myProjectCode) return [];
    return reclamations.filter(r => r.projectCode === myProjectCode);
  }, [reclamations, myProjectCode]);

  const approvedUsers = useMemo(() => projectUsers.filter(u => u.status === 'approved'), [projectUsers]);
  const pendingUsers = useMemo(() => projectUsers.filter(u => u.status === 'pending' && u.role !== 'admin'), [projectUsers]);

  const isAdmin = currentUser?.role === 'admin';
  const canAddReclamation = isAdmin || currentUser?.canAddReclamation === true;

  const groupedReclamations = useMemo(() => {
    const groups = {};
    projectReclamations.forEach(rec => {
      const key = `${rec.apartment?.trim().toUpperCase()}_E${rec.floor}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          building: rec.building,
          apartment: rec.apartment,
          floor: rec.floor,
          clientName: rec.clientName,
          items: []
        };
      }
      groups[key].items.push(rec);
    });

    Object.values(groups).forEach(g => {
      g.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      g.latestTwo = g.items.slice(0, 2);
      g.pendingCount = g.items.filter(i => i.status === 'À faire').length;
    });

    return Object.values(groups);
  }, [projectReclamations]);

  const filteredGroupedReclamations = useMemo(() => {
    return groupedReclamations.filter(group => {
      const q = reclamationSearch.toLowerCase().trim();
      const matchesSearch = (
        group.apartment?.toLowerCase().includes(q) ||
        group.clientName?.toLowerCase().includes(q) ||
        group.floor?.toString().includes(q) ||
        group.items.some(i => i.observation?.toLowerCase().includes(q))
      );
      const matchesStatus = reclamationStatusFilter === 'all' || 
        (reclamationStatusFilter === 'À faire' && group.pendingCount > 0) ||
        (reclamationStatusFilter === 'Fait' && group.pendingCount === 0);

      return matchesSearch && matchesStatus;
    });
  }, [groupedReclamations, reclamationSearch, reclamationStatusFilter]);

  const handleCreateReclamation = async (e) => {
    e.preventDefault();
    if (!newReclamation.apartment || !myProjectCode || !currentUser) return;

    const initialObservation = newReclamation.observation ? newReclamation.observation.trim() : "";
    
    const firstPassage = {
      status: 'À faire',
      details: `Création du signalement`,
      author: currentUser.name,
      date: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "reclamations"), {
        projectCode: myProjectCode,
        building: newReclamation.building ? newReclamation.building.trim().toUpperCase() : '',
        apartment: newReclamation.apartment.trim(),
        floor: newReclamation.floor.trim(),
        clientName: newReclamation.clientName.trim(),
        observation: initialObservation,
        status: 'À faire',
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
        passages: [firstPassage]
      });
      setShowAddReclamationModal(false);
      setNewReclamation({ building: '', apartment: '', floor: '', clientName: '', observation: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmResolveReclamation = async (e) => {
    e.preventDefault();
    if (!resolvingReclamation) return;

    const statusSelect = document.getElementById('interventionStatus');
    const selectedStatus = statusSelect ? statusSelect.value : 'Fait'; 

    const resolutionTextElem = document.getElementById('resolutionText');
    const details = resolutionTextElem ? resolutionTextElem.value.trim() : '';

    const nowISO = new Date().toISOString();
    const authorName = currentUser?.name || 'Technicien';
    const isDone = (selectedStatus === 'Fait');

    const prefix = selectedStatus === 'Occupant absent' 
      ? 'Occupant absent' 
      : (selectedStatus === 'Réintervenir' ? 'À réintervenir' : 'Travaux effectués');
      
    const fullDetails = details ? `${prefix} : ${details}` : prefix;

    const newPassage = {
      status: isDone ? 'Fait' : 'En cours',
      details: fullDetails,
      author: authorName,
      date: nowISO
    };

    const existingPassages = resolvingReclamation.passages || [];
    const updatedPassages = [newPassage, ...existingPassages];

    await updateDoc(doc(db, 'reclamations', resolvingReclamation.firestoreId), {
      passages: updatedPassages,
      status: isDone ? 'Fait' : 'En cours',
      updatedAt: nowISO
    });

    setResolvingReclamation(null);
  };

  const handleSaveEditSignalement = async (e) => {
    e.preventDefault();
    if (!editingSignalement || !editSignalementText.trim()) return;

    try {
      await updateDoc(doc(db, 'reclamations', editingSignalement.firestoreId), {
        observation: editSignalementText.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingSignalement(null);
      setEditSignalementText('');
    } catch (e) {
      console.error("Erreur modification signalement:", e);
    }
  };

  // FONCTION POUR SUPPRIMER TOUTE LA CARTE / LOGEMENT (TOUTES LES FICHES ASSOCIÉES)
  const handleDeleteGroupCard = async (groupItems) => {
    if (window.confirm("Voulez-vous vraiment supprimer toute cette fiche logement et tous ses signalements ?")) {
      try {
        for (const item of groupItems) {
          if (item.firestoreId) {
            await deleteDoc(doc(db, "reclamations", item.firestoreId));
          }
        }
      } catch (e) {
        console.error("Erreur suppression groupe :", e);
      }
    }
  };

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
    const standardRoles = ['Employé', 'Intérimaire', 'Chef d’équipe', 'Apprenti'];
    const currentRole = userToEdit.role || 'Employé';
    const isStandard = standardRoles.includes(currentRole);

    setUserModalData({ 
      firestoreId: userToEdit.firestoreId, 
      name: userToEdit.name, 
      phone: userToEdit.phone || '', 
      role: isStandard ? currentRole : 'Autre',
      customRole: isStandard ? '' : currentRole,
      password: userToEdit.password || '', 
      photoURL: userToEdit.photoURL || '',
      canAddReclamation: userToEdit.canAddReclamation || false,
      canAddRequest: userToEdit.canAddRequest ?? true,
      canViewTools: userToEdit.canViewTools ?? true
    });
    setShowUserModal(true);
  };

  const handleSaveUserModal = async (e) => {
    e.preventDefault();
    if (!userModalData.firestoreId || !currentUser) return;

    const finalRole = userModalData.role === 'Autre' ? (userModalData.customRole.trim() || 'Employé') : userModalData.role;

    try {
      const updatePayload = {
        name: userModalData.name,
        phone: userModalData.phone,
        password: userModalData.password,
        photoURL: userModalData.photoURL || '',
      };

      if (currentUser.role === 'admin') {
        updatePayload.role = finalRole;
        updatePayload.canAddReclamation = userModalData.canAddReclamation;
        updatePayload.canAddRequest = userModalData.canAddRequest;
        updatePayload.canViewTools = userModalData.canViewTools;
      }

      await updateDoc(doc(db, "users", userModalData.firestoreId), updatePayload);
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
    setCustomRoleInput('');
    setApprovePermissions({
      canAddReclamation: false,
      canAddRequest: true,
      canViewTools: true
    });
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!userToApprove) return;

    const finalRole = selectedRoleToAssign === 'Autre' ? (customRoleInput.trim() || 'Employé') : selectedRoleToAssign;

    try {
      await updateDoc(doc(db, "users", userToApprove.firestoreId), { 
        status: 'approved',
        role: finalRole,
        canAddReclamation: approvePermissions.canAddReclamation,
        canAddRequest: approvePermissions.canAddRequest,
        canViewTools: approvePermissions.canViewTools
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      let found = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim());
      
      if (!found) {
        setAuthError("Compte authentifié, mais profil introuvable dans la base.");
        return;
      }
      if (found.status === 'pending') {
        setAuthMode('pending');
        return;
      }
      localStorage.setItem('loginTimestamp', Date.now().toString());
      setCurrentUser(found);
      setActiveTab('dashboard');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setAuthError("Email ou mot de passe incorrect.");
      } else {
        setAuthError("Erreur de connexion : " + error.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      setAuthError("Veuillez d'abord saisir votre adresse email dans le champ ci-dessus.");
      return;
    }
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, loginEmail.trim());
      setResetSent(true);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setAuthError("Cet e-mail n'est associé à aucun compte Firebase Auth.");
      } else if (error.code === 'auth/invalid-email') {
        setAuthError("L'adresse e-mail saisie n'est pas valide.");
      } else {
        setAuthError("Erreur lors de l'envoi du mail de réinitialisation.");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setAuthError('Veuillez remplir tous les champs.');
      return;
    }

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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const authUser = userCredential.user;

      const newUser = {
        uid: authUser.uid,
        userIdNum: Date.now(),
        name: regName,
        email: regEmail.toLowerCase().trim(),
        phone: regPhone,
        role: regIsAdmin ? 'admin' : 'Employé',
        team: regIsAdmin ? 'Direction Chantier' : 'Ouvriers',
        status: regIsAdmin ? 'approved' : 'pending',
        projectCode: assignedProjectCode,
        joinedAt: new Date().toISOString().split('T')[0],
        canAddReclamation: regIsAdmin,
        canAddRequest: true,
        canViewTools: true
      };

      await setDoc(doc(db, "users", authUser.uid), newUser);

      if (regIsAdmin) {
        setCurrentUser(newUser);
        setActiveTab('dashboard');
      } else {
        setAuthMode('pending');
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Cette adresse email est déjà utilisée.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        setAuthError("Erreur lors de l'inscription : " + error.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loginTimestamp');
    auth.signOut();
    setCurrentUser(null);
    setAuthMode('login');
    setLoginEmail('');
    setLoginPassword('');
    setResetSent(false);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium">Chargement de votre session BÂTIR+ PRO...</p>
        </div>
      </div>
    );
  }

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
                <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); setResetSent(false); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Connexion</button>
                <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Inscription</button>
              </div>

              {authError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-200 font-medium">{authError}</div>}
              {resetSent && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 font-medium">✅ Un email avec un lien de réinitialisation sécurisé vient d'être envoyé à votre adresse.</div>}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="votre@email.fr" className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-slate-300">Mot de passe</label>
                      <button 
                        type="button" 
                        onClick={handleForgotPassword}
                        className="text-[11px] text-blue-400 hover:underline focus:outline-none font-medium"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showLoginPassword ? "text" : "password"} 
                        required 
                        value={loginPassword} 
                        onChange={e => setLoginPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full px-4 py-2.5 pr-10 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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
                        <label className="block text-xs font-medium text-slate-300 mb-1">Code chantier de votre administrateur</label>
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
      {/* HEADER ULTRA PRO */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-black text-base text-slate-900 tracking-tight">BÂTIR+ <span className="text-blue-600 font-light">PRO</span></span>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Accueil</button>
          <button onClick={() => setActiveTab('planning')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'planning' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Planning</button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Matériel</button>
          <button onClick={() => setActiveTab('reclamations')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'reclamations' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Réclamations</button>
          <button onClick={() => setActiveTab('workers')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'workers' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Effectifs</button>
          <button onClick={() => setActiveTab('tools')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'tools' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Outillage</button>
          {isAdmin && (
            <button onClick={() => setActiveTab('accounts')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'accounts' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Validation Comptes</button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser?.name} className="w-9 h-9 rounded-full object-cover border-2 border-blue-600/30 shadow-xs" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/20">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden sm:block text-right text-xs">
              <span className="font-bold text-slate-900 block">{currentUser?.name}</span>
              <span className="text-[10px] text-blue-600 font-semibold">{isAdmin ? 'CHEF / ADMIN' : currentUser?.role?.toUpperCase()}</span>
            </div>
          </div>
          
          <button onClick={() => handleOpenUserModal(currentUser)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition-colors">
            <Settings className="w-4 h-4 text-slate-500" /> <span className="hidden md:inline">Profil</span>
          </button>
          <button onClick={handleLogout} title="Se déconnecter" className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      {/* NAVIGATION MOBILE */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto flex items-center gap-2 shadow-xs">
        <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>📊 Accueil</button>
        <button onClick={() => setActiveTab('planning')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'planning' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'}`}>📅 Planning</button>
        <button onClick={() => setActiveTab('requests')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'requests' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}>📦 Matériel</button>
        <button onClick={() => setActiveTab('reclamations')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'reclamations' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}`}>⚠️ Réclamations</button>
        <button onClick={() => setActiveTab('workers')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'workers' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>👥 Effectifs</button>
        <button onClick={() => setActiveTab('tools')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'tools' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>🔧 Outillage</button>
        {isAdmin && <button onClick={() => setActiveTab('accounts')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'accounts' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'}`}>🛡️ Comptes</button>}
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-6 md:px-8 py-6 rounded-3xl shadow-xl border border-blue-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-1 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                  ✨ Tableau de bord • Actif
                </div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  Bienvenue sur votre espace chantier, <span className="text-blue-400">{currentUser?.name}</span>.
                </h1>
                <p className="text-xs text-slate-300">Retrouvez ici vos feuilles de route, vos demandes de matériel et le suivi des réserves en un clin d'œil.</p>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-black/40 border border-white/20 rounded-2xl backdrop-blur-md relative z-10 shadow-inner">
                <Key className="w-4 h-4 text-blue-400" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Code Chantier</span>
                  <strong className="font-mono text-white tracking-widest">{myProjectCode}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div onClick={() => setActiveTab('planning')} className="group bg-white border border-slate-200/80 hover:border-cyan-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-2xl"><CalendarIcon className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-full">{projectPlans.length} dispo</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600">Planning</h3>
                  <p className="text-xs text-slate-500 mt-1">Retrouvez vos tâches programmées</p>
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
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600">Demandes Matériel & Fournitures</h3>
                  <p className="text-xs text-slate-500 mt-1">Transmettez tous vos besoins EPI, outillage, fournitures.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('reclamations')} className="group bg-white border border-slate-200/80 hover:border-red-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full">
                      {projectReclamations.filter(r => r.status === 'À faire').length} en cours
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600">Réclamations & Réserves</h3>
                  <p className="text-xs text-slate-500 mt-1">Suivi par logement, appartement et étage.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-600">
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

        {/* --- MODULE RÉCLAMATIONS --- */}
        {activeTab === 'reclamations' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-red-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-red-600/20 border border-red-400/30 rounded-2xl">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Réclamations & Réserves Chantier</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Suivi des interventions par logement, appartement et étage avec historique.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={reclamationSearch}
                    onChange={e => setReclamationSearch(e.target.value)}
                    placeholder="Appartement, nom..."
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <select 
                  value={reclamationStatusFilter} 
                  onChange={e => setReclamationStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-black/40 border border-white/20 text-xs text-white rounded-xl focus:outline-none"
                >
                  <option value="all" className="bg-slate-900">🔍 Tous les statuts</option>
                  <option value="À faire" className="bg-slate-900">⚠️ Réserves en cours</option>
                  <option value="Fait" className="bg-slate-900">✅ Toutes résolues</option>
                </select>

                {canAddReclamation && (
                  <button 
                    onClick={() => setShowAddReclamationModal(true)} 
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Ajouter Réclamation
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...filteredGroupedReclamations]
                .sort((a, b) => (b.pendingCount || 0) - (a.pendingCount || 0))
                .map(group => {
                  const pendingItemsCount = group.items ? group.items.filter(i => i.status !== 'Fait').length : (group.pendingCount || 0);
                  const hasPending = pendingItemsCount > 0;
                  return (
                    <div key={group.key} className="bg-white border border-slate-200/80 hover:border-red-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative group/card">
                      
                      {/* CROIX DE SUPPRESSION DE LA FICHE LOGEMENT (VISIBLE UNIQUEMENT POUR L'ADMIN) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteGroupCard(group.items)}
                          className="absolute right-4 top-4 w-7 h-7 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-xs z-10"
                          title="Supprimer toute cette fiche logement"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      <div>
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100 pr-8">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Localisation {group.building && `(${group.building})`}</span>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                              <Home className="w-4 h-4 text-blue-600" /> Logement {group.apartment}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Étage : <strong>{group.floor || 'Non précisé'}</strong> {group.clientName && `| Occupant : ${group.clientName}`}</p>
                          </div>

                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${hasPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'}`}>
                           {hasPending ? `⚠️ ${pendingItemsCount} en cours` : '🟢 Tout résolu'}
                          </span>
                        </div>

                        {/* AFFICHAGE DES 2 DERNIERS SIGNALEMENTS SUR LA CARTE PRINCIPALE */}
                        <div className="mt-3 space-y-3">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Derniers signalements</span>
                          
                          {group.latestTwo && group.latestTwo.map((sig, sIdx) => (
                            <div key={sig.firestoreId || sIdx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5 relative">
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-xs text-slate-800 font-semibold leading-relaxed flex-1">
                                  "{sig.observation}"
                                </p>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  sig.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {sig.status || 'À faire'}
                                </span>
                              </div>

                              <div className="flex flex-wrap justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 gap-2">
                                <span>Par : <strong>{sig.createdBy}</strong> ({new Date(sig.createdAt).toLocaleDateString('fr-FR')})</span>
                                
                                <div className="flex items-center gap-1.5">
                                  {/* BOUTON METTRE À JOUR LE STATUT */}
                                  <button
                                    onClick={() => { setResolvingReclamation(sig); setResolutionText(''); }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                                    title="Mettre à jour le statut ou noter le passage"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Mettre à jour
                                  </button>

                                  {/* BOUTON EDITER LE SIGNALEMENT */}
                                  {canAddReclamation && (
                                    <button
                                      onClick={() => { setEditingSignalement(sig); setEditSignalementText(sig.observation); }}
                                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
                                      title="Modifier le contenu du signalement"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* PETITE MONTRE POUR VOIR L'HISTORIQUE DE CE SIGNALEMENT PRÉCIS */}
                                  <button
                                    onClick={() => setSelectedReclamationHistory([sig])}
                                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl transition-colors flex items-center gap-1 font-bold"
                                    title="Voir l'historique des passages de ce signalement"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                    <span>({(sig.passages || []).length})</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedReclamationHistory(group.items)}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <History className="w-4 h-4" /> Voir tous les signalements du logement ({group.items.length})
                        </button>
                      </div>
                    </div>
                  );
                })}

              {filteredGroupedReclamations.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aucune réclamation trouvée</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Toutes les réclamations et réserves de ce chantier sont réglées ou aucune n'a été ajoutée.</p>
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

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {user.canAddReclamation && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-200">⚠️ Peut ajouter réclamations</span>
                      )}
                    </div>

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

      {/* MODALE MISE À JOUR STATUT PASSAGE */}
      {resolvingReclamation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmResolveReclamation} className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Mettre à jour le signalement</h3>
                <p className="text-xs text-slate-500 truncate max-w-[280px]">"{resolvingReclamation.observation}"</p>
              </div>
              <button type="button" onClick={() => setResolvingReclamation(null)} className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Statut de l'intervention *</label>
                <select 
                  id="interventionStatus"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="Fait">🟢 Résolu / Fait</option>
                  <option value="Occupant absent">🚨 Client / Occupant Absent</option>
                  <option value="Réintervenir">⚠️ À réintervenir</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Note / Commentaire des gars *</label>
                <textarea
                  id="resolutionText"
                  required
                  value={resolutionText}
                  onChange={e => setResolutionText(e.target.value)}
                  placeholder="Ex : Personne ne répond à l'interphone / Changement du siphon effectué / Fuite persistante..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-28 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setResolvingReclamation(null)} className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-all">Enregistrer le passage</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODALE MODIFICATION CONTENU SIGNALEMENT */}
      {editingSignalement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveEditSignalement} className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modifier le signalement</h3>
                <p className="text-xs text-slate-500">Logement {editingSignalement.apartment}</p>
              </div>
              <button type="button" onClick={() => setEditingSignalement(null)} className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contenu du signalement / Réserve *</label>
                <textarea
                  required
                  value={editSignalementText}
                  onChange={e => setEditSignalementText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-28 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingSignalement(null)} className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all">Enregistrer les modifications</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {showAddReclamationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateReclamation} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nouvelle Réclamation / Réserve</h3>
              <button type="button" onClick={() => setShowAddReclamationModal(false)}>✕</button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bâtiment / Résidence</label>
              <input
                type="text"
                placeholder="ex: Bâtiment A"
                value={newReclamation.building}
                onChange={e => setNewReclamation({ ...newReclamation, building: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">N° Appartement / Logement *</label>
              <input
                type="text"
                required
                placeholder="ex: A-102"
                value={newReclamation.apartment}
                onChange={e => setNewReclamation({ ...newReclamation, apartment: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Étage</label>
                <input
                  type="text"
                  placeholder="ex: 2ème"
                  value={newReclamation.floor}
                  onChange={e => setNewReclamation({ ...newReclamation, floor: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom Client / Lot</label>
                <input
                  type="text"
                  placeholder="ex: Dupont"
                  value={newReclamation.clientName}
                  onChange={e => setNewReclamation({ ...newReclamation, clientName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observation / Problème constaté *</label>
              <textarea
                required
                placeholder="Ex: Fuite sous lavabo salle de bain..."
                value={newReclamation.observation}
                onChange={e => setNewReclamation({ ...newReclamation, observation: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs h-24"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddReclamationModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-600/20">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {showApproveModal && userToApprove && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmApprove} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Approuver {userToApprove.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Définissez son rôle et ses permissions d'accès au chantier.</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle principal</label>
              <select 
                value={selectedRoleToAssign} 
                onChange={e => setSelectedRoleToAssign(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold mb-2"
              >
                <option value="Employé">👷‍♂️ Employé</option>
                <option value="Intérimaire">⚡ Intérimaire</option>
                <option value="Chef d’équipe">👑 Chef d’équipe</option>
                <option value="Apprenti">📘 Apprenti</option>
                <option value="Autre">✍️ Autre (Saisir un rôle personnalisé)</option>
              </select>

              {selectedRoleToAssign === 'Autre' && (
                <input 
                  type="text" 
                  required
                  value={customRoleInput} 
                  onChange={e => setCustomRoleInput(e.target.value)}
                  placeholder="Tapez le rôle personnalisé..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold animate-fadeIn"
                />
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">Permissions & Autorisations :</span>
              
              <label className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={approvePermissions.canAddReclamation}
                  onChange={e => setApprovePermissions({...approvePermissions, canAddReclamation: e.target.checked})}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div className="text-xs">
                  <strong className="text-slate-900 block">Ajouter des Réclamations / Réserves</strong>
                  <span className="text-slate-500 text-[10px]">Permet de créer et déclarer des réserves logements.</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold rounded-xl transition-colors">Annuler</button>
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold rounded-xl shadow-md transition-all">Valider l'accès</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  ⚙️
                </div>
                <h3 className="text-base font-bold text-slate-900">Modifier le profil</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserModal} className="p-6 space-y-4">
              <div className="flex flex-col items-center justify-center space-y-3 pb-2 border-b border-slate-100">
                <div className="relative group">
                  {userModalData.photoURL ? (
                    <img 
                      src={userModalData.photoURL} 
                      alt="Aperçu profil" 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-md" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                      {userModalData.name ? userModalData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-xs flex items-center gap-2">
                    <span>📷 Choisir une photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUserModalData({ ...userModalData, photoURL: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input 
                  type="text" 
                  value={userModalData.name} 
                  onChange={e => setUserModalData({...userModalData, name: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro de téléphone *</label>
                <input 
                  type="tel" 
                  value={userModalData.phone} 
                  onChange={e => setUserModalData({...userModalData, phone: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium" 
                  required 
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle</label>
                  <select 
                    value={userModalData.role} 
                    onChange={e => setUserModalData({...userModalData, role: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold mb-2"
                  >
                    <option value="Employé">👷‍♂️ Employé</option>
                    <option value="Intérimaire">⚡ Intérimaire</option>
                    <option value="Chef d’équipe">👑 Chef d’équipe</option>
                    <option value="Apprenti">📘 Apprenti</option>
                    <option value="Autre">✍️ Autre (Personnalisé)</option>
                  </select>

                  {userModalData.role === 'Autre' && (
                    <input 
                      type="text" 
                      required
                      value={userModalData.customRole} 
                      onChange={e => setUserModalData({...userModalData, customRole: e.target.value})}
                      placeholder="Tapez le rôle personnalisé..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none font-semibold"
                    />
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Permissions d'accès :</span>
                  <label className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={userModalData.canAddReclamation}
                      onChange={e => setUserModalData({...userModalData, canAddReclamation: e.target.checked})}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <strong className="text-slate-900 block">Ajouter des Réclamations</strong>
                      <span className="text-slate-500 text-[10px]">Autorise à créer des fiches réserves.</span>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe (optionnel)</label>
                <input 
                  type="password" 
                  placeholder="Laisser vide pour ne pas changer" 
                  value={userModalData.password} 
                  onChange={e => setUserModalData({...userModalData, password: e.target.value})} 
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowUserModal(false)} 
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                  📦
                </div>
                <h3 className="text-base font-bold text-slate-900">Demande de Matériel & Fournitures</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddRequestModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Désignation du matériel *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Coudes Ø20, Multicouche..."
                    value={newRequestData.items}
                    onChange={e => setNewRequestData({ ...newRequestData, items: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRequestData.quantity}
                    onChange={e => setNewRequestData({ ...newRequestData, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Niveau d'urgence</label>
                <select
                  value={newRequestData.urgency}
                  onChange={e => setNewRequestData({ ...newRequestData, urgency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                >
                  <option value="Normal">Normal (Standard chantier)</option>
                  <option value="Urgent">Urgent (Besoin rapide)</option>
                  <option value="Critique">Critique (Bloquant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pièce jointe / Photo (optionnel)</label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="file"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewRequestData(prev => ({ ...prev, attachmentName: file.name, attachmentData: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Précisions / Références</label>
                <textarea
                  placeholder="Ex: Prévoir raccord pour cuivre, livraison pour le bâtiment B..."
                  value={newRequestData.description}
                  onChange={e => setNewRequestData({ ...newRequestData, description: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-24 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRequestModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/20 transition-all"
                >
                  Envoyer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE HISTORIQUE DES PASSAGES (VIA LA MONTRE) */}
      {selectedReclamationHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Historique des passages et statuts
              </h3>
              <button 
                onClick={() => setSelectedReclamationHistory(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(Array.isArray(selectedReclamationHistory) 
                ? selectedReclamationHistory 
                : [selectedReclamationHistory]
              ).map((sig, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                  <div className="flex justify-between items-center font-semibold pb-2 border-b border-slate-200/60">
                    <span className="text-slate-900 font-bold text-sm">Signalement : "{sig.observation}"</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      sig.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sig.status || 'En cours'}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      Journal des passages des gars :
                    </p>
                    
                    {(sig.passages || []).map((pass, pIdx) => (
                      <div key={pIdx} className="pl-3 border-l-2 border-blue-600 text-xs space-y-1 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex justify-between items-center font-bold text-slate-800">
                          <span className="text-blue-700">{pass.status}</span>
                          <span className="text-[10px] text-slate-400">
                            {pass.date ? new Date(pass.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium">{pass.details}</p>
                        {pass.author && (
                          <p className="text-[10px] text-slate-400 italic">Par : {pass.author}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedReclamationHistory(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
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