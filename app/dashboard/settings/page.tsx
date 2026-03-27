'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { profileStore, UserProfile } from '@/lib/store';
import { authStore } from '@/lib/auth';
import { Settings, User, Bell, Shield, AlertCircle, CheckCircle2, LogOut, ChevronDown, X } from 'lucide-react';

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.8)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '13px',
  width: '100%',
  outline: 'none',
  fontFamily: "'DM Mono', monospace",
};

const labelStyle = {
  fontSize: '10px',
  color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  fontFamily: "'DM Mono', monospace",
  marginBottom: '6px',
  display: 'block',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifSummary, setNotifSummary] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tradingStyle: '',
    experience: '',
    riskTolerance: '',
    preferredSession: 'london' as "london" | "newyork" | "tokyo" | "sydney",
    targetAccount: 0,
  });

  useEffect(() => {
    const savedProfile = profileStore.get();
    if (savedProfile) {
      setProfile(savedProfile);
      setFormData({
        name: savedProfile.name,
        email: savedProfile.email,
        tradingStyle: savedProfile.trading_style || '',
        experience: savedProfile.experience || '',
        riskTolerance: savedProfile.risk_tolerance || '',
        preferredSession: savedProfile.preferred_session,
        targetAccount: savedProfile.target_account,
      });
    } else {
      const user = authStore.getCurrentUser();
      if (user) {
        setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: UserProfile = {
        id: profile?.id || Math.random().toString(36).substr(2, 9),
        user_id: profile?.user_id || authStore.getCurrentUser()?.id || '',
        ...formData,
        trading_style: formData.tradingStyle,
        experience: formData.experience,
        risk_tolerance: formData.riskTolerance,
        preferred_session: formData.preferredSession,
        target_account: formData.targetAccount,
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      profileStore.set(updated);
      setProfile(updated);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authStore.logout();
    window.location.href = '/';
  };

  const SelectField = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between"
          style={{ ...inputStyle, textAlign: 'left' }}
        >
          <span style={{ color: value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }}>{value || 'Select…'}</span>
          <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl overflow-hidden"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
            >
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                  style={{ color: value === opt ? '#00ff87' : 'rgba(255,255,255,0.6)', fontFamily: "'DM Mono',monospace", fontSize: '12px' }}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="relative shrink-0" style={{ width: 44, height: 24 }}>
      <div className="w-full h-full rounded-full transition-all" style={{ background: value ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.08)', border: `1px solid ${value ? 'rgba(0,255,135,0.4)' : 'rgba(255,255,255,0.1)'}` }} />
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute top-0.75 w-4.5 h-4.5 rounded-full"
        style={{ background: value ? '#00ff87' : 'rgba(255,255,255,0.3)', boxShadow: value ? '0 0 8px rgba(0,255,135,0.6)' : 'none' }}
      />
    </button>
  );

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#00ff87,#00d4ff)' }} />
            <span className="text-[11px] tracking-widest text-white/30 uppercase" style={{ fontFamily: "'DM Mono',monospace" }}>Account</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '-0.02em' }}>Settings</h1>
          <p className="text-white/40 text-sm mt-1">Manage your profile and preferences.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontFamily: "'DM Mono',monospace" }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </div>

      {/* Saved badge */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)', color: '#00ff87' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span style={{ fontFamily: "'DM Mono',monospace" }}>Profile saved successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile Card ── */}
      {[
        {
          icon: User,
          title: 'Profile Information',
          fields: [
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
          ],
        },
        {
          icon: Settings,
          title: 'Trading Profile',
          fields: [
            { label: 'Trading Style', key: 'tradingStyle', type: 'select', options: ['Scalping', 'Day Trading', 'Swing Trading', 'Position Trading'] },
            { label: 'Experience Level', key: 'experience', type: 'select', options: ['Beginner (0-1 year)', 'Intermediate (1-3 years)', 'Advanced (3+ years)'] },
            { label: 'Risk Tolerance', key: 'riskTolerance', type: 'select', options: ['Conservative (1-2% per trade)', 'Moderate (2-3% per trade)', 'Aggressive (3-5% per trade)'] },
            { label: 'Preferred Session', key: 'preferredSession', type: 'select', options: ['London', 'New York', 'Tokyo', 'Sydney'] },
            { label: 'Target Account Size ($)', key: 'targetAccount', type: 'number', placeholder: '10000' },
          ],
        },
      ].map((section, si) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={si}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={cardStyle}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.15)' }}>
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-white/80 font-semibold text-sm">{section.title}</span>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'DM Mono',monospace" }}
                >
                  Edit
                </button>
              )}
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((field) => {
                const val = formData[field.key as keyof typeof formData];
                return (
                  <div key={field.key} className={field.type === 'select' && field.key !== 'targetAccount' ? '' : ''}>
                    <label style={labelStyle}>{field.label}</label>
                    {isEditing ? (
                      field.type === 'select' ? (
                        <SelectField
                          value={String(val)}
                          onChange={v => setFormData({ ...formData, [field.key]: field.key === 'preferredSession' ? v.toLowerCase() : v })}
                          options={field.options || []}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={String(val)}
                          placeholder={field.placeholder}
                          onChange={e => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value })}
                          style={inputStyle}
                        />
                      )
                    ) : (
                      <p className="text-sm" style={{ color: val ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono',monospace" }}>
                        {String(val) || '—'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Save / Cancel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-3"
          >
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg,#00ff87 0%,#00d4ff 100%)', color: '#070a10', fontFamily: "'DM Mono',monospace", boxShadow: '0 0 20px rgba(0,255,135,0.25)', opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notifications ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={cardStyle}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
            <Bell className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-white/80 font-semibold text-sm">Notifications</span>
        </div>

        <div className="p-5 space-y-3">
          {[
            { label: 'Trading Alerts', desc: 'Get notified of important market events', value: notifAlerts, toggle: () => setNotifAlerts(v => !v) },
            { label: 'Daily Summary', desc: 'Get daily trading summary at 6 PM', value: notifSummary, toggle: () => setNotifSummary(v => !v) },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-white/70 text-sm font-medium">{item.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.toggle} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Security ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl overflow-hidden"
        style={cardStyle}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-white/80 font-semibold text-sm">Security</span>
        </div>

        <div className="p-5 space-y-2">
          {[
            { icon: AlertCircle, label: 'Change Password', color: 'text-amber-400' },
            { icon: CheckCircle2, label: 'Enable Two-Factor Authentication', color: 'text-emerald-400' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-colors hover:bg-white/4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Danger Zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
          <p className="text-red-400 font-semibold text-sm" style={{ fontFamily: "'DM Mono',monospace" }}>Danger Zone</p>
          <p className="text-white/25 text-xs mt-0.5">Actions that cannot be undone</p>
        </div>
        <div className="p-5">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontFamily: "'DM Mono',monospace" }}
          >
            <AlertCircle className="w-4 h-4" />
            Delete All Trading Data
          </button>
        </div>
      </motion.div>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-red-400 font-bold" style={{ fontFamily: "'DM Mono',monospace" }}>Delete All Data?</h2>
              </div>
              <p className="text-white/50 text-sm mb-4 leading-relaxed">This will permanently delete all your trades, strategies, and learning progress. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace" }}>Cancel</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#ef4444', color: 'white', fontFamily: "'DM Mono',monospace" }}>Delete Everything</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}