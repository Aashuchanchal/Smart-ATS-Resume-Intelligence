import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Users, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronRight,
  ArrowLeft,
  Loader2,
  Trash2,
  Share2,
  ExternalLink,
  Globe,
  Settings,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import { Job, Candidate, CandidateStatus, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTrashBin, setShowTrashBin] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'All'>('All');
  const [copied, setCopied] = useState(false);

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data) setUser(data);
    });
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      const [jobsRes, candRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/candidates')
      ]);
      setJobs(await jobsRes.json());
      setCandidates(await candRes.json());
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchData();
    // In a real app we might poll or use websockets, 
    // but for this demo fetching every 5s simulates "incoming applications from portals"
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeJob = jobs.find(j => j.id === activeJobId);
  const jobCandidates = candidates
    .filter(c => c.jobId === activeJobId && !c.isDeleted)
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const comparisonCandidates = candidates.filter(c => selectedForComparison.includes(c.id));

  useEffect(() => {
    setSelectedForComparison([]);
  }, [activeJobId]);

  const handleAddJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newJob = {
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      description: formData.get('description') as string,
      requirements: (formData.get('requirements') as string).split(',').map(s => s.trim()),
    };

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });

    if (res.ok) {
      const savedJob = await res.json();
      setJobs([...jobs, savedJob]);
      setIsAddingJob(false);
    }
  };

  const handleAnalyzeResume = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeJob) return;

    const formData = new FormData(e.currentTarget);
    const applicationData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      resumeText: formData.get('resume') as string,
    };

    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/apply/${activeJob.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });
      
      if (res.ok) {
        await fetchData();
        setShowAnalysisForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteJob = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(jobs.filter(j => j.id !== id));
    setCandidates(candidates.filter(c => c.jobId !== id));
    if (activeJobId === id) setActiveJobId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProposeSlots = async (slots: string[]) => {
    if (!selectedCandidateId) return;
    try {
      const res = await fetch(`/api/candidates/${selectedCandidateId}/propose-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots })
      });
      if (res.ok) {
        await fetchData();
        setShowScheduleModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareProfile = async (recipientEmail: string) => {
    if (!selectedCandidateId) return;
    try {
      const res = await fetch(`/api/candidates/${selectedCandidateId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      });
      if (res.ok) {
        setShowShareModal(false);
        // Maybe add some "Shared" feedback here
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) setUser(await res.json());
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setShowSettings(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-6 selection:bg-white selection:text-black">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#F0F0ED] border-4 border-white p-8 md:p-16 max-w-lg w-full shadow-[20px_20px_0px_0px_rgba(255,255,255,0.05)]"
        >
          <div className="flex flex-col items-center mb-16 underline decoration-4 underline-offset-8">
            <div className="w-20 h-20 bg-[#141414] text-white flex items-center justify-center font-bold text-4xl mb-6">S</div>
            <h1 className="font-serif font-black text-4xl md:text-6xl italic tracking-tighter uppercase leading-none">SmartATS</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-40 mt-6 font-black">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2 group">
              <label className="text-[10px] font-mono uppercase font-black opacity-40 group-focus-within:opacity-100 transition-opacity">Corporate Identity</label>
              <input required name="email" type="email" className="w-full border-b-4 border-[#141414] p-4 focus:outline-none bg-transparent font-serif italic text-2xl" placeholder="email@enterprise.com" />
            </div>
            <div className="space-y-2 group">
              <label className="text-[10px] font-mono uppercase font-black opacity-40 group-focus-within:opacity-100 transition-opacity">Security Pin</label>
              <input required name="password" type="password" className="w-full border-b-4 border-[#141414] p-4 focus:outline-none bg-transparent font-mono text-2xl" placeholder="••••••••" />
            </div>
            <div className="space-y-2 group">
              <label className="text-[10px] font-mono uppercase font-black opacity-40 group-focus-within:opacity-100 transition-opacity">Designation</label>
              <select name="designation" className="w-full border-b-4 border-[#141414] p-4 focus:outline-none bg-transparent font-bold text-lg cursor-pointer">
                <option>Senior HR Manager</option>
                <option>Technical Lead</option>
                <option>Recruiting Specialist</option>
                <option>Department Head</option>
              </select>
            </div>
            <button className="w-full bg-[#141414] text-white py-6 font-mono font-black uppercase tracking-[0.4em] text-sm hover:invert transition-all active:scale-[0.98]">
              Initialize Portal Access
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0ED] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 flex justify-between items-center bg-white sticky top-0 z-10 transition-all duration-500">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => {setActiveJobId(null); setShowIntegrations(false);}}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#141414] text-white flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform">S</div>
            <h1 className="font-serif font-black text-2xl tracking-tighter uppercase italic">SmartATS</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-widest font-mono opacity-50">
            <button onClick={() => {setShowIntegrations(false); setActiveJobId(null);}} className={`hover:opacity-100 transition-opacity ${!showIntegrations ? 'opacity-100' : ''}`}>Workspace</button>
            <button onClick={() => {setShowIntegrations(true); setActiveJobId(null);}} className={`hover:opacity-100 transition-opacity ${showIntegrations ? 'opacity-100' : ''}`}>Integrations</button>
            <a href="#" className="hover:opacity-100 transition-opacity">Benchmarks</a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center flex-col items-end mr-2">
            <span className="text-[10px] font-mono font-black uppercase">{user.name}</span>
            <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">{user.designation}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#141414]/5 rounded-full border border-[#141414]/10">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold">API ACTIVE</span>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-white transition-all rounded-full group"
          >
            <Settings size={18} className="group-rotate-90 transition-transform" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-12">
        <AnimatePresence mode="wait">
          {showIntegrations ? (
            <motion.div 
              key="integrations"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <header className="max-w-2xl">
                <h2 className="text-6xl font-serif font-black italic tracking-tighter mb-4">ConnectionsHub</h2>
                <p className="text-xl text-[#141414]/60 leading-relaxed">
                  Bridge SmartATS with external job portals. Applications sent to these endpoints will automatically be screened by our AI.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* API Setup */}
                <div className="bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414] transition-shadow hover:shadow-[12px_12px_0px_0px_#141414]">
                  <div className="flex items-center gap-3 mb-6 font-serif italic text-2xl font-bold">
                    <Globe size={24} />
                    Universal Webhook
                  </div>
                  <p className="text-sm opacity-70 mb-8 leading-relaxed">
                    Use this endpoint to pipe candidate data from any platform (LinkedIn, Indeed, or your custom career page).
                  </p>
                  
                  <div className="space-y-4">
                    <div className="group space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">API Base URL</label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-[#141414]/5 p-3 rounded font-mono text-xs overflow-x-auto">
                          {window.location.origin}/api/apply/JOB_ID
                        </code>
                        <button 
                          onClick={() => copyToClipboard(`${window.location.origin}/api/apply/JOB_ID`)}
                          className="bg-[#141414] text-white p-3 hover:bg-[#333] transition-colors"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 p-4 bg-slate-50 border border-[#141414]/10">
                    <h5 className="text-[10px] font-mono font-bold mb-3 uppercase tracking-wider">Expected JSON Payload</h5>
                    <pre className="text-[10px] font-mono opacity-60">
{`{
  "name": "Jane Wilson",
  "email": "jane@example.com",
  "resumeText": "Experienced Lead..."
}`}
                    </pre>
                  </div>
                </div>

                {/* Portal Status */}
                <div className="space-y-4">
                  <PortalCard name="LinkedIn" status="Ready" />
                  <PortalCard name="Indeed" status="Ready" />
                  <PortalCard name="Monster" status="Draft" />
                  <PortalCard name="Glassdoor" status="Disconnected" />
                </div>
              </div>
            </motion.div>
          ) : !activeJobId ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Analytics Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-[#141414] bg-[#141414]">
                  <AnalyticsBox 
                    label="Accepted" 
                    count={candidates.filter(c => c.status === 'Accepted').length} 
                    color="bg-green-400"
                    active={statusFilter === 'Accepted'}
                    onClick={() => setStatusFilter(statusFilter === 'Accepted' ? 'All' : 'Accepted')}
                  />
                  <AnalyticsBox 
                    label="In Review" 
                    count={candidates.filter(c => c.status === 'Review').length} 
                    color="bg-orange-400"
                    active={statusFilter === 'Review'}
                    onClick={() => setStatusFilter(statusFilter === 'Review' ? 'All' : 'Review')}
                  />
                  <AnalyticsBox 
                    label="Rejected" 
                    count={candidates.filter(c => c.status === 'Rejected' && !c.isDeleted).length} 
                    color="bg-red-400"
                    active={statusFilter === 'Rejected'}
                    onClick={() => setStatusFilter(statusFilter === 'Rejected' ? 'All' : 'Rejected')}
                  />
                </div>

                {/* Trash Access */}
                <div className="flex justify-start">
                  <button 
                    onClick={() => setShowTrashBin(true)}
                    className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity group"
                  >
                    <Trash2 size={14} className="group-hover:text-red-500 transition-colors" />
                    Security Quarantine ({candidates.filter(c => c.isDeleted).length})
                  </button>
                </div>

                {/* Filtered Global Candidate List (Shows if statusFilter is active) */}
                {statusFilter !== 'All' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#141414] text-white p-8 space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-serif italic font-black uppercase tracking-tighter">Global Cross-Reference: {statusFilter}</h3>
                      <button onClick={() => setStatusFilter('All')} className="text-[10px] font-mono font-bold border border-white/20 px-3 py-1 hover:bg-white hover:text-[#141414] transition-all uppercase tracking-widest">Clear Filter</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {candidates.filter(c => c.status === statusFilter && !c.isDeleted).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setActiveJobId(c.jobId);
                            setSelectedCandidateId(c.id);
                            setStatusFilter('All');
                          }}
                          className="p-4 border border-white/10 hover:border-white/40 cursor-pointer transition-all bg-white/5 group"
                        >
                          <div className="font-serif italic font-bold text-lg">{c.name}</div>
                          <div className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Role: {jobs.find(j => j.id === c.jobId)?.title}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <header>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-0.5 bg-[#141414]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">WorkspacePortfolio</span>
                  </div>
                  <h2 className="text-7xl font-serif font-black italic tracking-tighter leading-none">ActiveRoles</h2>
                </header>
                <button 
                  onClick={() => setIsAddingJob(true)}
                  className="bg-[#141414] text-white px-10 py-5 group relative overflow-hidden"
                >
                   <div className="flex items-center gap-3 relative z-10 font-bold uppercase tracking-widest text-xs">
                     <Plus size={18} />
                     <span>Draft New Opening</span>
                   </div>
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>

              {/* Job Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.map(job => (
                  <motion.div 
                    layoutId={job.id}
                    key={job.id}
                    className="bg-white border-2 border-[#141414] p-8 group hover:bg-[#141414] hover:text-white transition-all duration-500 cursor-pointer flex flex-col justify-between shadow-[8px_8px_0px_0px_#141414] hover:shadow-none"
                    onClick={() => setActiveJobId(job.id)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#141414] text-white px-2 py-0.5 group-hover:bg-white group-hover:text-[#141414] transition-colors">{job.company}</span>
                        <div className="flex items-center gap-2">
                           <Users size={14} className="opacity-40" />
                           <span className="text-xs font-mono font-bold">{candidates.filter(c => c.jobId === job.id).length}</span>
                        </div>
                      </div>
                      <h3 className="text-4xl font-serif italic font-black leading-[0.9] tracking-tighter mb-6">{job.title}</h3>
                    </div>
                    <div className="flex justify-between items-center pt-8 border-t border-[#141414]/10 group-hover:border-white/20">
                      <div className="space-y-0.5">
                        <span className="block text-[8px] font-mono opacity-40 uppercase">Published</span>
                        <span className="text-[10px] font-mono font-bold">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="w-10 h-10 border border-[#141414] group-hover:border-white rounded-full flex items-center justify-center transition-colors">
                        <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {jobs.length === 0 && (
                <div className="h-96 border-4 border-dashed border-[#141414]/10 flex flex-col items-center justify-center italic text-[#141414]/20">
                  <Briefcase size={64} strokeWidth={1} className="mb-6 opacity-10" />
                  <p className="text-2xl font-serif">Awaiting your first visionary hire</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="job-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setActiveJobId(null)}
                    className="w-14 h-14 border-2 border-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-all rounded-full group"
                  >
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div>
                    <h2 className="text-6xl font-serif font-black italic tracking-tighter">{activeJob?.title}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-widest">{activeJob?.company}</span>
                      <span className="w-1 h-1 bg-[#141414]/20 rounded-full" />
                      <span className="text-[10px] font-mono opacity-50">API RECEPTOR: {activeJob?.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}/api/apply/${activeJob?.id}`)}
                    className="px-6 py-3 border-2 border-[#141414]/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-[#141414] transition-all"
                  >
                    <LinkIcon size={14} />
                    {copied ? 'Copied URL' : 'Copy Endpoint'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Job Info */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-[#141414] text-white p-8 rounded shadow-xl">
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 border-b border-white/10 pb-4 mb-6">Briefing</h4>
                    <p className="text-base leading-relaxed font-medium italic opacity-90">{activeJob?.description}</p>
                    
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 border-b border-white/10 pb-4 mb-6 mt-12">Target Skillset</h4>
                    <div className="flex flex-wrap gap-2">
                      {activeJob?.requirements.map(req => (
                        <span key={req} className="text-[10px] font-mono font-bold px-3 py-1 bg-white/10 border border-white/20 rounded-full italic hover:bg-white/20 transition-colors">
                          {req}
                        </span>
                      ))}
                    </div>

                    <button 
                      onClick={() => deleteJob(activeJob!.id)}
                      className="w-full mt-12 flex items-center justify-center gap-2 text-white/40 text-[10px] font-mono py-3 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-all uppercase tracking-widest"
                    >
                      <Trash2 size={14} />
                      Archieve Role
                    </button>
                  </div>
                </div>

                {/* Candidate List */}
                <div className="lg:col-span-3 space-y-8">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <h3 className="text-3xl font-serif italic font-black">IntelligenceFlow</h3>
                    
                    <div className="flex w-full md:w-auto gap-4 items-center">
                      <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search applicant database..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-white border-2 border-[#141414]/10 pl-12 pr-6 py-4 text-sm focus:border-[#141414] focus:outline-none transition-all font-mono shadow-sm"
                        />
                      </div>
                      <button 
                        onClick={() => setShowAnalysisForm(true)}
                        className="bg-[#141414] text-white px-8 py-4 text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-transform"
                      >
                        <Plus size={18} />
                        Manual Input
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-[#141414] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#141414] text-white text-[10px] font-mono uppercase tracking-[0.2em] font-bold">
                          <th className="p-6 w-12">
                            <CheckCircle size={14} className="opacity-40" />
                          </th>
                          <th className="p-6">ApplicantProfile</th>
                          <th className="p-6">AiVerdict</th>
                          <th className="p-6">Match%</th>
                          <th className="p-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-[#141414]/5">
                        {jobCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-24 text-center">
                              <div className="space-y-4">
                                <Search size={40} className="mx-auto opacity-10" />
                                <p className="italic text-[#141414]/40 font-serif text-2xl">No candidate signals detected</p>
                                <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Connect a portal or wait for incoming API traffic</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          jobCandidates.sort((a,b) => b.score - a.score).map(candidate => (
                            <tr key={candidate.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="p-6">
                                <button 
                                  onClick={() => {
                                    if (selectedForComparison.includes(candidate.id)) {
                                      setSelectedForComparison(selectedForComparison.filter(id => id !== candidate.id));
                                    } else if (selectedForComparison.length < 3) {
                                      setSelectedForComparison([...selectedForComparison, candidate.id]);
                                    }
                                  }}
                                  className={`w-6 h-6 border-2 transition-all flex items-center justify-center ${
                                    selectedForComparison.includes(candidate.id) 
                                      ? 'bg-blue-600 border-blue-600' 
                                      : 'border-[#141414]/20 hover:border-[#141414]'
                                  }`}
                                >
                                  {selectedForComparison.includes(candidate.id) && <Check size={14} className="text-white" strokeWidth={4} />}
                                </button>
                              </td>
                              <td className="p-6">
                                <div className="font-serif italic font-black text-xl mb-1">{candidate.name}</div>
                                <div className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-wider">{candidate.email}</div>
                              </td>
                              <td className="p-6">
                                <StatusBadge status={candidate.status} interviewStatus={candidate.interviewStatus} />
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl font-mono font-black tracking-tighter">{candidate.score}%</span>
                                  <div className="flex-1 w-24 h-2 bg-[#141414]/5 rounded-full overflow-hidden hidden md:block">
                                    <div className="h-full bg-[#141414]" style={{ width: `${candidate.score}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <button 
                                  onClick={() => setSelectedCandidateId(candidate.id)}
                                  className="w-10 h-10 border-2 border-[#141414]/10 hover:border-[#141414] hover:bg-[#141414] hover:text-white transition-all rounded-full flex items-center justify-center group"
                                >
                                  <ExternalLink size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414]/10 mt-24 py-12 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#141414] text-white flex items-center justify-center font-bold text-sm">S</div>
            <div>
              <h3 className="font-serif font-black italic tracking-tighter text-lg leading-none uppercase">SmartATS Intelligence</h3>
              <p className="text-[8px] font-mono opacity-40 uppercase tracking-widest mt-1">Enterprise Grade Human Capital Screening</p>
            </div>
          </div>
          
          <div className="flex gap-12">
            <div className="space-y-3">
              <h5 className="text-[9px] font-mono font-black uppercase tracking-widest opacity-30">Legal</h5>
              <div className="flex flex-col gap-2 text-[10px] font-mono leading-none">
                <a href="#" className="hover:underline transition-all">Privacy Protocol</a>
                <a href="#" className="hover:underline transition-all">Terms of Access</a>
                <a href="#" className="hover:underline transition-all">SLA Agreement</a>
              </div>
            </div>
            <div className="space-y-3">
              <h5 className="text-[9px] font-mono font-black uppercase tracking-widest opacity-30">Support</h5>
              <div className="flex flex-col gap-2 text-[10px] font-mono leading-none">
                <a href="#" className="hover:underline transition-all">Help Center</a>
                <a href="#" className="hover:underline transition-all">API Specs</a>
                <a href="#" className="hover:underline transition-all">System Status</a>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono opacity-40 uppercase tracking-[0.2em] mb-2 font-black">Designed by Ashutosh Tiwari | Powered by Antigravity OS</div>
            <div className="flex items-center gap-2 justify-end">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase">Nodes Synchronized</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#141414]/5 flex justify-between items-center text-[8px] font-mono opacity-20 uppercase tracking-[0.4em]">
          <span>© 2026 SmartATS Global Surveillance</span>
          <span>v2.8.4 Intelligence Build</span>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {isAddingJob && (
          <Modal onClose={() => setIsAddingJob(false)} title="Define Role">
            <form onSubmit={handleAddJob} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Position Title</label>
                <input required name="title" className="w-full border-b-2 border-[#141414]/10 p-4 focus:outline-none focus:border-[#141414] bg-transparent text-4xl font-serif font-black italic tracking-tighter" placeholder="e.g. Lead Designer" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Company Hub</label>
                <input required name="company" className="w-full border-b-2 border-[#141414]/10 p-4 focus:outline-none focus:border-[#141414] bg-transparent font-bold" placeholder="TechFlow Labs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">The Brief</label>
                <textarea required name="description" rows={5} className="w-full border-2 border-[#141414]/10 p-6 focus:outline-none focus:border-[#141414] bg-white text-base leading-relaxed italic" placeholder="What makes this role special?" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Critical Competencies (CSV)</label>
                <input required name="requirements" className="w-full border-b-2 border-[#141414]/10 p-4 focus:outline-none focus:border-[#141414] bg-transparent font-mono text-sm" placeholder="Vision, Strategy, Execution" />
              </div>
              <button type="submit" className="w-full bg-[#141414] text-white py-6 uppercase font-mono tracking-[0.3em] text-xs font-black shadow-2xl active:scale-95 transition-transform">
                Seal & Publish Role
              </button>
            </form>
          </Modal>
        )}

        {showAnalysisForm && (
          <Modal onClose={() => setShowAnalysisForm(false)} title="Manual Intake">
            <form onSubmit={handleAnalyzeResume} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Full Name</label>
                  <input required name="name" className="w-full border-b-2 border-[#141414]/10 p-3 focus:outline-none focus:border-[#141414] bg-transparent font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Email Address</label>
                  <input required name="email" type="email" className="w-full border-b-2 border-[#141414]/10 p-3 focus:outline-none focus:border-[#141414] bg-transparent font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Paste Resume Corpus</label>
                <textarea required name="resume" rows={10} className="w-full border-2 border-[#141414]/10 p-6 focus:outline-none focus:border-[#141414] bg-white font-mono text-[10px] leading-relaxed" placeholder="Extracting intelligence..." />
              </div>
              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="w-full bg-[#141414] text-white py-6 uppercase font-mono tracking-[0.3em] text-xs font-black flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Distilling Profile...</span>
                  </>
                ) : (
                  <span>Inject into Pipeline</span>
                )}
              </button>
            </form>
          </Modal>
        )}

        {selectedCandidate && (
          <Modal onClose={() => setSelectedCandidateId(null)} title="Intelligence Report">
            <div className="space-y-10">
               <div className="flex justify-between items-end border-b-2 border-[#141414] pb-8">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                       <h4 className="text-5xl font-serif font-black italic tracking-tighter leading-none">{selectedCandidate.name}</h4>
                       <button 
                        onClick={() => setShowShareModal(true)}
                        className="p-2 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-all rounded-full group"
                        title="Share Intelligence Report"
                       >
                         <Share2 size={18} />
                       </button>
                    </div>
                    <p className="text-xs font-mono font-bold uppercase tracking-widest opacity-40">{selectedCandidate.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-7xl font-mono font-black tracking-tighter leading-none">{selectedCandidate.score}%</div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold opacity-30 mt-2">Overall Match Score</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-[#141414] border-4 border-[#141414] shadow-2xl">
                  <ScoreBox label="Skills" score={selectedCandidate.scoreBreakdown.skills} />
                  <ScoreBox label="Experience" score={selectedCandidate.scoreBreakdown.experience} />
                  <ScoreBox label="Education" score={selectedCandidate.scoreBreakdown.education} />
               </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="inline-block bg-[#141414] text-white px-4 py-1 text-[10px] font-mono uppercase tracking-widest font-black">AI Executive Summary</div>
                    <p className="text-xl font-serif leading-relaxed italic border-l-4 border-[#141414] pl-8 py-2 text-[#141414]/80">
                      "{selectedCandidate.feedback}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="inline-block bg-[#141414] text-white px-4 py-1 text-[10px] font-mono uppercase tracking-widest font-black">Raw Resume Signal</div>
                    <div className="p-6 bg-white border-2 border-[#141414] font-mono text-[10px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap italic opacity-70">
                      {selectedCandidate.resumeText}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-white border-2 border-[#141414] rounded">
                    <div>
                      <h5 className="text-[10px] font-mono uppercase tracking-widest opacity-30 mb-2">Automated Disposition</h5>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={selectedCandidate.status} />
                        <span className="text-xs font-medium opacity-60">
                          {selectedCandidate.status === 'Accepted' && 'High-probability fit detected.'}
                          {selectedCandidate.status === 'Review' && 'Anomalies present. Manual audit recommended.'}
                          {selectedCandidate.status === 'Rejected' && 'Material misalignment with role brief.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedCandidate.status === 'Accepted' && (
                    <div className="p-6 bg-white border-2 border-[#141414] space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-mono uppercase tracking-widest opacity-30">Interview Status</h5>
                        <div className={`px-2 py-0.5 font-mono text-[9px] uppercase font-black ${
                          selectedCandidate.interviewStatus === 'Scheduled' ? 'bg-green-400' :
                          selectedCandidate.interviewStatus === 'Pending Selection' ? 'bg-orange-400' : 'bg-slate-200'
                        }`}>
                          {selectedCandidate.interviewStatus || 'Not Scheduled'}
                        </div>
                      </div>
                      
                      {selectedCandidate.interviewStatus === 'Scheduled' && (
                        <div className="bg-[#141414] text-white p-4 font-mono text-xs flex items-center justify-between">
                          <span>CONFIRMED SLOT:</span>
                          <span className="font-bold underline">{new Date(selectedCandidate.scheduledSlot!).toLocaleString()}</span>
                        </div>
                      )}

                      {selectedCandidate.interviewStatus === 'Pending Selection' && (
                        <div className="space-y-3">
                          <div className="p-4 border-2 border-dashed border-[#141414]/20 font-serif italic text-sm text-[#141414]/50">
                            Awaiting candidate response to proposed time windows...
                          </div>
                          {selectedCandidate.lastReminderSentAt && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                              <span className="text-[9px] font-mono font-black text-orange-700 uppercase tracking-widest">
                                Automated Follow-up Sent {new Date(selectedCandidate.lastReminderSentAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
               </div>

               <div className="pt-10 flex gap-4">
                  {selectedCandidate.status !== 'Accepted' ? (
                    <button 
                      onClick={async () => {
                        await fetch(`/api/candidates/${selectedCandidate.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'Accepted' })
                        });
                        await fetchData();
                        setShowScheduleModal(true);
                      }}
                      className="flex-[2] bg-green-500 text-black py-5 font-mono text-xs uppercase tracking-[0.3em] font-black hover:bg-green-600 shadow-xl active:scale-[0.98] transition-all"
                    >
                      Accept & Schedule
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowScheduleModal(true)}
                      className="flex-[2] bg-[#141414] text-white py-5 font-mono text-xs uppercase tracking-[0.3em] font-black hover:bg-[#333] shadow-xl active:scale-[0.98] transition-all"
                    >
                      {selectedCandidate.interviewStatus === 'Scheduled' ? 'Reschedule Interview' : 'Initiate Interview'}
                    </button>
                  )}
                  
                  <button 
                    onClick={async () => {
                        await fetch(`/api/candidates/${selectedCandidate.id}/trash`, { method: 'PATCH' });
                        await fetchData();
                        setSelectedCandidateId(null);
                    }}
                    className="flex-1 border-2 border-red-500 text-red-500 py-5 font-mono text-xs uppercase tracking-[0.3em] font-black hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-[0.98]"
                  >
                    Trash
                  </button>

                  <button 
                    onClick={() => setSelectedCandidateId(null)}
                    className="flex-1 border-2 border-[#141414] py-5 font-mono text-xs uppercase tracking-[0.3em] font-black hover:bg-[#141414] hover:text-white transition-all shadow-xl active:scale-[0.98]"
                  >
                    Close
                  </button>
               </div>
            </div>
          </Modal>
        )}
        {showSettings && (
          <Modal onClose={() => setShowSettings(false)} title="Portal Settings">
            <div className="space-y-8">
              <div className="bg-white border-2 border-[#141414] p-8">
                <h5 className="text-[10px] font-mono font-black uppercase tracking-widest mb-6 border-b border-[#141414]/10 pb-4">Profile Identity</h5>
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-mono opacity-50 uppercase text-[10px]">Active User</span>
                    <span className="font-bold">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-mono opacity-50 uppercase text-[10px]">Permission Level</span>
                    <span className="font-bold px-2 py-0.5 bg-[#141414] text-white text-[10px] uppercase font-mono">{user.designation}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-4 font-mono font-black uppercase tracking-[0.3em] text-xs hover:bg-red-700 transition-all"
                >
                  Terminate Session
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full border-2 border-[#141414] py-4 font-mono font-black uppercase tracking-[0.3em] text-xs hover:bg-[#141414] hover:text-white transition-all"
                >
                  Close Settings
                </button>
              </div>
            </div>
          </Modal>
        )}
        {showScheduleModal && (
          <Modal onClose={() => setShowScheduleModal(false)} title="Schedule Interview">
            <ScheduleForm 
              candidateName={selectedCandidate?.name || ''} 
              onPropose={handleProposeSlots} 
              onClose={() => setShowScheduleModal(false)} 
            />
          </Modal>
        )}
        {showTrashBin && (
          <Modal onClose={() => setShowTrashBin(false)} title="Security Quarantine (Trash)">
            <TrashBin 
              candidates={candidates.filter(c => c.isDeleted)} 
              jobs={jobs}
              onClose={() => setShowTrashBin(false)} 
              onRefresh={fetchData}
            />
          </Modal>
        )}
        {showComparison && (
          <Modal onClose={() => setShowComparison(false)} title="Qualitative Comparison Matrix">
            <ComparisonMatrix 
              candidates={comparisonCandidates} 
              onClose={() => setShowComparison(false)} 
            />
          </Modal>
        )}
        {showShareModal && (
          <Modal onClose={() => setShowShareModal(false)} title="Share Intelligence Report">
            <ShareForm 
              candidateName={selectedCandidate?.name || ''}
              onShare={handleShareProfile}
              onClose={() => setShowShareModal(false)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Floating Comparison Bar */}
      {selectedForComparison.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="bg-[#141414] text-white p-6 border-4 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex items-center gap-12">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-4">
                {comparisonCandidates.map((c, i) => (
                  <div key={c.id} className="w-10 h-10 bg-white border-2 border-[#141414] text-[#141414] flex items-center justify-center font-bold text-lg rounded-full">
                    {c.name.charAt(0)}
                  </div>
                ))}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest">
                <span className="font-black text-blue-400">{selectedForComparison.length}</span> Profiles Staged
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setSelectedForComparison([])}
                className="px-6 py-2 border border-white/20 font-mono text-[9px] uppercase font-bold hover:bg-white/10 transition-all"
              >
                Clear
              </button>
              <button 
                disabled={selectedForComparison.length < 2}
                onClick={() => setShowComparison(true)}
                className="bg-white text-[#141414] px-8 py-2 font-mono text-[9px] uppercase font-black tracking-widest hover:invert transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Launch Matrix
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ComparisonMatrix({ candidates, onClose }: { candidates: Candidate[], onClose: () => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {candidates.map(candidate => (
          <div key={candidate.id} className="border-4 border-[#141414] bg-white p-8 space-y-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-4xl font-serif italic font-black uppercase tracking-tighter leading-none mb-2">{candidate.name}</h4>
                <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest font-black italic">{candidate.email}</p>
              </div>
              <div className="text-4xl font-mono font-black tracking-widest opacity-10 group-hover:opacity-100 transition-opacity">
                {candidate.score}%
              </div>
            </div>

            <div className="h-2 bg-[#141414]/5">
              <div className="h-full bg-[#141414]" style={{ width: `${candidate.score}%` }} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <MiniScore label="SKL" score={candidate.scoreBreakdown.skills} />
                <MiniScore label="EXP" score={candidate.scoreBreakdown.experience} />
                <MiniScore label="EDU" score={candidate.scoreBreakdown.education} />
              </div>
              
              <div className="bg-[#141414] text-white p-6 min-h-[200px]">
                <h5 className="text-[9px] font-mono opacity-40 uppercase mb-4 tracking-widest border-b border-white/10 pb-2">AI Disposition</h5>
                <p className="text-sm font-serif italic leading-relaxed opacity-90 leading-snug">
                  {candidate.feedback}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={onClose}
        className="w-full bg-[#141414] text-white py-6 font-mono font-black uppercase tracking-widest text-xs hover:invert transition-all"
      >
        Exit Comparison
      </button>
    </div>
  );
}

function MiniScore({ label, score }: { label: string, score: number }) {
  return (
    <div className="text-center font-mono py-2 border border-[#141414]/10">
      <div className="text-[8px] opacity-40 uppercase">{label}</div>
      <div className="text-xs font-black">{score}</div>
    </div>
  );
}

function ShareForm({ candidateName, onShare, onClose }: { candidateName: string, onShare: (email: string) => void, onClose: () => void }) {
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-[#141414] p-8">
        <h5 className="text-[10px] font-mono font-black uppercase tracking-widest mb-6 border-b border-[#141414]/10 pb-4">Recipient Destination</h5>
        <p className="text-sm font-serif italic mb-6">Forwarding intelligence report for <span className="font-bold underline">{candidateName}</span>. A comprehensive data profile will be dispatched to the address below.</p>
        
        <div className="space-y-2 group">
          <label className="text-[9px] font-mono uppercase opacity-40 group-focus-within:opacity-100 transition-opacity">Corporate Email Address</label>
          <input 
            required 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-b-4 border-[#141414] p-4 focus:outline-none bg-transparent font-serif italic text-2xl" 
            placeholder="recipient@enterprise.com" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onClose}
          className="border-2 border-[#141414] py-4 font-mono font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#141414] hover:text-white transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            if (email) onShare(email);
          }}
          className="bg-[#141414] text-white py-4 font-mono font-black uppercase tracking-[0.2em] text-[10px] hover:invert transition-all"
        >
          Dispatch Profile
        </button>
      </div>
    </div>
  );
}

function TrashBin({ candidates, jobs, onClose, onRefresh }: { candidates: Candidate[], jobs: Job[], onClose: () => void, onRefresh: () => void }) {
  const restoreCandidate = async (id: string) => {
    await fetch(`/api/candidates/${id}/restore`, { method: 'PATCH' });
    onRefresh();
  };

  const deletePermanently = async (id: string) => {
    await fetch(`/api/candidates/${id}/permanent`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {candidates.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-[#141414]/10 italic opacity-40">
          No records currently in quarantine.
        </div>
      ) : (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {candidates.map(c => (
            <div key={c.id} className="p-4 bg-white border border-[#141414] flex justify-between items-center group">
              <div>
                <div className="font-bold flex items-center gap-2">
                  {c.name} 
                  <span className="text-[8px] font-mono opacity-30 uppercase">({jobs.find(j => j.id === c.jobId)?.title})</span>
                </div>
                <div className="text-[10px] font-mono opacity-40">Deleted {new Date(c.deletedAt!).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => restoreCandidate(c.id)}
                  className="px-3 py-1 bg-[#141414] text-white text-[9px] font-mono uppercase font-black hover:invert transition-all"
                >
                  Restore
                </button>
                <button 
                  onClick={() => deletePermanently(c.id)}
                  className="px-3 py-1 border border-red-500 text-red-500 text-[9px] font-mono uppercase font-black hover:bg-red-500 hover:text-white transition-all"
                >
                  Purge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button 
        onClick={onClose}
        className="w-full border-2 border-[#141414] py-4 font-mono font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#141414] hover:text-white transition-all"
      >
        Close Quarantine
      </button>
    </div>
  );
}

function ScheduleForm({ candidateName, onPropose, onClose }: { candidateName: string, onPropose: (slots: string[]) => void, onClose: () => void }) {
  const [slots, setSlots] = useState<string[]>(['', '', '']);

  const updateSlot = (index: number, val: string) => {
    const next = [...slots];
    next[index] = val;
    setSlots(next);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border-2 border-[#141414] p-8">
        <h5 className="text-[10px] font-mono font-black uppercase tracking-widest mb-6 border-b border-[#141414]/10 pb-4">Propose Time Windows</h5>
        <p className="text-sm font-serif italic mb-6">Proposing slots for <span className="font-bold underline">{candidateName}</span>. They will receive a secure portal link to select one.</p>
        
        <div className="space-y-4">
          {slots.map((slot, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-[9px] font-mono uppercase opacity-40">Slot Option {i + 1}</label>
              <input 
                type="datetime-local" 
                value={slot} 
                onChange={(e) => updateSlot(i, e.target.value)}
                className="w-full border-2 border-[#141414] p-3 font-mono text-xs focus:ring-0 focus:outline-none focus:bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onClose}
          className="border-2 border-[#141414] py-4 font-mono font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#141414] hover:text-white transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={() => onPropose(slots.filter(s => s))}
          className="bg-[#141414] text-white py-4 font-mono font-black uppercase tracking-[0.2em] text-[10px] hover:invert transition-all"
        >
          Send Proposal
        </button>
      </div>
    </div>
  );
}

function AnalyticsBox({ label, count, color, active, onClick }: { label: string, count: number, color: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-8 group cursor-pointer transition-all ${active ? 'ring-inset ring-8 ring-[#141414]' : 'hover:bg-[#141414] hover:text-white'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>{label}</span>
        <div className={`w-3 h-3 rounded-full ${color}`} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-6xl font-mono font-black tracking-tighter leading-none">{count}</span>
        <span className="text-[10px] font-mono uppercase opacity-30 mb-2">Profiles</span>
      </div>
    </div>
  );
}

function PortalCard({ name, status }: { name: string, status: 'Ready' | 'Disconnected' | 'Draft' }) {
  const colors = {
    Ready: 'bg-green-500',
    Disconnected: 'bg-red-500',
    Draft: 'bg-orange-500'
  };

  return (
    <div className="flex items-center justify-between p-6 bg-white border-2 border-[#141414] hover:-translate-y-1 transition-transform cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
        <span className="font-serif italic font-bold text-xl">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono uppercase opacity-40 font-bold">{status}</span>
        <button className="text-[10px] font-mono uppercase font-black tracking-widest hover:underline decoration-2 underline-offset-4">Connect</button>
      </div>
    </div>
  );
}

function ScoreBox({ label, score }: { label: string, score: number }) {
  return (
    <div className="bg-[#E4E3E0] p-8 text-center group">
      <div className="text-[10px] uppercase font-mono tracking-widest opacity-40 mb-3 font-bold group-hover:opacity-100 transition-opacity">{label}</div>
      <div className="text-4xl font-mono font-black tracking-tighter leading-none mb-4">{score}%</div>
      <div className="w-full h-1.5 bg-[#141414]/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "circOut" }}
          className="h-full bg-[#141414]"
        />
      </div>
    </div>
  );
}

function StatusBadge({ status, interviewStatus }: { status: CandidateStatus, interviewStatus?: string }) {
  const styles = {
    Accepted: 'bg-green-100 text-green-900 border-green-300 shadow-[2px_2px_0px_0px_rgba(22,101,52,1)]',
    Selected: 'bg-blue-600 text-white border-blue-800 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]',
    Rejected: 'bg-red-100 text-red-900 border-red-300 shadow-[2px_2px_0px_0px_rgba(153,27,27,1)]',
    Review: 'bg-orange-100 text-orange-900 border-orange-300 shadow-[2px_2px_0px_0px_rgba(154,52,18,1)]',
    Pending: 'bg-slate-100 text-slate-900 border-slate-300',
    Scheduled: 'bg-purple-100 text-purple-900 border-purple-300 shadow-[2px_2px_0px_0px_rgba(88,28,135,1)]',
  };

  const icons = {
    Accepted: <CheckCircle size={12} />,
    Selected: <CheckCircle size={12} />,
    Rejected: <XCircle size={12} />,
    Review: <AlertCircle size={12} />,
    Pending: null,
    Scheduled: <Loader2 size={12} className="animate-spin" />,
  };

  let displayStatus: any = status;
  if (status === 'Selected') displayStatus = 'Selected';
  else if (interviewStatus === 'Scheduled') displayStatus = 'Scheduled';

  return (
    <span className={`text-[10px] font-mono font-black uppercase tracking-[0.2em] px-4 py-2 border-2 flex items-center gap-2 w-fit italic ${styles[displayStatus as keyof typeof styles] || styles.Pending}`}>
      {icons[displayStatus as keyof typeof icons]}
      {displayStatus}
    </span>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#141414]/90 backdrop-blur-xl" 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#F0F0ED] border-4 border-[#141414] w-full max-w-5xl p-8 md:p-16 relative z-10 shadow-[20px_20px_0px_0px_rgba(255,255,255,1)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-12 bg-[#141414]" />
            <h3 className="text-6xl font-serif font-black italic tracking-tighter">{title}</h3>
          </div>
          <button onClick={onClose} className="p-3 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-all rounded-full">
            <XCircle size={32} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

