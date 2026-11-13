import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import PrivacyFooter from './components/PrivacyFooter';

import { 
  Users, 
  Wrench, 
  ClipboardList, 
  UserCheck, 
  Plus, 
  X, 
  Clock, 
  LogOut,
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
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  History,
  Home,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

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
  const [showRegPassword, setShowRegPassword] = useState(false);
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
  const [pointages, setPointages] = useState([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null);

  const [pointageUserFilter, setPointageUserFilter] = useState('all');
  const [showPointageEditModal, setShowPointageEditModal] = useState(false);
  const [editingPointageData, setEditingPointageData] = useState(null);

  const [toolSearch, setToolSearch] = useState('');
  const [toolStatusFilter, setToolStatusFilter] = useState('all');
  const [toolWorkerFilter, setToolWorkerFilter] = useState('all');
  const [toolUnassignedFilter, setToolUnassignedFilter] = useState(false);

  const [editingTool, setEditingTool] = useState(null);
  const [editToolForm, setEditToolForm] = useState({ assignedTo: '', status: '', imageURL: '' });
  const [selectedTool, setSelectedTool] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedToolImage, setSelectedToolImage] = useState(null);

  const [selectedRequestHistory, setSelectedRequestHistory] = useState(null);

  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [newToolData, setNewToolData] = useState({ 
    id: '', 
    name: '', 
    brand: 'REMS', 
    status: 'Disponible',
    assignedTo: 'Dépôt Central',
    imageURL: ''
  });

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState('all');
  const [newPlanData, setNewPlanData] = useState({ title: '', targetUserId: 'all', targetUserIds: ['all'], date: new Date().toISOString().split('T')[0], description: '', files: [] });

  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [newRequestData, setNewRequestData] = useState({ items: '', quantity: 1, urgency: 'Normal', description: '', attachmentName: '', attachmentData: '' });

  const [showAddReclamationModal, setShowAddReclamationModal] = useState(false);
  const [newReclamation, setNewReclamation] = useState({ building: '', apartment: '', floor: '', clientName: '', observation: '' });
  const [reclamationStatusFilter, setReclamationStatusFilter] = useState('all');
  const [reclamationSearch, setReclamationSearch] = useState('');
  
  const [selectedReclamationHistory, setSelectedReclamationHistory] = useState(null);
  const [resolvingReclamation, setResolvingReclamation] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  
  const [editingSignalement, setEditingSignalement] = useState(null);
  const [editSignalementText, setEditSignalementText] = useState('');

  const [workerSearch, setWorkerSearch] = useState('');
  const [workerRoleFilter, setWorkerRoleFilter] = useState('all');

  const isAdmin = currentUser?.role === 'admin';
  const canAddReclamation = isAdmin || currentUser?.canAddReclamation === true;
  const myProjectCode = currentUser ? (currentUser.projectCode || currentUser.adminProjectCode) : null;

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
          setLoadingUser(false);
          return;
        }

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.status === 'pending' && userData.role !== 'admin') {
              await signOut(auth);
              setCurrentUser(null);
              setAuthMode('pending');
              setLoadingUser(false);
              return;
            }

            setCurrentUser({ ...userData, firestoreId: userSnap.id });
            setLoadingUser(false);
            return;
          }
        } catch (err) {
          console.error("Erreur vérification statut utilisateur :", err);
        }

        setCurrentUser(null);
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

    const unsubPointages = onSnapshot(collection(db, "pointages"), (snapshot) => {
      setPointages(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
    });

    return () => {
      unsubscribeAuth();
      unsubUsers();
      unsubArchived();
      unsubEquipment();
      unsubRequests();
      unsubPlans();
      unsubReclamations();
      unsubPointages();
    };
  }, []);

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

  const projectPointages = useMemo(() => {
    if (!myProjectCode) return [];
    let list = pointages.filter(p => p.projectCode === myProjectCode);
    
    if (!isAdmin && currentUser) {
      const myId = currentUser.userIdNum || currentUser.id;
      list = list.filter(p => p.userId === myId || p.userId?.toString() === myId?.toString());
    } else if (isAdmin && pointageUserFilter !== 'all') {
      list = list.filter(p => p.userId === Number(pointageUserFilter) || p.userId?.toString() === pointageUserFilter.toString());
    }
    return list;
  }, [pointages, myProjectCode, currentUser, isAdmin, pointageUserFilter]);

  const approvedUsers = useMemo(() => projectUsers.filter(u => u.status === 'approved'), [projectUsers]);
  const pendingUsers = useMemo(() => projectUsers.filter(u => u.status === 'pending' && u.role !== 'admin'), [projectUsers]);

  const currentWeekDays = useMemo(() => {
    const simple = new Date(selectedYear, 0, 1 + (selectedWeek - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }

    const days = [];
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(ISOweekStart);
      nextDate.setDate(ISOweekStart.getDate() + i);
      const dateStr = nextDate.toISOString().split('T')[0];
      const isWeekend = i >= 5;
      const isFriday = i === 4;
      days.push({
        dayIndex: i + 1,
        name: dayNames[i],
        dateStr,
        isWeekend,
        isFriday,
        formattedShort: nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      });
    }
    return days;
  }, [selectedWeek, selectedYear]);

  const handleQuickPointDay = async (day, status, hours, reason = '', startTime = '08:00', endTime = day.isFriday ? '13:00' : '17:00') => {
    if (!currentUser || !myProjectCode) return;
    const myId = currentUser.userIdNum || currentUser.id;
    const docId = `${myProjectCode}_${myId}_${day.dateStr}`;

    try {
      await setDoc(doc(db, "pointages", docId), {
        userId: myId,
        userName: currentUser.name,
        projectCode: myProjectCode,
        date: day.dateStr,
        status,
        hours,
        absenceReason: reason,
        startTime,
        endTime,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminSavePointage = async (e) => {
    e.preventDefault();
    if (!editingPointageData || !myProjectCode) return;

    const docId = `${myProjectCode}_${editingPointageData.userId}_${editingPointageData.date}`;
    try {
      await setDoc(doc(db, "pointages", docId), {
        userId: editingPointageData.userId,
        userName: editingPointageData.userName,
        projectCode: myProjectCode,
        date: editingPointageData.date,
        status: editingPointageData.status,
        hours: Number(editingPointageData.hours),
        absenceReason: editingPointageData.reason || '',
        startTime: editingPointageData.startTime || '08:00',
        endTime: editingPointageData.endTime || '17:00',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setShowPointageEditModal(false);
      setEditingPointageData(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredGroupedReclamations = useMemo(() => {
    const grouped = {};
    projectReclamations.forEach(rec => {
      const key = `${rec.building || 'Sans Bât'}_${rec.apartment || 'Sans Apt'}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          building: rec.building || '',
          apartment: rec.apartment || 'Inconnu',
          floor: rec.floor || '',
          clientName: rec.clientName || '',
          items: []
        };
      }
      grouped[key].items.push(rec);
    });

    return Object.values(grouped).map(group => {
      group.items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      group.latestTwo = group.items.slice(0, 2);
      group.pendingCount = group.items.filter(i => i.status !== 'Fait').length;
      return group;
    }).filter(group => {
      const query = reclamationSearch.toLowerCase().trim();
      const matchesSearch = (
        group.apartment.toLowerCase().includes(query) ||
        group.building.toLowerCase().includes(query) ||
        group.clientName.toLowerCase().includes(query) ||
        group.items.some(i => i.observation?.toLowerCase().includes(query))
      );

      let matchesStatus = true;
      if (reclamationStatusFilter === 'À faire') {
        matchesStatus = group.items.some(i => i.status !== 'Fait');
      } else if (reclamationStatusFilter === 'Fait') {
        matchesStatus = group.items.every(i => i.status === 'Fait');
      }

      return matchesSearch && matchesStatus;
    });
  }, [projectReclamations, reclamationSearch, reclamationStatusFilter]);

  const handleCreateReclamation = async (e) => {
    e.preventDefault();
    if (!newReclamation.apartment || !newReclamation.observation || !myProjectCode || !currentUser) return;
    try {
      await addDoc(collection(db, "reclamations"), {
        ...newReclamation,
        projectCode: myProjectCode,
        createdBy: currentUser.name,
        status: 'À faire',
        createdAt: new Date().toISOString().split('T')[0],
        passages: []
      });
      setShowAddReclamationModal(false);
      setNewReclamation({ building: '', apartment: '', floor: '', clientName: '', observation: '' });
    } catch (e) { console.error(e); }
  };

  const handleConfirmResolveReclamation = async (e) => {
    e.preventDefault();
    if (!resolvingReclamation || !currentUser) return;
    const statusEl = document.getElementById('interventionStatus');
    const newStatus = statusEl ? statusEl.value : 'Fait';

    const newPassage = {
      date: new Date().toISOString(),
      status: newStatus,
      details: resolutionText,
      author: currentUser.name
    };

    try {
      const recRef = doc(db, "reclamations", resolvingReclamation.firestoreId);
      const updatedPassages = [newPassage, ...(resolvingReclamation.passages || [])];
      await updateDoc(recRef, {
        status: newStatus === 'Fait' ? 'Fait' : 'À faire',
        passages: updatedPassages
      });
      setResolvingReclamation(null);
      setResolutionText('');
    } catch (e) { console.error(e); }
  };

  const handleSaveEditSignalement = async (e) => {
    e.preventDefault();
    if (!editingSignalement || !currentUser) return;
    try {
      await updateDoc(doc(db, "reclamations", editingSignalement.firestoreId), {
        observation: editSignalementText
      });
      setEditingSignalement(null);
      setEditSignalementText('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteGroupCard = async (items) => {
    if (window.confirm("Voulez-vous vraiment supprimer toutes les réclamations de ce logement ?")) {
      try {
        for (const item of items) {
          if (item.firestoreId) {
            await deleteDoc(doc(db, "reclamations", item.firestoreId));
          }
        }
      } catch (e) { console.error(e); }
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
      
      let matchesWorker = true;
      if (toolWorkerFilter !== 'all') {
        matchesWorker = (tool.assignedTo === toolWorkerFilter);
      }

      let matchesUnassigned = true;
      if (toolUnassignedFilter) {
        const isFree = !tool.assignedTo || tool.assignedTo === 'Dépôt Central' || tool.assignedTo === 'Dépôt' || tool.assignedTo === 'Libre';
        matchesUnassigned = isFree;
      }

      return matchesSearch && matchesStatus && matchesWorker && matchesUnassigned;
    });
  }, [projectEquipment, toolSearch, toolStatusFilter, toolWorkerFilter, toolUnassignedFilter]);

  const handleCreateTool = async (e) => {
    e.preventDefault();
    if (!newToolData.name || !newToolData.id || !myProjectCode || !currentUser) return;
    try {
      const initialNote = {
        id: Date.now(),
        author: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        text: `Création de la machine et affectation initiale à : ${newToolData.assignedTo || 'Dépôt Central'}`
      };
      await addDoc(collection(db, "equipment"), {
        ...newToolData,
        assignedTo: newToolData.assignedTo || 'Dépôt Central',
        projectCode: myProjectCode,
        notes: [initialNote]
      });
      setShowAddToolModal(false);
      setNewToolData({ id: '', name: '', brand: 'REMS', status: 'Disponible', assignedTo: 'Dépôt Central', imageURL: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTool = async (firestoreId) => {
    try { if (firestoreId) await deleteDoc(doc(db, "equipment", firestoreId)); } catch (e) { console.error(e); }
  };

  const handleOpenEditModal = (tool) => {
    setEditingTool(tool);
    setEditToolForm({ 
      assignedTo: tool.assignedTo || 'Dépôt Central', 
      status: tool.status || 'Disponible',
      imageURL: tool.imageURL || '' 
    });
  };

  const handleSaveToolEdit = async (e) => {
    e.preventDefault();
    if (!editingTool || !editingTool.firestoreId || !currentUser) return;
    try {
      const toolRef = doc(db, "equipment", editingTool.firestoreId);
      
      const oldAssign = editingTool.assignedTo || 'Dépôt Central';
      const newAssign = editToolForm.assignedTo;
      
      let transferNoteText = `Mise à jour statut / affectation`;
      if (oldAssign !== newAssign) {
        transferNoteText = `🔄 Transfert d'affectation : Passé de [${oldAssign}] à [${newAssign}] (par ${currentUser.name})`;
      }

      const newHistoryNote = {
        id: Date.now(),
        author: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        text: transferNoteText
      };

      await updateDoc(toolRef, {
        assignedTo: newAssign,
        status: editToolForm.status,
        imageURL: editToolForm.imageURL,
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
    let hasError = false;

    selectedFiles.forEach((file) => {
      if (file.size > 600 * 1024) {
        alert(`❌ Le fichier "${file.name}" est trop lourd (${Math.round(file.size / 1024)} Ko).\n\nLa taille max est de 600 Ko. Compresse ton PDF sur ILovePDF avant de le joindre !`);
        hasError = true;
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (!hasError) {
          processedFiles.push({ name: file.name, data: reader.result });
          loadedCount++;
          if (loadedCount === selectedFiles.length) {
            setNewPlanData(prev => ({ ...prev, files: [...prev.files, ...processedFiles] }));
          }
        }
      };
      reader.readAsDataURL(file);
    });
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

  const handleDeletePlan = async (firestoreId) => {
    try { if (firestoreId) await deleteDoc(doc(db, "plans", firestoreId)); } catch (e) { console.error(e); }
  };

  const visiblePlans = useMemo(() => {
    if (!currentUser) return [];
    const myId = currentUser.userIdNum || currentUser.id;
    
    let list = projectPlans;
    if (currentUser.role !== 'admin') {
      list = projectPlans.filter(p => p.targetUserId === 'all' || p.targetUserId === myId || (p.targetUserIds && (p.targetUserIds.includes(myId) || p.targetUserIds.includes('all'))));
    } else if (selectedWorkerFilter !== 'all') {
      const wId = Number(selectedWorkerFilter);
      list = projectPlans.filter(p => p.targetUserId === 'all' || p.targetUserId === wId || (p.targetUserIds && (p.targetUserIds.includes('all') || p.targetUserIds.includes(wId))));
    }

    list = list.filter(p => {
      if (!p.date) return false;
      const d = new Date(p.date);
      const w = getWeekNumber(d);
      const y = d.getFullYear();
      return w === selectedWeek && y === selectedYear;
    });

    if (selectedDayOfWeek !== null) {
      list = list.filter(p => {
        const d = new Date(p.date);
        let dayNum = d.getDay();
        if (dayNum === 0) dayNum = 7;
        return dayNum.toString() === selectedDayOfWeek.toString();
      });
    }

    return list;
  }, [projectPlans, currentUser, selectedWorkerFilter, selectedWeek, selectedYear, selectedDayOfWeek]);

  // 🔥 CORRECTION ICI : handleLogin va chercher le profil Firestore complet et l'injecte DIRECTEMENT
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const authUser = userCredential.user;

      const userDocRef = doc(db, "users", authUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        setAuthError("Compte authentifié, mais profil introuvable dans la base.");
        return;
      }

      const userData = userSnap.data();

      if (userData.status === 'pending' && userData.role !== 'admin') {
        setAuthMode('pending');
        await signOut(auth);
        return;
      }

      localStorage.setItem('loginTimestamp', Date.now().toString());
      
      // Injection immédiate du profil complet avec son code chantier et son rôle
      setCurrentUser({ ...userData, firestoreId: userSnap.id });
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
        await signOut(auth);
        setCurrentUser(null);
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
      <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 filter brightness-[0.35] scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=2000&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/60 z-0" />

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden">
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 bg-blue-600/20 border border-blue-400/30 rounded-2xl mb-3 shadow-inner">
                <img src="/logo-off.png" alt="Logo Bâtir+ Pro" className="w-9 h-9 object-contain" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-wider">BÂTIR+ <span className="text-blue-400 font-light">PRO</span></h1>
              <p className="text-xs text-slate-300 mt-1 font-medium tracking-wide">La plateforme opérationnelle dédiée à l'organisation de vos chantiers.</p>
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
                      <label className="block text-xs font-medium text-slate-300 mb-1">Nom</label>
                      <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="Martin" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                      <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jean@batirpluspro.fr" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Numéro de téléphone</label>
                      <input type="tel" required value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="06 12 34 56 78" className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
                      <div className="relative">
                        <input 
                          type={showRegPassword ? "text" : "password"} 
                          required 
                          value={regPassword} 
                          onChange={e => setRegPassword(e.target.value)} 
                          placeholder="••••••••" 
                          className="w-full px-4 py-2 pr-10 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                        <input type="checkbox" checked={regIsAdmin} onChange={e => setRegIsAdmin(e.target.checked)} className="rounded border-slate-700 bg-black/40 text-blue-600 focus:ring-blue-500" />
                        <span>Je crée un compte administrateur</span>
                      </label>

                      {!regIsAdmin && (
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Code projet de votre administrateur</label>
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

        <div className="relative z-10">
          <PrivacyFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="flex items-center">
            <img src="/logo.png" alt="Bâtir+ Pro" className="w-12 h-12 object-contain" />
          </div>
          <span className="font-black text-base text-slate-900 tracking-tight">BÂTIR+ <span className="text-blue-600 font-light">PRO</span></span>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Accueil</button>
          <button onClick={() => { setSelectedDayOfWeek(null); setActiveTab('planning'); }} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'planning' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Planning</button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Matériel</button>
          <button onClick={() => setActiveTab('reclamations')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'reclamations' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Réclamations</button>
          <button onClick={() => setActiveTab('workers')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'workers' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Effectifs</button>
          <button onClick={() => setActiveTab('tools')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'tools' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Outillage</button>
          <button onClick={() => setActiveTab('pointage')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'pointage' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Pointage</button>
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

      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto flex items-center gap-2 shadow-xs">
        <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>📊 Accueil</button>
        <button onClick={() => { setSelectedDayOfWeek(null); setActiveTab('planning'); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'planning' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'}`}>📅 Planning</button>
        <button onClick={() => setActiveTab('requests')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'requests' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}>📦 Matériel</button>
        <button onClick={() => setActiveTab('reclamations')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'reclamations' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}`}>⚠️ Réclamations</button>
        <button onClick={() => setActiveTab('workers')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'workers' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>👥 Effectifs</button>
        <button onClick={() => setActiveTab('tools')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'tools' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>🔧 Outillage</button>
        <button onClick={() => setActiveTab('pointage')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'pointage' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>⏱️ Pointage</button>

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
                  Bienvenue sur votre espace, <span className="text-blue-400">{currentUser?.name}</span>.
                </h1>
                <p className="text-xs text-slate-300">Retrouvez ici vos feuilles de route, vos pointages et le suivi de vos chantiers.</p>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 bg-black/40 border border-white/20 rounded-2xl backdrop-blur-md relative z-10 shadow-inner">
                <Key className="w-4 h-4 text-blue-400" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Code Projet</span>
                  <strong className="font-mono text-white tracking-widest">{myProjectCode}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div onClick={() => { setSelectedDayOfWeek(null); setActiveTab('planning'); }} className="group bg-white border border-slate-200/80 hover:border-cyan-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-2xl"><CalendarIcon className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-full">{projectPlans.length} dispo</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-600">Planning</h3>
                  <p className="text-xs text-slate-500 mt-1">Retrouvez vos tâches programmées par semaine</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-600">
                  <span>Accéder</span> <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div onClick={() => setActiveTab('pointage')} className="group bg-white border border-slate-200/80 hover:border-blue-500/60 p-6 rounded-3xl cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl"><Clock className="w-6 h-6" /></div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Heures</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600">Pointage & Absences</h3>
                  <p className="text-xs text-slate-500 mt-1">Validez vos heures de la semaine en 1 clic.</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
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

        {activeTab === 'pointage' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-blue-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600/20 border border-blue-400/30 rounded-2xl">
                  <Clock className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Pointage & Suivi des Heures</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Semaine type de 37h (Lun-Jeu : 8h / Ven : 5h). Validation rapide ou gestion admin.</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select 
                    value={pointageUserFilter} 
                    onChange={e => setPointageUserFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-black/40 border border-white/20 text-xs text-white rounded-xl focus:outline-none font-semibold"
                  >
                    <option value="all" className="bg-slate-900">👥 Tous les compagnons</option>
                    {approvedUsers.map(u => (
                      <option key={u.firestoreId} value={u.userIdNum || u.id} className="bg-slate-900">
                        👷‍♂️ {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedWeek > 1) setSelectedWeek(selectedWeek - 1);
                    else { setSelectedWeek(52); setSelectedYear(selectedYear - 1); }
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors font-bold flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Semaine préc.
                </button>

                <div className="px-4 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-2xl text-xs font-black uppercase tracking-wider">
                  📅 Semaine {selectedWeek} ({selectedYear})
                </div>

                <button
                  onClick={() => {
                    if (selectedWeek < 52) setSelectedWeek(selectedWeek + 1);
                    else { setSelectedWeek(1); setSelectedYear(selectedYear + 1); }
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors font-bold flex items-center gap-1 text-xs"
                >
                  Semaine suiv. <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-bold text-slate-500">
                Total heures semaine : <span className="text-blue-600 font-black text-sm">
                  {(() => {
                    const targetId = isAdmin && pointageUserFilter !== 'all' ? Number(pointageUserFilter) : (currentUser?.userIdNum || currentUser?.id);
                    const weekDates = currentWeekDays.map(d => d.dateStr);
                    const records = projectPointages.filter(p => p.userId === targetId && weekDates.includes(p.date));
                    const total = records.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);
                    return total;
                  })()}h / 37h
                </span>
              </div>
            </div>

            {!isAdmin ? (
              <div className="space-y-4 max-w-3xl mx-auto">
                {currentWeekDays.filter(d => !d.isWeekend).map(day => {
                  const myId = currentUser.userIdNum || currentUser.id;
                  const record = projectPointages.find(p => p.userId === myId && p.date === day.dateStr);
                  const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                  const defaultHours = day.isFriday ? 5 : 8;

                  const isLocked = record && record.isValidated;
                  const isPendingChange = record && record.status === 'DemandeModification';

                  return (
                    <div key={day.dateStr} className={`bg-white border rounded-3xl p-5 shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isToday ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10' : 'border-slate-200/80'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {day.name}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{day.formattedShort}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-semibold pt-1">
                          {record ? (
                            <span className={record.status === 'Présent' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                              {record.status === 'Présent' ? `✅ Travaillé : ${record.hours}h (${record.startTime} - ${record.endTime})` : `⚠️ ${record.status} (${record.absenceReason || 'Absence'})`}
                              {isLocked && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px]">🔒 Verrouillé (Validé)</span>}
                              {isPendingChange && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px]">⏳ Demande de modif envoyée</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Non pointé (Standard : {defaultHours}h)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {isLocked ? (
                          <button
                            onClick={() => {
                              const motif = prompt("Expliquez l'erreur à corriger pour le chef d'équipe :");
                              if (motif) {
                                handleQuickPointDay(day, 'DemandeModification', record.hours, motif, record.startTime, record.endTime);
                              }
                            }}
                            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                          >
                            ⚠️ Demander une modification
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleQuickPointDay(day, 'Présent', defaultHours, '', '08:00', day.isFriday ? '13:00' : '17:00')}
                              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Valider définitivement ({defaultHours}h)
                            </button>

                            <button
                              onClick={() => {
                                const customH = prompt("Nombre d'heures travaillées ce jour ?", defaultHours);
                                if (customH !== null) {
                                  handleQuickPointDay(day, 'Présent', Number(customH), '', '08:00', '17:00');
                                }
                              }}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                              title="Modifier les heures avant validation"
                            >
                              ⏱️ Heures sup
                            </button>

                            <button
                              onClick={() => {
                                const reason = prompt("Motif de l'absence (Congés, Maladie, Intempéries) :", "Congés");
                                if (reason !== null) {
                                  handleQuickPointDay(day, 'Absent', 0, reason, '00:00', '00:00');
                                }
                              }}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors"
                              title="Signaler une absence"
                            >
                              🚫 Absent
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Tableau de contrôle des heures de l'équipe</span>
                  <span>Semaine {selectedWeek}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200">
                        <th className="p-3.5 font-bold">Compagnon</th>
                        {currentWeekDays.filter(d => !d.isWeekend).map(d => (
                          <th key={d.dateStr} className="p-3.5 font-bold text-center">
                            {d.name.substring(0, 3)}<br/><span className="text-[9px] text-slate-400 font-normal">{d.formattedShort}</span>
                          </th>
                        ))}
                        <th className="p-3.5 font-bold text-center">Total Semaine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvedUsers.filter(u => pointageUserFilter === 'all' || (u.userIdNum || u.id) === Number(pointageUserFilter)).map(worker => {
                        const wId = worker.userIdNum || worker.id;
                        const weekDates = currentWeekDays.filter(d => !d.isWeekend).map(d => d.dateStr);
                        const workerRecords = projectPointages.filter(p => p.userId === wId && weekDates.includes(p.date));
                        const totalW = workerRecords.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);

                        return (
                          <tr key={worker.firestoreId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                              👷‍♂️ {worker.name}
                            </td>
                            {currentWeekDays.filter(d => !d.isWeekend).map(day => {
                              const rec = workerRecords.find(r => r.date === day.dateStr);
                              const isPresent = rec && rec.status === 'Présent';
                              const isAbsent = rec && rec.status !== 'Présent';

                              return (
                                <td key={day.dateStr} className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      setEditingPointageData({
                                        userId: wId,
                                        userName: worker.name,
                                        date: day.dateStr,
                                        status: rec ? rec.status : 'Présent',
                                        hours: rec ? rec.hours : (day.isFriday ? 5 : 8),
                                        reason: rec ? rec.absenceReason : '',
                                        startTime: rec ? rec.startTime : '08:00',
                                        endTime: rec ? rec.endTime : (day.isFriday ? '13:00' : '17:00')
                                      });
                                      setShowPointageEditModal(true);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                                      isPresent ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                                      isAbsent ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                      'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                    title="Cliquer pour modifier"
                                  >
                                    {rec ? `${rec.hours}h` : '-'}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="p-3.5 text-center font-black text-blue-600 text-sm">
                              {totalW}h
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-amber-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-amber-600/20 border border-amber-400/30 rounded-2xl">
                  <ClipboardList className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Demandes de Matériel & Fournitures</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Suivi des besoins par compagnon, historique et validation des approvisionnements.</p>
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
              {(() => {
                const groupedReqs = {};
                
                (visibleRequests || []).forEach(req => {
                  const authorName = req.requester || req.userName || req.createdBy || "Compagnon";
                  if (!groupedReqs[authorName]) {
                    groupedReqs[authorName] = {
                      authorName,
                      items: []
                    };
                  }
                  groupedReqs[authorName].items.push(req);
                });

                Object.values(groupedReqs).forEach(group => {
                  group.items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                });

                const reqCards = Object.values(groupedReqs);

                if (reqCards.length === 0) {
                  return (
                    <div className="col-span-full py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Aucune demande de matériel</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">Aucune commande ou besoin matériel n'a été enregistré pour le moment.</p>
                    </div>
                  );
                }

                return reqCards.map((group, gIdx) => {
                  const pendingCount = group.items.filter(i => i.status !== 'Reçu au dépôt' && i.status !== 'Refusé').length;
                  const hasPending = pendingCount > 0;
                  const latestTwo = group.items.slice(0, 2);

                  return (
                    <div key={gIdx} className="bg-white border border-slate-200/80 hover:border-amber-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demandeur Chantier</span>
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                              👷‍♂️ {group.authorName}
                            </h3>
                          </div>

                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${hasPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'}`}>
                            {hasPending ? `⏳ ${pendingCount} en cours` : '📦 Tout reçu'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dernières demandes</span>
                          
                          {latestTwo.map((req, iIdx) => (
                            <div key={req.firestoreId || iIdx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5">
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold uppercase border border-amber-100">
                                      Qté : {req.quantity}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${req.urgency === 'Urgent' ? 'bg-amber-100 text-amber-800' : req.urgency === 'Critique' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                                      {req.urgency || 'Normal'}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mt-1">
                                    {req.items}
                                  </h4>
                                </div>
                                
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  req.status === 'Validé / Commandé' ? 'bg-emerald-100 text-emerald-800' :
                                  req.status === 'Reçu au dépôt' ? 'bg-blue-100 text-blue-800' :
                                  req.status === 'Refusé' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {req.status || 'En attente'}
                                </span>
                              </div>

                              {req.description && (
                                <p className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-xl border border-slate-200/60">
                                  {req.description}
                                </p>
                              )}

                              {isAdmin && (
                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                                  <select 
                                    value={req.status || 'En attente'} 
                                    onChange={(e) => handleUpdateRequestStatus(req.firestoreId, e.target.value)}
                                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl focus:outline-none flex-1"
                                  >
                                    <option value="En attente">⏳ En attente</option>
                                    <option value="Validé / Commandé">✅ Validé / Commandé</option>
                                    <option value="Reçu au dépôt">📦 Reçu au dépôt</option>
                                    <option value="Refusé">❌ Refusé</option>
                                  </select>

                                  <button 
                                    onClick={() => handleDeleteRequest(req.firestoreId)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                                    title="Supprimer la demande"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedRequestHistory(group.items)}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <History className="w-4 h-4" /> Voir toutes les demandes ({group.items.length})
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

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
                                  <button
                                    onClick={() => { setResolvingReclamation(sig); setResolutionText(''); }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                                    title="Mettre à jour le statut ou noter le passage"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Mettre à jour
                                  </button>

                                  {canAddReclamation && (
                                    <button
                                      onClick={() => { setEditingSignalement(sig); setEditSignalementText(sig.observation); }}
                                      className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
                                      title="Modifier le contenu du signalement"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

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

        {activeTab === 'planning' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-cyan-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-cyan-600/20 border border-cyan-400/30 rounded-2xl">
                  <CalendarIcon className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Planning & Feuilles de Route</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Navigation par semaine et sélection par jour.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <select 
                  value={selectedWorkerFilter} 
                  onChange={e => setSelectedWorkerFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-black/40 border border-white/20 text-xs text-white rounded-xl focus:outline-none font-semibold"
                >
                  <option value="all" className="bg-slate-900">👥 Tout le planning</option>
                  {approvedUsers.map(u => (
                    <option key={u.firestoreId} value={u.userIdNum || u.id} className="bg-slate-900">
                      👷‍♂️ {u.name}
                    </option>
                  ))}
                </select>

                {isAdmin && (
                  <button onClick={() => setShowAddPlanModal(true)} className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all">
                    <Plus className="w-4 h-4" /> Assigner une Tâche 
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedWeek > 1) setSelectedWeek(selectedWeek - 1);
                    else { setSelectedWeek(52); setSelectedYear(selectedYear - 1); }
                    setSelectedDayOfWeek(null);
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors font-bold flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Semaine préc.
                </button>

                <div className="px-4 py-2 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-2xl text-xs font-black uppercase tracking-wider">
                  📅 Semaine {selectedWeek} ({selectedYear})
                </div>

                <button
                  onClick={() => {
                    if (selectedWeek < 52) setSelectedWeek(selectedWeek + 1);
                    else { setSelectedWeek(1); setSelectedYear(selectedYear + 1); }
                    setSelectedDayOfWeek(null);
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors font-bold flex items-center gap-1 text-xs"
                >
                  Semaine suiv. <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedDayOfWeek(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDayOfWeek === null ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Vue Semaine
                </button>

                {currentWeekDays.map(day => {
                  const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = selectedDayOfWeek === day.dayIndex;
                  return (
                    <button
                      key={day.dayIndex}
                      onClick={() => setSelectedDayOfWeek(day.dayIndex)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                        isSelected 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : isToday 
                            ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{day.name.substring(0, 3)}</span>
                      <span className="text-[9px] opacity-85">{day.formattedShort}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              {(() => {
                const groupedMap = {};
                
                (visiblePlans || []).forEach(plan => {
                  const targetKey = Array.isArray(plan.targetUserIds) ? plan.targetUserIds.sort().join('-') : (plan.targetUserId || 'all');
                  const key = `${plan.date || 'no-date'}_${targetKey}`;
                  
                  const planFiles = Array.isArray(plan.files) ? plan.files.filter(f => f && f.data) : [];

                  if (!groupedMap[key]) {
                    groupedMap[key] = {
                      ...plan,
                      tasks: [{ title: plan.title, description: plan.description, firestoreId: plan.firestoreId }],
                      files: [...planFiles]
                    };
                  } else {
                    groupedMap[key].tasks.push({ title: plan.title, description: plan.description, firestoreId: plan.firestoreId });
                    planFiles.forEach(f => {
                      if (!groupedMap[key].files.some(existing => existing.name === f.name)) {
                        groupedMap[key].files.push(f);
                      }
                    });
                  }
                });

                const mergedPlans = Object.values(groupedMap).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

                if (mergedPlans.length === 0) {
                  return (
                    <div className="py-16 text-center bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-3">
                      <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl mx-auto flex items-center justify-center">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Aucune tâche assignée pour cette période</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">Il n'y a actuellement aucun planning ou feuille de route pour la Semaine {selectedWeek}{selectedDayOfWeek ? ` (Jour ${selectedDayOfWeek})` : ''}.</p>
                    </div>
                  );
                }

                return mergedPlans.map(plan => {
                  const isToday = plan.date === new Date().toISOString().split('T')[0];
                  return (
                    <div 
                      key={plan.firestoreId || Math.random()} 
                      className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                        isToday ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-gradient-to-r from-cyan-50/30 to-white' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 ${
                            isToday ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            <CalendarIcon className="w-3.5 h-3.5" /> {isToday ? "AUJOURD'HUI" : (plan.formattedDate || formatDateFr(plan.date))}
                          </span>

                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1">
                            👥 Pour : <strong className="text-slate-900">{plan.targetName || 'Équipe'}</strong>
                          </span>
                        </div>

                        <div className="space-y-3 pt-1">
                          {(plan.tasks || []).map((t, tIdx) => (
                            <div key={t.firestoreId || tIdx} className="space-y-1">
                              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Home className="w-5 h-5 text-cyan-600 shrink-0" /> {t.title}
                              </h3>
                              {t.description && (
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-medium">
                                  {t.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-full md:w-72 shrink-0 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Feuille de route technique</span>
                        
                        {plan.files && plan.files.length > 0 ? (
                          plan.files.map((fileObj, fIdx) => (
                            <div key={fIdx} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-xs text-slate-800 font-bold truncate">{fileObj.name || 'Document.pdf'}</span>
                              </div>
                              <button 
                                onClick={() => handleDownloadSinglePdf(fileObj)} 
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
                              >
                                <Download className="w-3.5 h-3.5" /> Ouvrir PDF
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">Aucun document joint.</p>
                        )}

                        {isAdmin && (
                          <div className="pt-2 border-t border-slate-200/60 flex justify-end gap-2">
                            {(plan.tasks || []).map(t => (
                              <button 
                                key={t.firestoreId} 
                                onClick={() => handleDeletePlan(t.firestoreId)} 
                                className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg font-bold transition-colors"
                                title="Supprimer cette tâche spécifique"
                              >
                                🗑️ Supprimer tâche
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

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

        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-indigo-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600/20 border border-indigo-400/30 rounded-2xl">
                  <Wrench className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">Parc Outillage & Équipements</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Suivi des machines, des transferts et de leur affectation par compagnon.</p>
                </div>
              </div>

              {isAdmin && (
                <button onClick={() => setShowAddToolModal(true)} className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                  <Plus className="w-4 h-4" /> Ajouter une Machine
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 p-4 rounded-3xl shadow-sm flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={e => setToolSearch(e.target.value)}
                  placeholder="Rechercher par nom, marque, numéro de série..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
                />
              </div>

              <select
                value={toolStatusFilter}
                onChange={e => setToolStatusFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold rounded-xl focus:bg-white outline-none"
              >
                <option value="all">🔍 Tous les statuts</option>
                <option value="Disponible">🟢 Disponible</option>
                <option value="En service">⚡ En service</option>
                <option value="En révision">🛠️ En révision</option>
              </select>

              <select
                value={toolWorkerFilter}
                onChange={e => {
                  setToolWorkerFilter(e.target.value);
                  if (e.target.value !== 'all') setToolUnassignedFilter(false);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold rounded-xl focus:bg-white outline-none"
              >
                <option value="all">👷‍♂️ Tous les compagnons</option>
                <option value="Dépôt Central">📦 Dépôt Central</option>
                {approvedUsers.map(u => (
                  <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>
                ))}
              </select>

              <label className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
                toolUnassignedFilter ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  checked={toolUnassignedFilter}
                  onChange={e => {
                    setToolUnassignedFilter(e.target.checked);
                    if (e.target.checked) setToolWorkerFilter('all');
                  }}
                  className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5 hidden"
                />
                <span>✨ Non affectées / Libres</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map(tool => (
                <div key={tool.firestoreId} className="bg-white border border-slate-200/80 hover:border-indigo-500/50 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded-xl border border-indigo-100">
                        {tool.id || 'N/S'}
                      </span>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{tool.brand || 'REMS'}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-900">{tool.name}</h3>

                    <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Statut :</span>
                        <span className="font-bold text-emerald-600">{tool.status || 'Disponible'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Affecté à :</span>
                        <span className="font-bold text-slate-800">{tool.assignedTo || 'Dépôt Central'}</span>
                      </div>
                    </div>

                    {tool.imageURL && (
                      <div className="mt-3">
                        <button
                          onClick={() => setSelectedToolImage(tool.imageURL)}
                          className="w-full py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200/80"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-600" /> Voir la photo de la machine
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button onClick={() => setSelectedTool(tool)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold rounded-xl transition-colors">
                      💬 Historique ({tool.notes?.length || 0})
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => handleOpenEditModal(tool)} className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-colors font-bold">Modifier</button>
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
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Aucun outil ne correspond à vos filtres ou le parc est vide.</p>
                </div>
              )}
            </div>
          </div>
        )}

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

      <PrivacyFooter />

      {/* MODAL MODIFICATION POINTAGE ADMIN */}
      {showPointageEditModal && editingPointageData && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdminSavePointage} className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Modifier le pointage de {editingPointageData.userName}</h3>
              <button type="button" onClick={() => setShowPointageEditModal(false)} className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date :</label>
                <input type="date" value={editingPointageData.date} disabled className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Statut :</label>
                <select 
                  value={editingPointageData.status} 
                  onChange={e => setEditingPointageData({...editingPointageData, status: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none"
                >
                  <option value="Présent">🟢 Présent</option>
                  <option value="Congés">🏖️ Congés</option>
                  <option value="Maladie">🤒 Maladie</option>
                  <option value="Férié">🎉 Férié</option>
                  <option value="Absence injustifiée">❌ Absence injustifiée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre d'heures :</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0"
                  max="24"
                  value={editingPointageData.hours} 
                  onChange={e => setEditingPointageData({...editingPointageData, hours: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold outline-none"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heure début :</label>
                  <input type="time" value={editingPointageData.startTime} onChange={e => setEditingPointageData({...editingPointageData, startTime: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heure fin :</label>
                  <input type="time" value={editingPointageData.endTime} onChange={e => setEditingPointageData({...editingPointageData, endTime: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motif / Commentaire (optionnel) :</label>
                <input type="text" value={editingPointageData.reason} onChange={e => setEditingPointageData({...editingPointageData, reason: e.target.value})} placeholder="Précision..." className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowPointageEditModal(false)} className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all">Enregistrer</button>
              </div>
            </div>
          </form>
        </div>
      )}

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
          <div className="bg-white p-6 rounded-3xl w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedTool.name}</h3>
                <p className="text-xs text-slate-500">Marque : {selectedTool.brand || 'REMS'} | ID : {selectedTool.id}</p>
              </div>
              <button onClick={() => setSelectedTool(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold">✕</button>
            </div>

            <div className="flex gap-2">
              <input type="text" value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Ajouter une note ou remarque..." className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              <button onClick={() => handleAddNote(selectedTool)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm">Ajouter</button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Historique & Transferts</span>
              {selectedTool.notes?.map(note => (
                <div key={note.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200/60 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Par : {note.author || 'Admin'}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{note.text}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedTool(null)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors">Fermer</button>
          </div>
        </div>
      )}

      {selectedToolImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setSelectedToolImage(null)} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs z-10">✕</button>
            <h3 className="text-sm font-bold text-slate-900 px-2">Aperçu photo machine</h3>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-[70vh]">
              <img src={selectedToolImage} alt="Machine" className="w-full h-auto object-contain max-h-[70vh]" />
            </div>
            <button onClick={() => setSelectedToolImage(null)} className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl">Fermer</button>
          </div>
        </div>
      )}

      {editingTool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveToolEdit} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Modifier / Réaffecter l'outil</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Affecter à :</label>
              <select value={editToolForm.assignedTo} onChange={e => setEditToolForm({...editToolForm, assignedTo: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                <option value="Dépôt Central">📦 Dépôt Central (Libre)</option>
                {approvedUsers.map(u => <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Statut :</label>
              <select value={editToolForm.status} onChange={e => setEditToolForm({...editToolForm, status: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                <option value="Disponible">🟢 Disponible</option>
                <option value="En service">⚡ En service</option>
                <option value="En révision">🛠️ En révision</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Photo (optionnel) :</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setEditToolForm({...editToolForm, imageURL: reader.result});
                    reader.readAsDataURL(file);
                  }
                }} 
                className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingTool(null)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl font-semibold">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-bold">Enregistrer le transfert</button>
            </div>
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

      {selectedRequestHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                📦 Historique complet des demandes
              </h3>
              <button 
                onClick={() => setSelectedRequestHistory(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedRequestHistory.map((req, idx) => (
                <div key={req.firestoreId || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold uppercase border border-amber-100">
                          Qté : {req.quantity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('fr-FR') : 'Récemment'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mt-1">
                        {req.items}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      req.status === 'Validé / Commandé' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'Reçu au dépôt' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'Refusé' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status || 'En attente'}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-xl border border-slate-200/60">
                      {req.description}
                    </p>
                  )}

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <select 
                        value={req.status || 'En attente'} 
                        onChange={(e) => handleUpdateRequestStatus(req.firestoreId, e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl focus:outline-none flex-1"
                      >
                        <option value="En attente">⏳ En attente</option>
                        <option value="Validé / Commandé">✅ Validé / Commandé</option>
                        <option value="Reçu au dépôt">📦 Reçu au dépôt</option>
                        <option value="Refusé">❌ Refusé</option>
                      </select>

                      <button 
                        onClick={() => handleDeleteRequest(req.firestoreId)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                        title="Supprimer la demande"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRequestHistory(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

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
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newPlanData.title || !myProjectCode) return;

            const selectedIds = newPlanData.targetUserIds || ['all'];
            
            if (selectedIds.includes('all')) {
              await addDoc(collection(db, "plans"), {
                title: newPlanData.title,
                description: newPlanData.description,
                date: newPlanData.date,
                formattedDate: formatDateFr(newPlanData.date),
                files: newPlanData.files,
                projectCode: myProjectCode,
                targetUserId: 'all',
                targetUserIds: ['all'],
                targetName: "Toute l'équipe"
              });
            } else {
              const names = selectedIds.map(id => {
                const found = approvedUsers.find(u => (u.userIdNum || u.id) === Number(id));
                return found ? found.name : '';
              }).filter(Boolean);

              await addDoc(collection(db, "plans"), {
                title: newPlanData.title,
                description: newPlanData.description,
                date: newPlanData.date,
                formattedDate: formatDateFr(newPlanData.date),
                files: newPlanData.files,
                projectCode: myProjectCode,
                targetUserId: Number(selectedIds[0]),
                targetUserIds: selectedIds.map(Number),
                targetName: names.join(', ')
              });
            }

            const targetDateObj = new Date(newPlanData.date);
            setSelectedWeek(getWeekNumber(targetDateObj));
            setSelectedYear(targetDateObj.getFullYear());
            setSelectedDayOfWeek(null);

            setShowAddPlanModal(false);
            setNewPlanData({ title: '', targetUserId: 'all', targetUserIds: ['all'], date: new Date().toISOString().split('T')[0], description: '', files: [] });
          }} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Assigner une Tâche</h3>
              <button type="button" onClick={() => setShowAddPlanModal(false)}>✕</button>
            </div>

            <input 
              type="text" 
              placeholder="Titre intervention (ex: Bat. 15 LGT 361)" 
              value={newPlanData.title} 
              onChange={e => setNewPlanData({...newPlanData, title: e.target.value})} 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" 
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigner à (1 ou plusieurs compagnons) :</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer pb-2 border-b border-slate-200">
                  <input 
                    type="checkbox" 
                    checked={!newPlanData.targetUserIds || newPlanData.targetUserIds.includes('all')}
                    onChange={e => {
                      if (e.target.checked) {
                        setNewPlanData({...newPlanData, targetUserIds: ['all']});
                      } else {
                        setNewPlanData({...newPlanData, targetUserIds: []});
                      }
                    }}
                    className="rounded text-cyan-600 w-4 h-4"
                  />
                  <span>🌐 Toute l'équipe</span>
                </label>
                
                {approvedUsers.map(u => {
                  const uid = u.userIdNum || u.id;
                  const isChecked = newPlanData.targetUserIds?.includes(uid);
                  return (
                    <label key={u.firestoreId} className="flex items-center gap-2 cursor-pointer text-slate-700 py-1">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          let current = newPlanData.targetUserIds || [];
                          if (current.includes('all')) current = [];
                          if (e.target.checked) {
                            current.push(uid);
                          } else {
                            current = current.filter(id => id !== uid);
                          }
                          setNewPlanData({...newPlanData, targetUserIds: current});
                        }}
                        className="rounded text-cyan-600 w-4 h-4"
                      />
                      <span>👷‍♂️ {u.name} ({u.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <input 
              type="date" 
              value={newPlanData.date} 
              onChange={e => setNewPlanData({...newPlanData, date: e.target.value})} 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" 
            />

            <input 
              type="file" 
              accept=".pdf" 
              multiple 
              onChange={handleMultipleFilesChange} 
              className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" 
            />

            <textarea 
              placeholder="Consignes particulières..." 
              value={newPlanData.description} 
              onChange={e => setNewPlanData({...newPlanData, description: e.target.value})} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs h-20" 
            />

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl font-semibold">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white text-xs rounded-xl font-bold shadow-md shadow-cyan-600/20">Publier</button>
            </div>
          </form>
        </div>
      )}

      {showAddToolModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTool} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Ajouter une machine</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marque *</label>
              <input type="text" placeholder="ex: REMS, Hilti, Makita..." value={newToolData.brand} onChange={e => setNewToolData({...newToolData, brand: e.target.value})} required className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro de série / ID *</label>
              <input type="text" placeholder="ex: REM-04" value={newToolData.id} onChange={e => setNewToolData({...newToolData, id: e.target.value})} required className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Objet / Type d'outil (Nom) *</label>
              <input type="text" placeholder="ex: Serti-veille, Visseuse, Perforateur..." value={newToolData.name} onChange={e => setNewToolData({...newToolData, name: e.target.value})} required className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Affectation initiale :</label>
              <select value={newToolData.assignedTo} onChange={e => setNewToolData({...newToolData, assignedTo: e.target.value})} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                <option value="Dépôt Central">📦 Dépôt Central (Libre)</option>
                {approvedUsers.map(u => <option key={u.firestoreId} value={u.name}>👷‍♂️ {u.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Photo (optionnel) :</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setNewToolData({...newToolData, imageURL: reader.result});
                    reader.readAsDataURL(file);
                  }
                }} 
                className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddToolModal(false)} className="px-4 py-2 bg-slate-100 text-xs rounded-xl font-semibold">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl font-bold">Enregistrer la machine</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}