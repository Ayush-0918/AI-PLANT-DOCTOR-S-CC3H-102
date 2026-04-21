'use client';

import { useState } from 'react';
import { ChevronLeft, Upload, CheckCircle2, Package, Tag, Wallet, User, Phone, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getBackendBaseUrl } from '@/lib/api';

export default function SellProductPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Seeds',
    price: '',
    seller: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.seller || !form.phone) return;

    setSubmitting(true);
    try {
      // Build a basic payload. In a real app we'd handle image files via FormData.
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        price: form.category === 'Rental' ? `₹${form.price}/hr` : `₹${form.price}`,
        seller: form.seller,
        phone: form.phone,
        rating: 5.0,
        reviews: 0,
        sellerBadge: "New Seller",
        image: "https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?q=80&w=400" // Fallback local simulated upload
      };

      const res = await fetch(`${getBackendBaseUrl()}/api/v1/store/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
      }
    } catch (error) {
      console.error('Error posting product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </motion.div>
        <h1 className="text-2xl font-black text-slate-900 text-center mb-2">Product Listed!</h1>
        <p className="text-slate-500 text-center mb-8">Your product is now live in the global marketplace.</p>
        <Link href="/marketplace" className="w-full max-w-sm py-4 rounded-2xl font-black text-white bg-slate-900 flex items-center justify-center">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 py-4 flex items-center gap-4">
        <Link href="/marketplace" className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center haptic-btn">
          <ChevronLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-slate-900">Sell an Item</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">List instantly nationwide</p>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Image Upload Mock */}
          <div className="w-full h-40 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer haptic-btn">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload size={20} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-600">Tap to Upload Photo</p>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5"><Tag size={12}/> Product Title</label>
              <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} type="text" placeholder="e.g., HD 2967 Wheat Seeds 10kg" className="w-full bg-slate-50/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Condition, quality, brand details..." className="w-full bg-slate-50/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 h-24 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5"><Package size={12}/> Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full bg-slate-50/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none appearance-none">
                  <option value="Seeds">Seeds</option>
                  <option value="Medicines">Medicines & Fert</option>
                  <option value="Machines">Machines</option>
                  <option value="Rental">Rental</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5"><Wallet size={12}/> Price (₹)</label>
                <input required value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} type="number" placeholder="0.00" className="w-full bg-slate-50/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-800 mb-2">Seller Details</h3>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5"><User size={12}/> Your Name</label>
              <input required value={form.seller} onChange={e => setForm(f => ({...f, seller: e.target.value}))} type="text" placeholder="Full name" className="w-full bg-slate-50/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5"><Phone size={12}/> Phone Number</label>
              <input required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} type="tel" placeholder="+91..." className="w-full bg-slate-50/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            disabled={submitting}
            type="submit"
            className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'List Product Now'}
          </motion.button>

        </form>
      </div>
    </div>
  );
}
