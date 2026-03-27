'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/client';
import { ArrowRight, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Check if we have the reset token in the URL
    const hash = window.location.hash;
    if (!hash.includes('access_token') && !hash.includes('refresh_token')) {
      setError('Invalid or expired reset link. Please request a new password reset.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '14px',
    color: '#fff',
    outline: 'none',
    fontFamily: "'DM Mono', monospace",
    transition: 'all 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: "'DM Mono', monospace",
    marginBottom: '6px',
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a3d20 0%, #1a7a4a 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
          style={{ maxWidth: '400px', padding: '40px' }}
        >
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#fff', 
            marginBottom: '16px',
            fontFamily: "'DM Mono', monospace" 
          }}>
            Password Reset Successful
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.7)', 
            lineHeight: 1.6,
            fontFamily: "'DM Mono', monospace" 
          }}>
            Redirecting you to login...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a3d20 0%, #1a7a4a 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
        style={{ padding: '20px' }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '40px',
        }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,255,135,0.2)' }}>
              <Lock className="w-5 h-5 text-green-400" />
            </div>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: 800, 
              color: '#fff',
              fontFamily: "'DM Mono', monospace" 
            }}>
              ZENO
            </span>
          </div>

          {/* Header */}
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#fff', 
            marginBottom: '8px',
            fontFamily: "'DM Mono', monospace" 
          }}>
            Reset Password
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.7)', 
            marginBottom: '32px',
            lineHeight: 1.6,
            fontFamily: "'DM Mono', monospace" 
          }}>
            Enter your new password below.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{ ...fieldStyle, paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{ ...fieldStyle, paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  fontSize: '12px',
                  marginBottom: '24px',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.01, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '12px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(0,255,135,0.3)' : 'linear-gradient(135deg, #00ff87 0%, #00d4ff 100%)',
                color: '#0a3d20',
                fontWeight: 800,
                fontSize: '14px',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.03em',
                boxShadow: !loading ? '0 4px 20px rgba(0,255,135,0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s',
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2.5px solid rgba(10,61,32,0.25)',
                    borderTopColor: '#0a3d20',
                  }}
                />
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </form>

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => window.location.href = '/auth'}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '13px',
                fontFamily: "'DM Mono', monospace",
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
