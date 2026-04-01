import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, CheckCircle2, Clock, AlertCircle, User, Activity, FileCheck, Database, Share2, ShieldAlert, RefreshCw } from "lucide-react";
import { cn } from "@/src/lib/utils";
import SharePacketModal from "./SharePacketModal";

export interface TrustItem {
  source: string;
  state: string;
  details: string;
}

export interface TrustState {
  readinessScore: number;
  estimatedStart: string;
  identity: TrustItem;
  sanctions: TrustItem;
  licensure: TrustItem;
  enrollment: TrustItem;
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
}

export default function ClinicianPassport({ trustState, npi, clinicianName, error, onRetry }: ClinicianPassportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {/* Grid Section */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line"
      >
        <PassportCard 
          title="Identity" 
          icon={<User className="w-4 h-4" />} 
          data={trustState.identity} 
        />
        <PassportCard 
          title="Sanctions" 
          icon={<Shield className="w-4 h-4" />} 
          data={trustState.sanctions} 
        />
        <PassportCard 
          title="Licensure" 
          icon={<FileCheck className="w-4 h-4" />} 
          data={trustState.licensure} 
        />
        <PassportCard 
          title="Enrollment" 
          icon={<Activity className="w-4 h-4" />} 
          data={trustState.enrollment} 
        />
      </motion.div>

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

function PassportCard({ title, icon, data }: { title: string, icon: React.ReactNode, data: TrustItem }) {
  const isVerified = data.state === "VERIFIED" || data.state === "CLEAR";
  const isPending = data.state === "PENDING" || data.state === "CHECKED";

  return (
    <motion.div 
      variants={item}
      className="bg-bg p-6 space-y-6 hover:bg-ink/5 transition-colors group relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="p-2 border border-line/10 group-hover:border-line/30 transition-colors">
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-bold font-mono px-2 py-0.5 border",
          isVerified ? "border-green-600/20 text-green-600/60 bg-green-600/5" :
          isPending ? "border-amber-600/20 text-amber-600/60 bg-amber-600/5" :
          "border-line/20 opacity-40"
        )}>
          {data.state}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">{title}</h3>
        <div className="text-sm font-bold tracking-tight">{data.source}</div>
      </div>

      <div className="pt-4 border-t border-line/5">
        <div className="text-[10px] font-mono opacity-60 break-all leading-relaxed">
          {data.details}
        </div>
      </div>

      {/* Decorative Infrastructure Elements */}
      <div className="absolute bottom-0 right-0 p-1 opacity-5">
        <div className="w-8 h-8 border-r border-b border-ink" />
      </div>
    </motion.div>
  );
}
