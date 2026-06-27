import React, { useState, useRef, useEffect } from 'react';

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface LockScreenProps {
  isSetupMode: boolean;
  onUnlock: (password: string) => Promise<boolean>;
  onSetup: (password: string) => Promise<void>;
}

const PinInput = ({ value, onChange, autoFocus }: { value: string, onChange: (val: string) => void, autoFocus?: boolean }) => {
  const inputs = Array(6).fill(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    
    // Use spaces to represent empty slots to keep the string length exactly 6
    let newValueArray = value.padEnd(6, ' ').split('');
    newValueArray[index] = val || ' ';
    
    const newValue = newValueArray.join('').slice(0, 6);
    onChange(newValue);
    
    // Auto-focus next input if a digit was entered
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const charAt = value.padEnd(6, ' ')[index];
      if (charAt === ' ' && index > 0) {
        // If current is empty and we press backspace, focus previous and clear it
        let newValueArray = value.padEnd(6, ' ').split('');
        newValueArray[index - 1] = ' ';
        onChange(newValueArray.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted.padEnd(6, ' '));
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      {inputs.map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value.padEnd(6, ' ')[i] === ' ' ? '' : value.padEnd(6, ' ')[i]}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          style={{
            width: '3rem', height: '3.5rem',
            textAlign: 'center', fontSize: '1.5rem',
            borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none',
            transition: 'border-color 0.2s',
            appearance: 'textfield'
          }}
          onFocus={e => e.target.style.borderColor = '#6366f1'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
        />
      ))}
    </div>
  );
};

export function LockScreen({ isSetupMode, onUnlock, onSetup }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-submit for unlock when 6 digits are entered
  useEffect(() => {
    const cleanPassword = password.replace(/ /g, '');
    if (!isSetupMode && cleanPassword.length === 6 && !isSubmitting) {
      handleUnlockAttempt(cleanPassword);
    }
  }, [password, isSetupMode, isSubmitting]);

  // Auto-submit for setup when both passwords match and are 6 digits
  useEffect(() => {
    const cleanPassword = password.replace(/ /g, '');
    const cleanConfirm = confirmPassword.replace(/ /g, '');
    if (isSetupMode && cleanPassword.length === 6 && cleanConfirm.length === 6 && !isSubmitting) {
      handleSetupAttempt(cleanPassword, cleanConfirm);
    }
  }, [password, confirmPassword, isSetupMode, isSubmitting]);

  const handleUnlockAttempt = async (pin: string) => {
    setIsSubmitting(true);
    setError('');
    const isSuccess = await onUnlock(pin);
    if (!isSuccess) {
      setError('Incorrect PIN. Please try again.');
      setPassword(''); // Clear the PIN on failure
      setIsSubmitting(false);
    } else {
      setSuccess('PIN verified! Unlocking...');
    }
  };

  const handleSetupAttempt = async (pin: string, confirmPin: string) => {
    setIsSubmitting(true);
    setError('');
    
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      // Keep confirm password but maybe clear it for them to try again
      setConfirmPassword('');
      setIsSubmitting(false);
      return;
    }
    
    setSuccess('PIN set successfully! Unlocking...');
    await onSetup(pin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.replace(/ /g, '');
    const cleanConfirm = confirmPassword.replace(/ /g, '');
    
    if (isSetupMode) {
      if (cleanPassword.length !== 6) {
        setError('PIN must be exactly 6 digits.');
        return;
      }
      handleSetupAttempt(cleanPassword, cleanConfirm);
    } else {
      if (cleanPassword.length !== 6) {
        setError('PIN must be exactly 6 digits.');
        return;
      }
      handleUnlockAttempt(cleanPassword);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#0f0f13', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)', padding: '2.5rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)', width: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6366f1' }}>
            lock
          </span>
        </div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>{isSetupMode ? 'Setup Vault PIN' : 'Unlock Vault'}</h2>
        <p style={{ opacity: 0.6, marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
          {isSetupMode ? 'Create a 6-digit master PIN to protect your snippets.' : 'Enter your 6-digit PIN to access your snippets.'}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            {isSetupMode && <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>Enter PIN</div>}
            <PinInput value={password} onChange={setPassword} autoFocus={true} />
          </div>
          
          {isSetupMode && (
            <div>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.8 }}>Confirm PIN</div>
              <PinInput value={confirmPassword} onChange={setConfirmPassword} />
            </div>
          )}
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#10b981', fontSize: '0.875rem', textAlign: 'center' }}>{success}</div>}
          
          <button type="submit" disabled={isSubmitting} style={{ padding: '0.875rem', borderRadius: '0.5rem', border: 'none', background: isSubmitting ? '#4338ca' : '#6366f1', color: 'white', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem', fontSize: '1rem', transition: 'background 0.2s' }}
            onMouseOver={e => { if (!isSubmitting) (e.target as HTMLButtonElement).style.background = '#4f46e5' }}
            onMouseOut={e => { if (!isSubmitting) (e.target as HTMLButtonElement).style.background = '#6366f1' }}
          >
            {isSetupMode ? 'Set PIN' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
