/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User, Phone, Mail, Shield, Hash, Building2,
  MapPin, Activity, RefreshCw, Calendar, CreditCard,
  CheckCircle2, XCircle
} from 'lucide-react';

// ── JWT decode (no library needed) ────────────────────────────────────────────
function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  } catch { return null; }
}

// ── Info row helper ────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value ?? <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>}</span>
    </div>
  );
}

// ── Centre Card ────────────────────────────────────────────────────────────────
function CentreCard({ centre }: { centre: any }) {
  const isActive = centre.isActiveToday;
  return (
    <div className={`relative rounded-2xl border p-4 transition-shadow hover:shadow-md ${
      isActive
        ? 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-800/30 dark:bg-emerald-900/10'
        : 'border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-white/[0.06]'}`}>
            <Building2 size={15} className={isActive ? 'text-emerald-600' : 'text-gray-500'} />
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{centre.name}</div>
            {centre.shortCode && <div className="text-xs text-gray-400 mt-0.5">{centre.shortCode}</div>}
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {centre.city && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <MapPin size={10} /> {centre.city}
          </div>
        )}
        {centre.payCriteria && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <CreditCard size={10} /> {centre.payCriteria}
          </div>
        )}
        {centre.todaysBalance != null && (
          <div className="col-span-2 mt-1 p-2 rounded-lg bg-white/60 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]">
            <div className="text-gray-400 text-xs mb-0.5">Today&apos;s Balance</div>
            <div className="font-bold text-gray-900 dark:text-white">
              ₹{centre.todaysBalance.toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const payload = parseJwt(token);
      const userId = payload?._id || payload?.id || localStorage.getItem('userId');

      if (!token || !userId) throw new Error('Not logged in');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load user');
      const data = await res.json();
      setUser(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const assignedCentres: any[] = user?.centreIds ?? [];
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined;

  if (loading && !user) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="h-48 bg-gray-100 dark:bg-white/[0.05] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-white/[0.05] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
        <XCircle className="mx-auto text-red-500 mb-4" size={40} />
        <h2 className="text-lg font-bold text-red-900 dark:text-red-400">Profile Error</h2>
        <p className="text-red-600 dark:text-red-500/80 mt-2">{error}</p>
        <button onClick={fetchProfile} className="mt-6 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold">Try Again</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-6 lg:px-8">
      
      {/* ── Compact Professional Header ── */}
      <div className="relative group">
        {/* Cover Pattern - Compact */}
        <div className="h-24 sm:h-32 w-full rounded-t-[2rem] bg-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />
          <button 
             onClick={fetchProfile}
             className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:rotate-180 z-20"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Profile Identity Bar */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-b-[2rem] border-x border-b border-gray-100 dark:border-white/[0.06] px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 sm:-mt-16 relative z-10">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-[#222] p-1 shadow-2xl ring-4 ring-white dark:ring-[#1A1A1A]">
               <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                 {initials}
               </div>
            </div>
            
            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {user.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                  {user.status || 'Active'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.05] px-2.5 py-0.5 rounded-lg">
                  <Shield size={12} className="text-indigo-500" /> {user.role}
                </div>
                {user.loginId && (
                  <div className="flex items-center gap-1.5">
                    <Hash size={12} /> ID: <span className="font-mono text-gray-900 dark:text-white">{user.loginId}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} /> Member Since {fmt(user.createdAt)}
                </div>
              </div>
            </div>

            {/* Action Group */}
            <div className="hidden md:flex gap-3 pb-1">
               <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 px-3 py-2 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-indigo-500 tracking-tight leading-none mb-1">Centres</div>
                  <div className="text-lg font-black text-indigo-700 dark:text-indigo-400 leading-none">{assignedCentres.length}</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Centres', value: assignedCentres.length, icon: <Building2 size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Active Today', value: user.activeCount ?? 0, icon: <CheckCircle2 size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'Inactive Today', value: user.inactiveCount ?? 0, icon: <XCircle size={18} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' },
          { label: 'Branches', value: user.branchIds?.length ?? 0, icon: <MapPin size={18} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1A1A1A] p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/[0.06] flex items-center gap-3 transition-colors shadow-sm">
            <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider leading-none">{s.label}</div>
              <div className="text-lg font-black text-gray-900 dark:text-white mt-1">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Personal Information (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white dark:bg-[#1A1A1A] rounded-[1.5rem] border border-gray-100 dark:border-white/[0.06] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <User size={16} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white leading-none">Personal Information</h2>
            </div>
            <div className="space-y-1">
              <InfoRow label="Full Name" value={user.name} />
              <InfoRow label="Role" value={user.role} />
              <InfoRow label="Login ID" value={<span className="font-mono">{user.loginId}</span>} />
              <InfoRow label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : 'Never'} />
              <InfoRow label="Member Since" value={fmt(user.createdAt)} />
            </div>
          </section>

          <section className="bg-white dark:bg-[#1A1A1A] rounded-[1.5rem] border border-gray-100 dark:border-white/[0.06] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Phone size={16} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white leading-none">Contact Details</h2>
            </div>
            <div className="space-y-1">
              <InfoRow label="Mobile Number" value={user.mobileNumber ? String(user.mobileNumber) : undefined} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Aadhar / PAN" value={user.aadharOrPanNumber} />
            </div>
          </section>
        </div>

        {/* Right Column: Assigned Centres (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          <section className="bg-white dark:bg-[#1A1A1A] rounded-[1.5rem] border border-gray-100 dark:border-white/[0.06] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Building2 size={16} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white leading-none">Assigned Centres</h2>
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400 px-3 py-1 bg-gray-50 dark:bg-white/[0.03] rounded-full border border-gray-200/50 dark:border-white/5">
                {assignedCentres.length} Centre{assignedCentres.length !== 1 ? 's' : ''}
              </span>
            </div>

            {assignedCentres.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-gray-100 dark:border-white/[0.05] rounded-[1.5rem]">
                <Building2 size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-800" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No centres assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedCentres.map((centre: any) => (
                  <CentreCard key={centre._id} centre={centre} />
                ))}
              </div>
            )}
          </section>

          {/* Regional & Branch Access */}
          {((user.branchIds?.length ?? 0) > 0 || (user.regionIds?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.branchIds?.length > 0 && (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[1.5rem] border border-gray-100 dark:border-white/[0.06] p-6 shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase text-amber-500 tracking-widest mb-4">Branches</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.branchIds.map((b: any) => (
                      <span key={b._id} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-800/30">
                        {b.name ?? b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.regionIds?.length > 0 && (
                <div className="bg-white dark:bg-[#1A1A1A] rounded-[1.5rem] border border-gray-100 dark:border-white/[0.06] p-6 shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase text-violet-500 tracking-widest mb-4">Regions</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.regionIds.map((r: any) => (
                      <span key={r._id} className="px-3 py-1 bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg border border-violet-100 dark:border-violet-800/30">
                        {r.name ?? r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
