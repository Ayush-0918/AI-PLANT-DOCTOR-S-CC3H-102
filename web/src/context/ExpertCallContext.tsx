'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { fetchJson } from '@/lib/api';

type CallStatus = 'idle' | 'loading' | 'success' | 'error';

interface ExpertCallContextType {
  isOpen: boolean;
  phoneNumber: string;
  status: CallStatus;
  message: string;
  setPhoneNumber: (num: string) => void;
  openCallModal: () => void;
  closeCallModal: () => void;
  triggerCall: () => Promise<void>;
}

const ExpertCallContext = createContext<ExpertCallContextType | undefined>(undefined);

export function ExpertCallProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('6207116098');
  const [status, setStatus] = useState<CallStatus>('idle');
  const [message, setMessage] = useState('');

  const openCallModal = () => setIsOpen(true);
  const closeCallModal = () => {
    setIsOpen(false);
    setStatus('idle');
    setMessage('');
  };

  const triggerCall = async () => {
    if (!phoneNumber) return;
    setStatus('loading');
    
    try {
      const data = await fetchJson<{ success: boolean; message?: string }>(`/api/expert/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });
      if (!data.success) {
        throw new Error(data.message || 'Call failed');
      }
      setStatus('success');
      setMessage('📞 Aapke phone pe call aa rahi hai! Expert se baat karein.');
      setTimeout(() => {
        closeCallModal();
      }, 5000);
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : '';
      setMessage(msg || 'Call nahi hua. Thodi der baad try karein.');

    }
  };

  return (
    <ExpertCallContext.Provider value={{
      isOpen,
      phoneNumber,
      status,
      message,
      setPhoneNumber,
      openCallModal,
      closeCallModal,
      triggerCall
    }}>
      {children}
    </ExpertCallContext.Provider>
  );
}

export function useExpertCall() {
  const context = useContext(ExpertCallContext);
  if (!context) {
    throw new Error('useExpertCall must be used within ExpertCallProvider');
  }
  return context;
}
