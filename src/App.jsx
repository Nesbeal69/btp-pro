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
      alert("Pour installer l'application sur votre téléphone :\n1. Ouvrez le menu de votre navigateur.\n2. Sélectionnez 'Ajouter à l'écran d'accueil'.");
    }
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

  const approvedUsers = useMemo(() => projectUsers.filter(u => u.status === 'approved'), [projectUsers]);
  const pendingUsers = useMemo(() => projectUsers.filter(u => u.status === 'pending' && u.role !== 'admin'), [projectUsers]);

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

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setLoginEmail('');
    setLoginPassword('');
  };

  const isAdmin = currentUser?.role === 'admin';

  if (!currentUser) {
    return (
      <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 bg-blue-600/20 border border-blue-400/30 rounded-2xl mb-3">
              <Building2 className="w-9 h-9 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider">BÂTIR+ <span className="text-blue-400 font-light">PRO</span></h1>
            <p className="text-xs text-slate-300 mt-1">Gestion de chantier, matériels et équipes.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-200">{authError}</div>}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="votre@email.fr" className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mot de passe</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white" />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 transition-colors font-bold rounded-xl text-xs text-white shadow-lg shadow-blue-600/30">Se Connecter</button>
          </form>
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
            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">{isAdmin ? 'ADMIN' : currentUser.role.toUpperCase()}</span>
          </div>
          <button onClick={handleLogout} title="Se déconnecter" className="p-1.5 text-slate-400 hover:text-red-600"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-black">Bienvenue, {currentUser.name}</h2>
          <p className="text-xs text-slate-300 mt-1">Tableau de bord principal opérationnel.</p>
        </div>
      </main>
    </div>
  );
}