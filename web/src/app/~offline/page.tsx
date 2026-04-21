'use client';

import { WifiOff, CloudOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6 relative">
        <WifiOff size={40} />
        <CloudOff size={24} className="absolute -bottom-2 -right-2 text-rose-500 bg-white rounded-full p-1" />
      </div>
      
      <h1 className="text-2xl font-bold text-slate-800 mb-2">You are Offline</h1>
      <p className="text-slate-500 font-medium mb-8">
        Plant Doctor AI requires an active internet connection to scan crops and communicate with our expert servers.
      </p>
      
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl w-full text-left mb-8">
        <h3 className="font-bold text-emerald-800 text-sm mb-1">What can I do?</h3>
        <ul className="text-xs text-emerald-700 space-y-2 list-disc pl-4">
          <li>Check your mobile data or Wi-Fi.</li>
          <li>Move to an area with better signal.</li>
          <li>Basic cached pages may still be readable.</li>
        </ul>
      </div>

      <button onClick={() => window.location.reload()} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-full shadow-lg hover:bg-emerald-700 transition active:scale-95">
        Try Reconnecting
      </button>
      
      <Link href="/" className="mt-4 text-sm font-semibold text-slate-400 hover:text-slate-600">
        Return Home
      </Link>
    </div>
  );
}
