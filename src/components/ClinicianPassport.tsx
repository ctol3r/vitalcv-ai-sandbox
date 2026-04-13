import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, CheckCircle2, Clock, AlertCircle, User, Activity, FileCheck, Database, Share2, ShieldAlert, RefreshCw, Edit2, Save, X, MessageSquare, Lock, XCircle, GitCompare } from "lucide-react";
import { cn } from "@/src/lib/utils";
import SharePacketModal from "./SharePacketModal";

export interface TrustItem {
  source: string;
  state: string;
  details: string;
  lastChecked?: string;
  expirationDate?: string;
}

export interface TrustState {
  readinessScore: number;
  estimatedStart: string;
  identity: TrustItem;
  sanctions: TrustItem;
  licensure: TrustItem;
  enrollment: TrustItem;
  boardCertification: TrustItem;
  deaRegistration: TrustItem;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

interface ClinicianPassportProps {
  trustState: TrustState;
  npi: string;
  clinicianName?: string;
  error?: string | null;
  onRetry?: () => void;
  onRequestReview?: (source: string) => void;
}

export default function ClinicianPassport({ trustState, npi, clinicianName, error, onRetry, onRequestReview }: ClinicianPassportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    email: "doctor@example.com",
    phone: "(555) 123-4567",
    specialty: "Internal Medicine",
    specialtyDescription: "Board Certified in Internal Medicine with 10+ years of experience in acute care settings.",
    licenseExpirationDate: "2026-12-31"
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const [isEmployerEditing, setIsEmployerEditing] = useState(false);
  const [employerData, setEmployerData] = useState({
    employerName: "",
    employerWebsite: "",
    employerAddress: "",
    hiringManager: "",
    contactEmail: "",
    department: "",
    hiringManagerTitle: "",
    officePhone: "",
    officeFax: "",
    onboardingSpecialistName: "",
    onboardingSpecialistEmail: "",
    onboardingTasks: [] as { id: string, taskName: string, assigneeName: string, assigneeRole: string }[]
  });

  const [internalNotes, setInternalNotes] = useState<{ id: string, author: string, timestamp: string, content: string }[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [currentAuthor, setCurrentAuthor] = useState("Reviewer"); // Mock current user

  useEffect(() => {
    const saved = localStorage.getItem(`clinician_profile_${npi}`);
    if (saved) {
      try {
        setProfileData(JSON.parse(saved));
      } catch (e) {}
    }
    
    const savedEmployer = localStorage.getItem(`employer_profile_${npi}`);
    if (savedEmployer) {
      try {
        setEmployerData(JSON.parse(savedEmployer));
      } catch (e) {}
    }

    const savedNotes = localStorage.getItem(`internal_notes_${npi}`);
    if (savedNotes) {
      try {
        setInternalNotes(JSON.parse(savedNotes));
      } catch (e) {}
    }
  }, [npi]);

  const handleSaveProfile = () => {
    localStorage.setItem(`clinician_profile_${npi}`, JSON.stringify(profileData));
    setIsEditing(false);
  };

  const handleCancelProfile = () => {
    const saved = localStorage.getItem(`clinician_profile_${npi}`);
    if (saved) {
      try {
        setProfileData(JSON.parse(saved));
      } catch (e) {}
    } else {
      setProfileData({
        email: "doctor@example.com",
        phone: "(555) 123-4567",
        specialty: "Internal Medicine",
        specialtyDescription: "Board Certified in Internal Medicine with 10+ years of experience in acute care settings.",
        licenseExpirationDate: "2026-12-31"
      });
    }
    setIsEditing(false);
  };

  const handleSaveEmployerProfile = () => {
    localStorage.setItem(`employer_profile_${npi}`, JSON.stringify(employerData));
    setIsEmployerEditing(false);
  };

  const handleCancelEmployerProfile = () => {
    const savedEmployer = localStorage.getItem(`employer_profile_${npi}`);
    if (savedEmployer) {
      try {
        setEmployerData(JSON.parse(savedEmployer));
      } catch (e) {}
    } else {
      setEmployerData({
        employerName: "",
        employerWebsite: "",
        employerAddress: "",
        hiringManager: "",
        contactEmail: "",
        department: "",
        hiringManagerTitle: "",
        officePhone: "",
        officeFax: "",
        onboardingSpecialistName: "",
        onboardingSpecialistEmail: "",
        onboardingTasks: []
      });
    }
    setIsEmployerEditing(false);
  };

  const handleAddTask = () => {
    setEmployerData(prev => ({
      ...prev,
      onboardingTasks: [
        ...(prev.onboardingTasks || []),
        { id: Math.random().toString(36).substring(7), taskName: "", assigneeName: "", assigneeRole: "" }
      ]
    }));
  };

  const handleUpdateTask = (id: string, field: string, value: string) => {
    setEmployerData(prev => ({
      ...prev,
      onboardingTasks: (prev.onboardingTasks || []).map(task => 
        task.id === id ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleRemoveTask = (id: string) => {
    setEmployerData(prev => ({
      ...prev,
      onboardingTasks: (prev.onboardingTasks || []).filter(task => task.id !== id)
    }));
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    
    const newNote = {
      id: Math.random().toString(36).substring(7),
      author: currentAuthor || "Anonymous",
      timestamp: new Date().toISOString(),
      content: newNoteContent.trim()
    };
    
    const updatedNotes = [newNote, ...internalNotes];
    setInternalNotes(updatedNotes);
    localStorage.setItem(`internal_notes_${npi}`, JSON.stringify(updatedNotes));
    setNewNoteContent("");
  };

  const handleSendVerification = () => {
    setEmailVerificationSent(true);
    // Simulate API call
    setTimeout(() => {
      setIsEmailVerified(true);
    }, 2000);
  };

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-line p-12 bg-white/10 dark:bg-white/5 backdrop-blur-sm text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight uppercase">System Access Interrupted</h3>
          <p className="text-sm opacity-60 font-mono max-w-md mx-auto leading-relaxed">
            We couldn't load your readiness snapshot right now. This is often due to a primary source registry timeout or an organization context requirement.
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <button 
            onClick={onRetry}
            className="bg-ink text-bg px-8 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        </div>
      </motion.div>
    );
  }

  const displayName = clinicianName || "Identity Resolution Pending";
  const isDegraded = !clinicianName;

  return (
    <div className="space-y-12">
      <SharePacketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        clinicianName={displayName}
        npi={npi}
      />
      {/* Summary Section */}
      <section className="border-b border-line pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 opacity-40">
              <Database className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">System Status: Operational</span>
              {isDegraded && (
                <span className="text-[8px] font-mono bg-amber-500/10 text-amber-600 px-1.5 py-0.5 border border-amber-500/20 uppercase tracking-tighter ml-2">
                  Degraded Preview
                </span>
              )}
            </div>
            <h2 className="text-5xl font-bold tracking-tighter uppercase">{displayName}</h2>
            <p className="text-sm opacity-60 font-mono max-w-md">
              NPI: {npi} | Real-time synchronization with primary source registries. 
              Immutable audit trail enabled.
            </p>
          </div>
          
            <div className="flex gap-12 items-end">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Readiness Score</div>
                <div className="text-6xl font-bold tracking-tighter font-mono">{trustState.readinessScore}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Est. Start</div>
                <div className="text-4xl font-bold tracking-tighter font-mono mt-2">{trustState.estimatedStart}</div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-ink text-bg px-6 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:opacity-90 transition-all ml-4"
              >
                <Share2 className="w-3 h-3" />
                Share with Employer
              </button>
            </div>
        </div>
      </section>

      {/* Profile Details Section */}
      <section className="border-b border-line pb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold tracking-tight uppercase">Profile Information</h3>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button 
                onClick={handleCancelProfile}
                className="px-4 py-2 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all border border-line hover:bg-ink/5 text-ink"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
            <button 
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              className={cn(
                "px-4 py-2 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all",
                isEditing 
                  ? "bg-green-600/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-600/20" 
                  : "border border-line hover:bg-ink/5 text-ink"
              )}
            >
              {isEditing ? (
                <>
                  <Save className="w-3 h-3" /> Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="w-3 h-3" /> Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Email Address</label>
              {isEditing ? (
                <input 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                  placeholder="Enter your email"
                />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-sm font-mono">{profileData.email}</div>
                  {isEmailVerified ? (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-green-600 bg-green-600/10 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-600/10 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Unverified
                      </span>
                      <button
                        onClick={handleSendVerification}
                        disabled={emailVerificationSent}
                        className="text-[9px] font-bold uppercase tracking-widest text-ink/60 hover:text-ink underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
                      >
                        {emailVerificationSent ? "Verification Sent" : "Send Verification"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Phone Number</label>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="text-sm font-mono">{profileData.phone}</div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Specialty</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={profileData.specialty}
                  onChange={(e) => setProfileData({...profileData, specialty: e.target.value})}
                  className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                  placeholder="Enter your specialty"
                />
              ) : (
                <div className="text-sm font-mono">{profileData.specialty}</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Experience Description</label>
            {isEditing ? (
              <textarea 
                value={profileData.specialtyDescription}
                onChange={(e) => setProfileData({...profileData, specialtyDescription: e.target.value})}
                className="w-full h-32 bg-transparent border border-line p-3 text-sm font-mono focus:outline-none focus:border-ink transition-colors resize-none"
                placeholder="Describe your experience..."
              />
            ) : (
              <div className="text-sm font-mono leading-relaxed">{profileData.specialtyDescription}</div>
            )}
          </div>
        </div>
      </section>

      {/* Employer Profile Information Section */}
      <section className="border-b border-line pb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold tracking-tight uppercase">Employer Profile Information</h3>
          <div className="flex items-center gap-2">
            {isEmployerEditing && (
              <button 
                onClick={handleCancelEmployerProfile}
                className="px-4 py-2 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all border border-line hover:bg-ink/5 text-ink"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
            <button 
              onClick={() => isEmployerEditing ? handleSaveEmployerProfile() : setIsEmployerEditing(true)}
              className={cn(
                "px-4 py-2 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all",
                isEmployerEditing 
                  ? "bg-green-600/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-600/20" 
                  : "border border-line hover:bg-ink/5 text-ink"
              )}
            >
              {isEmployerEditing ? (
                <>
                  <Save className="w-3 h-3" /> Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="w-3 h-3" /> Edit Employer Profile
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Employer Name</label>
            {isEmployerEditing ? (
              <input 
                type="text" 
                value={employerData.employerName}
                onChange={(e) => setEmployerData({...employerData, employerName: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter employer name"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.employerName || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Employer Website URL</label>
            {isEmployerEditing ? (
              <input 
                type="url" 
                value={employerData.employerWebsite}
                onChange={(e) => setEmployerData({...employerData, employerWebsite: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="https://example.com"
              />
            ) : (
              <div className="text-sm font-mono">
                {employerData.employerWebsite ? (
                  <a href={employerData.employerWebsite.startsWith('http') ? employerData.employerWebsite : `https://${employerData.employerWebsite}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {employerData.employerWebsite}
                  </a>
                ) : "Not specified"}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Employer Address</label>
            {isEmployerEditing ? (
              <input 
                type="text" 
                value={employerData.employerAddress}
                onChange={(e) => setEmployerData({...employerData, employerAddress: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter full address"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.employerAddress || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Department</label>
            {isEmployerEditing ? (
              <input 
                type="text" 
                value={employerData.department}
                onChange={(e) => setEmployerData({...employerData, department: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter department"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.department || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Hiring Manager</label>
            {isEmployerEditing ? (
              <input 
                type="text" 
                value={employerData.hiringManager}
                onChange={(e) => setEmployerData({...employerData, hiringManager: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter hiring manager"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.hiringManager || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Hiring Manager Title</label>
            {isEmployerEditing ? (
              <input 
                type="text" 
                value={employerData.hiringManagerTitle}
                onChange={(e) => setEmployerData({...employerData, hiringManagerTitle: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter hiring manager title"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.hiringManagerTitle || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Contact Email</label>
            {isEmployerEditing ? (
              <input 
                type="email" 
                value={employerData.contactEmail}
                onChange={(e) => setEmployerData({...employerData, contactEmail: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter contact email"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.contactEmail || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Office Phone Number</label>
            {isEmployerEditing ? (
              <input 
                type="tel" 
                value={employerData.officePhone}
                onChange={(e) => setEmployerData({...employerData, officePhone: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter office phone number"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.officePhone || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Office Fax Number</label>
            {isEmployerEditing ? (
              <input 
                type="tel" 
                value={employerData.officeFax}
                onChange={(e) => setEmployerData({...employerData, officeFax: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter office fax number"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.officeFax || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Onboarding Specialist Name</label>
            {isEmployerEditing ? (
              <input 
                type="text" 
                value={employerData.onboardingSpecialistName}
                onChange={(e) => setEmployerData({...employerData, onboardingSpecialistName: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter onboarding specialist name"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.onboardingSpecialistName || "Not specified"}</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Onboarding Specialist Email</label>
            {isEmployerEditing ? (
              <input 
                type="email" 
                value={employerData.onboardingSpecialistEmail}
                onChange={(e) => setEmployerData({...employerData, onboardingSpecialistEmail: e.target.value})}
                className="w-full bg-transparent border-b border-line py-2 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                placeholder="Enter onboarding specialist email"
              />
            ) : (
              <div className="text-sm font-mono">{employerData.onboardingSpecialistEmail || "Not specified"}</div>
            )}
          </div>
        </div>

        {/* Onboarding Tasks Section */}
        <div className="mt-8 pt-8 border-t border-line">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Team Onboarding Tasks</h4>
            {isEmployerEditing && (
              <button 
                onClick={handleAddTask}
                className="text-[10px] font-bold uppercase tracking-widest text-ink border border-line px-3 py-1.5 hover:bg-ink/5 transition-colors"
              >
                + Add Task
              </button>
            )}
          </div>

          {(!employerData.onboardingTasks || employerData.onboardingTasks.length === 0) ? (
            <div className="text-sm font-mono opacity-40 italic">No onboarding tasks assigned.</div>
          ) : (
            <div className="space-y-4">
              {employerData.onboardingTasks.map((task) => (
                <div key={task.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-line/50 bg-ink/5">
                  {isEmployerEditing ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <label className="block text-[9px] font-bold uppercase tracking-widest opacity-40">Task Name</label>
                        <input 
                          type="text" 
                          value={task.taskName}
                          onChange={(e) => handleUpdateTask(task.id, 'taskName', e.target.value)}
                          className="w-full bg-transparent border-b border-line py-1 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                          placeholder="e.g., Setup IT Equipment"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="block text-[9px] font-bold uppercase tracking-widest opacity-40">Assignee Name</label>
                        <input 
                          type="text" 
                          value={task.assigneeName}
                          onChange={(e) => handleUpdateTask(task.id, 'assigneeName', e.target.value)}
                          className="w-full bg-transparent border-b border-line py-1 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                          placeholder="e.g., Alex Johnson"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="block text-[9px] font-bold uppercase tracking-widest opacity-40">Assignee Role</label>
                        <input 
                          type="text" 
                          value={task.assigneeRole}
                          onChange={(e) => handleUpdateTask(task.id, 'assigneeRole', e.target.value)}
                          className="w-full bg-transparent border-b border-line py-1 text-sm font-mono focus:outline-none focus:border-ink transition-colors"
                          placeholder="e.g., IT Support"
                        />
                      </div>
                      <div className="flex items-end pb-1">
                        <button 
                          onClick={() => handleRemoveTask(task.id)}
                          className="text-red-500 hover:text-red-600 p-2"
                          aria-label="Remove task"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Task</div>
                        <div className="text-sm font-mono">{task.taskName || "Unnamed Task"}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Assignee</div>
                        <div className="text-sm font-mono">{task.assigneeName || "Unassigned"}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Role</div>
                        <div className="text-sm font-mono">{task.assigneeRole || "N/A"}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Grid Section */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line"
      >
        <PassportCard 
          title="Identity" 
          icon={<User className="w-4 h-4" />} 
          data={trustState.identity} 
          onRequestReview={() => onRequestReview?.("Identity")}
        />
        <PassportCard 
          title="Sanctions" 
          icon={<Shield className="w-4 h-4" />} 
          data={trustState.sanctions} 
          onRequestReview={() => onRequestReview?.("Sanctions")}
        />
        <PassportCard 
          title="Licensure" 
          icon={<FileCheck className="w-4 h-4" />} 
          data={{...trustState.licensure, expirationDate: profileData.licenseExpirationDate}} 
          onRequestReview={() => onRequestReview?.("Licensure")}
          isEditing={isEditing}
          onExpirationDateChange={(date) => setProfileData({...profileData, licenseExpirationDate: date})}
        />
        <PassportCard 
          title="Board Certification" 
          icon={<CheckCircle2 className="w-4 h-4" />} 
          data={trustState.boardCertification} 
          onRequestReview={() => onRequestReview?.("Board Certification")}
        />
        <PassportCard 
          title="DEA Registration" 
          icon={<Database className="w-4 h-4" />} 
          data={trustState.deaRegistration} 
          onRequestReview={() => onRequestReview?.("DEA Registration")}
        />
        <PassportCard 
          title="Enrollment" 
          icon={<Activity className="w-4 h-4" />} 
          data={trustState.enrollment} 
          onRequestReview={() => onRequestReview?.("Enrollment")}
        />
      </motion.div>

      {/* Internal Notes Section */}
      <section className="bg-bg border border-line p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ink/5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Internal Notes</h3>
              <p className="text-[10px] font-mono opacity-60 mt-1">Collaborative employer review notes</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Add Note Form */}
          <div className="space-y-3 bg-ink/5 p-4 border border-line/20">
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Posting As:</label>
              <input 
                type="text" 
                value={currentAuthor}
                onChange={(e) => setCurrentAuthor(e.target.value)}
                className="bg-transparent border-b border-line py-1 text-sm font-mono focus:outline-none focus:border-ink transition-colors w-48"
                placeholder="Your Name"
              />
            </div>
            <textarea 
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="w-full bg-bg border border-line p-3 text-sm font-mono focus:outline-none focus:border-ink transition-colors min-h-[80px] resize-y"
              placeholder="Add a note about this clinician's readiness..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
                className="px-4 py-2 bg-ink text-bg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {internalNotes.length === 0 ? (
              <div className="text-sm font-mono opacity-40 italic text-center py-4">No internal notes yet.</div>
            ) : (
              internalNotes.map((note) => (
                <div key={note.id} className="p-4 border border-line/20 bg-bg space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-sm">{note.author}</div>
                    <div className="text-[10px] font-mono opacity-40">
                      {new Date(note.timestamp).toLocaleString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="text-sm font-mono whitespace-pre-wrap opacity-80">{note.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Infrastructure Footer Note */}
      <div className="flex justify-between items-center py-4 border-t border-line/20">
        <div className="flex gap-4 text-[8px] font-mono uppercase tracking-widest opacity-30">
          <span>Node: VCV-US-WEST-01</span>
          <span>Protocol: SD-JWT v2.0</span>
          <span>Hash: 0x8f2...3e1</span>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-green-600/50">
          <div className="w-1 h-1 bg-green-600 rounded-full animate-pulse" />
          Live Connection
        </div>
      </div>
    </div>
  );
}

function PassportCard({ 
  title, 
  icon, 
  data, 
  onRequestReview,
  isEditing,
  onExpirationDateChange
}: { 
  title: string, 
  icon: React.ReactNode, 
  data: TrustItem, 
  onRequestReview?: () => void,
  isEditing?: boolean,
  onExpirationDateChange?: (date: string) => void
}) {
  const isVerified = data.state === "VERIFIED" || data.state === "CLEAR" || data.state === "CHECKED";
  const isPending = data.state === "PENDING";
  const isAccessRequired = data.state === "ACCESS REQUIRED" || data.state === "UNAVAILABLE";
  const isNeedsReview = data.state === "NEEDS REVIEW" || data.state === "MANUAL REVIEW PENDING";
  const isBlocked = data.state === "BLOCKED" || data.state === "FAILED";
  const isContradicted = data.state === "CONTRADICTED";

  return (
    <motion.div 
      variants={item}
      className="bg-bg p-6 space-y-6 hover:bg-ink/5 transition-colors group relative overflow-hidden flex flex-col"
    >
      <div className="flex justify-between items-start">
        <div className="p-2 border border-line/10 group-hover:border-line/30 transition-colors">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold font-mono px-2 py-0.5 border rounded-full",
          isVerified ? "border-green-600/20 text-green-600 dark:text-green-400 bg-green-600/5" :
          isPending ? "border-amber-600/20 text-amber-600 dark:text-amber-400 bg-amber-600/5" :
          isAccessRequired ? "border-blue-600/20 text-blue-600 dark:text-blue-400 bg-blue-600/5" :
          isNeedsReview ? "border-orange-600/20 text-orange-600 dark:text-orange-400 bg-orange-600/5" :
          isBlocked ? "border-red-600/20 text-red-600 dark:text-red-400 bg-red-600/5" :
          isContradicted ? "border-purple-600/20 text-purple-600 dark:text-purple-400 bg-purple-600/5" :
          "border-line/20 opacity-40"
        )}>
          {isVerified && <CheckCircle2 className="w-3 h-3" />}
          {isPending && <Clock className="w-3 h-3" />}
          {isAccessRequired && <Lock className="w-3 h-3" />}
          {isNeedsReview && <ShieldAlert className="w-3 h-3" />}
          {isBlocked && <XCircle className="w-3 h-3" />}
          {isContradicted && <GitCompare className="w-3 h-3" />}
          {!isVerified && !isPending && !isAccessRequired && !isNeedsReview && !isBlocked && !isContradicted && <AlertCircle className="w-3 h-3" />}
          {data.state}
        </div>
      </div>

      <div className="space-y-1 flex-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">{title}</h3>
        <div className="text-sm font-bold tracking-tight flex items-center gap-2">
          {data.source}
          {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />}
          {isPending && <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          {isAccessRequired && <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          {isNeedsReview && <ShieldAlert className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
          {isBlocked && <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
          {isContradicted && <GitCompare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
        </div>
        {title === "Licensure" && (
          <div className="mt-2">
            {isEditing ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Expiration Date</label>
                <input 
                  type="date" 
                  value={data.expirationDate || ""}
                  onChange={(e) => onExpirationDateChange?.(e.target.value)}
                  className="bg-transparent border-b border-line py-1 text-xs font-mono focus:outline-none focus:border-ink transition-colors"
                />
              </div>
            ) : data.expirationDate && (
              <div className="text-[10px] font-mono text-ink/70 mt-1">
                Expires: <span className="font-bold">{new Date(data.expirationDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-line/5">
        <div className="text-[10px] font-mono opacity-60 break-all leading-relaxed mb-2">
          {data.details}
        </div>
        <div className="text-[9px] font-mono opacity-40 uppercase tracking-widest">
          Last Checked: {data.lastChecked ? new Date(data.lastChecked).toLocaleDateString() : 'N/A'}
        </div>
        {isAccessRequired && onRequestReview && (
          <button 
            onClick={onRequestReview}
            className="mt-4 w-full border border-red-500/30 text-red-500 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors"
          >
            Trigger Manual Review
          </button>
        )}
      </div>

      {/* Decorative Infrastructure Elements */}
      <div className="absolute bottom-0 right-0 p-1 opacity-5">
        <div className="w-8 h-8 border-r border-b border-ink" />
      </div>
    </motion.div>
  );
}
