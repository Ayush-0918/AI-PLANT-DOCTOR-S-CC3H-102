'use client';

import {
  Search, ShoppingCart, Filter, Star,
  ShieldCheck, Calculator, Calendar, Clock,
  Tractor, Sprout, Tent, Package, ArrowUpRight,
  User, Phone, MapPin, CheckCircle2, Loader2,
  MessageCircle, X, ChevronRight, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { fetchJson, getBackendBaseUrl } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────
type StoreResponse = { success: boolean; products: Product[]; total: number };

type Product = {
  id: string | number;
  title: string;
  description?: string;
  price: string;
  category: string;
  rating: number;
  reviews?: number;
  seller?: string;
  sellerBadge?: string;
  image?: string;
  stock?: number;
};

type OrderForm = {
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  buyer_address: string;
  quantity: number;
  rental_days: number;
};

type OrderResult = { success: boolean; order_id: string; message: string; whatsapp_url: string; razorpay_order_id?: string; razorpay_key?: string };

// ─── Category Icon Map ─────────────────────────────────────
const CATEGORY_ICONS: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  Medicines: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   icon: Sprout },
  Machines:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', icon: Tractor },
  Seeds:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: Package },
  Rental:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  icon: Tent },
};

// ─── Main Page ─────────────────────────────────────────────
export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Checkout state
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutType, setCheckoutType] = useState<'buy' | 'rent'>('buy');
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'review' | 'success'>('form');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OrderForm>({
    buyer_name: '', buyer_phone: '', buyer_email: '',
    buyer_address: '', quantity: 1, rental_days: 1,
  });

  // EMI modal
  const [showEMI, setShowEMI] = useState<Product | null>(null);
  const [downpayment, setDownpayment] = useState(25);

  // ─── Fetch Products ──────────────────────────────────────
  useEffect(() => {
    async function fetchProducts() {
      try {
        const query = new URLSearchParams();
        if (activeCategory !== 'All') query.append('category', activeCategory);
        if (searchQuery) query.append('search', searchQuery);
        const data = await fetchJson<StoreResponse>(`${getBackendBaseUrl()}/api/v1/store/products?${query}`);
        if (data?.success) setProducts(data.products);
      } catch (e) {
        console.error('Store error:', e);
      } finally {
        setLoading(false);
      }
    }
    const id = setTimeout(fetchProducts, 300);
    return () => clearTimeout(id);
  }, [activeCategory, searchQuery]);

  // ─── Open Checkout ───────────────────────────────────────
  const openCheckout = (prod: Product, type: 'buy' | 'rent') => {
    if (navigator.vibrate) navigator.vibrate(15);
    setCheckoutProduct(prod);
    setCheckoutType(type);
    setCheckoutStep('form');
    setOrderResult(null);
    setForm({ buyer_name: '', buyer_phone: '', buyer_email: '', buyer_address: '', quantity: 1, rental_days: 1 });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const submitOrder = async () => {
    if (!checkoutProduct) return;
    if (!form.buyer_name.trim() || !form.buyer_phone.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        product_id: String(checkoutProduct.id),
        product_title: checkoutProduct.title,
        product_price: checkoutProduct.price,
        category: checkoutProduct.category,
        buyer_name: form.buyer_name.trim(),
        buyer_phone: form.buyer_phone.trim(),
        buyer_email: form.buyer_email.trim() || null,
        buyer_address: form.buyer_address.trim() || null,
        quantity: form.quantity,
        order_type: checkoutType,
        rental_days: checkoutType === 'rent' ? form.rental_days : null,
      };

      const result = await fetchJson<OrderResult>(`${getBackendBaseUrl()}/api/v1/store/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (result?.success) {
        if (result.razorpay_order_id && result.razorpay_key) {
          const res = await loadRazorpayScript();
          if (!res) {
            alert('Payment gateway failed to load. Please try again.');
            setSubmitting(false);
            return;
          }

          const options = {
            key: result.razorpay_key,
            currency: "INR",
            name: "Plant Doctors",
            description: checkoutProduct.title,
            order_id: result.razorpay_order_id,
            handler: function (response: any) {
               console.log("Razorpay Success:", response);
               setOrderResult(result);
               setCheckoutStep('success');
               if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
               setSubmitting(false);
            },
            prefill: {
              name: form.buyer_name,
              email: form.buyer_email || "",
              contact: form.buyer_phone
            },
            theme: {
              color: "#16a34a"
            },
            modal: {
              ondismiss: function() {
                setSubmitting(false);
              }
            }
          };
          const paymentObject = new (window as any).Razorpay(options);
          paymentObject.on('payment.failed', function (response: any) {
               alert(`Payment Failed: ${response.error.description}`);
               setSubmitting(false);
          });
          paymentObject.open();

        } else {
          // Fallback if Razorpay is not configured on backend
          setOrderResult(result);
          setCheckoutStep('success');
          if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
          setSubmitting(false);
        }
      } else {
        setSubmitting(false);
      }
    } catch (e) {
      console.error('Order error:', e);
      setSubmitting(false);
    }
  };

  const closeCheckout = () => setCheckoutProduct(null);
  const categories = [
    { key: 'All',       label: t('shop_cat_all') },
    { key: 'Medicines', label: t('shop_cat_medicines') },
    { key: 'Machines',  label: t('shop_cat_machines') },
    { key: 'Seeds',     label: t('shop_cat_seeds') },
    { key: 'Rental',    label: t('shop_cat_rental') },
  ];

  // Badge translation helper
  const tBadge = (badge: string) => {
    const map: Record<string, string> = {
      'Verified': t('shop_badge_verified'),
      'Premium': t('shop_badge_premium'),
      'Eco': t('shop_badge_eco'),
      'Official': t('shop_badge_official'),
      'Trusted': t('shop_badge_trusted'),
      'Top Rated': t('shop_badge_top_rated'),
      'New Seller': t('shop_badge_new_seller'),
    };
    return map[badge] || badge;
  };

  return (
    <div className="min-h-full bg-[#f8fafc] pb-36">

      {/* ── HEADER ── */}
      <div
        className="sticky top-0 z-40 px-4 pt-4 pb-3 space-y-3"
        style={{
          background: 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('shop_title')}</h1>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{t('shop_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/marketplace/sell"
              className="px-3.5 py-2 rounded-2xl font-black text-xs haptic-btn"
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}
            >
              {t('shop_sell_btn')}
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl haptic-btn"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <ShieldCheck size={13} className="text-emerald-600" />
              <span className="text-xs font-black text-emerald-700">{t('shop_expert_btn')}</span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={t('shop_search_ph')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none font-medium"
          />
          <button
            className="h-7 w-7 rounded-xl flex items-center justify-center bg-slate-100"
          >
            <Filter size={12} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* ── HERO BENTO GRID ── */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileTap={{ scale: 0.96 }}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(12); setActiveCategory('Machines'); }}
            className="relative rounded-3xl p-5 overflow-hidden cursor-pointer haptic-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.05) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div className="absolute -right-4 -bottom-4 opacity-30"><Tractor size={90} className="text-violet-400" /></div>
            <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest relative z-10">{t('shop_heavy')}</p>
            <h3 className="text-2xl font-black text-violet-900 mt-1 relative z-10">{t('shop_cat_machines')}</h3>
            <p className="text-xs text-violet-700 mt-1 relative z-10">{t('shop_tractors_more')}</p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {[
              { cat: 'Medicines', label: t('shop_cat_medicines'), icon: Sprout, color: '#16a34a', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.25)', text: '#14532d' },
              { cat: 'Rental',    label: t('shop_cat_rental'),    icon: Tent,   color: '#2563eb', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.25)', text: '#1e3a8a' },
            ].map(({ cat, label, icon: Icon, color, bg, border, text }) => (
              <motion.div
                key={cat}
                whileTap={{ scale: 0.94 }}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setActiveCategory(cat); }}
                className="relative rounded-2xl p-4 overflow-hidden cursor-pointer haptic-btn"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <Icon size={20} style={{ color }} className="mb-1" />
                <p className="text-xs font-black relative z-10" style={{ color: text }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── CATEGORY CHIPS ── */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(8); setActiveCategory(key); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 border whitespace-nowrap active:scale-95 ${
                activeCategory === key
                  ? 'border-transparent text-[#082032] shadow-[0_8px_24px_rgba(125,211,252,0.26)] bg-[linear-gradient(135deg,#e0f2fe_0%,#7dd3fc_100%)]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── PRODUCTS LIST ── */}
        <div className="space-y-3">
          {loading && products.length === 0 ? (
            <div className="py-16 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-black">No products found</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {products.map((product, i) => {
                const catStyle = CATEGORY_ICONS[product.category] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: Package };
                const isRental = product.category === 'Rental';
                const CatIcon = catStyle.icon;

                return (
                  <motion.div
                    key={`${product.title}-${i}`}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative rounded-2xl p-4 flex gap-4 overflow-hidden bg-white"
                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    {/* Technical Icon / Real Image Container */}
                    <div
                      className="h-20 w-20 rounded-2xl shrink-0 overflow-hidden relative flex items-center justify-center shadow-inner group"
                      style={{ 
                        background: `linear-gradient(135deg, ${catStyle.color}15 0%, ${catStyle.color}05 100%)`, 
                        border: `1px solid ${catStyle.color}30` 
                      }}
                    >
                      {/* Tech Grid Background */}
                      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '8px 8px', color: catStyle.color }} />
                      
                      {/* Inner Glowing Orb */}
                      <div className="absolute h-12 w-12 blur-xl rounded-full translate-y-2" style={{ background: catStyle.color, opacity: 0.15 }} />
                      
                      {/* REAL PRODUCT IMAGE (Removed as per user request) */}

                      {/* Abstract Tech Icon Base (Fallback Visibility) */}
                      <div className="relative z-0 flex items-center justify-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', color: catStyle.color }}>
                         <CatIcon size={26} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {product.sellerBadge && (
                              <span
                                className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full mb-1 inline-block"
                                style={{ background: `${catStyle.color}15`, color: catStyle.color, border: `1px solid ${catStyle.color}25` }}
                              >
                                {tBadge(product.sellerBadge)}
                              </span>
                            )}
                            <h3 className="font-black text-slate-800 text-sm leading-tight">{product.title}</h3>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star size={11} fill="#fbbf24" className="text-amber-400" />
                            <span className="text-[10px] font-black text-amber-500">{product.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">{product.seller || t('shop_verified_seller')}</span>
                          {product.sellerBadge && (
                            <span
                              className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                            >
                              <ShieldCheck size={9} /> {t('shop_badge_verified')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xl font-black text-slate-900">{product.price}</span>
                        <div className="flex gap-2">
                          {product.category === 'Machines' && (
                            <button
                              onClick={() => { if (navigator.vibrate) navigator.vibrate(12); setShowEMI(product); }}
                              className="h-9 w-9 rounded-xl flex items-center justify-center"
                              style={{ background: '#ede9fe', border: '1px solid #c4b5fd' }}
                              title="EMI Calculator"
                            >
                              <Calculator size={15} className="text-violet-600" />
                            </button>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openCheckout(product, isRental ? 'rent' : 'buy')}
                            className="h-9 px-4 rounded-xl flex items-center gap-1.5 font-black text-xs text-white"
                            style={isRental
                              ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }
                              : { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }
                            }
                          >
                            {isRental ? <Clock size={13} className="text-white" /> : <ShoppingCart size={13} className="text-white" />}
                            <span>{isRental ? t('shop_btn_rent') : t('shop_btn_buy')}</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── CHECKOUT MODAL ── */}
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeCheckout}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)' }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative w-full max-w-md rounded-t-[36px] overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #0d1829 0%, #080c14 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -24px 80px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="p-6 space-y-5">
                {/* Handle + close */}
                <div className="flex items-center justify-between">
                  <div className="swipe-handle" />
                  <button onClick={closeCheckout} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <X size={16} className="text-white/60" />
                  </button>
                </div>

                <AnimatePresence mode="wait">

                  {/* ── STEP: FORM ── */}
                  {checkoutStep === 'form' && (
                    <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      {/* Product preview */}
                      <div className="flex gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0" style={{ background: CATEGORY_ICONS[checkoutProduct.category]?.bg }}>
                          {checkoutProduct.image
                            ? <img src={checkoutProduct.image} className="h-full w-full object-cover" alt="" />
                            : <div className="h-full w-full flex items-center justify-center"><Package size={24} style={{ color: CATEGORY_ICONS[checkoutProduct.category]?.color }} /></div>
                          }
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{checkoutProduct.title}</p>
                          <p className="text-lg font-black mt-0.5" style={{ color: CATEGORY_ICONS[checkoutProduct.category]?.color }}>{checkoutProduct.price}</p>
                          <p className="text-[10px] text-white/40">{checkoutProduct.seller}</p>
                        </div>
                      </div>

                      <h2 className="text-xl font-black text-white">{checkoutType === 'rent' ? `📋 ${t('shop_rental_title')}` : `🛒 ${t('shop_order_title')}`}</h2>

                      {/* Form fields */}
                      <div className="space-y-3">
                        <FormField icon={<User size={15} />} placeholder="Your Full Name *" value={form.buyer_name} onChange={(v) => setForm(f => ({ ...f, buyer_name: v }))} type="text" />
                        <FormField icon={<Phone size={15} />} placeholder="Phone Number * (+91...)" value={form.buyer_phone} onChange={(v) => setForm(f => ({ ...f, buyer_phone: v }))} type="tel" />
                        <FormField icon={<MessageCircle size={15} />} placeholder="Email (optional)" value={form.buyer_email} onChange={(v) => setForm(f => ({ ...f, buyer_email: v }))} type="email" />
                        <FormField icon={<MapPin size={15} />} placeholder="Delivery Address" value={form.buyer_address} onChange={(v) => setForm(f => ({ ...f, buyer_address: v }))} type="text" />

                        {checkoutType === 'rent' ? (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Clock size={15} className="text-white/40 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{t('shop_rental_dur')}</p>
                              <div className="flex items-center gap-3">
                                <button onClick={() => setForm(f => ({ ...f, rental_days: Math.max(1, f.rental_days - 1) }))} className="h-7 w-7 rounded-lg text-white font-black" style={{ background: 'rgba(255,255,255,0.1)' }}>−</button>
                                <span className="text-white font-black text-lg w-8 text-center">{form.rental_days}</span>
                                <button onClick={() => setForm(f => ({ ...f, rental_days: Math.min(30, f.rental_days + 1) }))} className="h-7 w-7 rounded-lg text-white font-black" style={{ background: 'rgba(255,255,255,0.1)' }}>+</button>
                                <span className="text-white/40 text-sm">{t('shop_days')}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Package size={15} className="text-white/40 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">{t('shop_qty')}</p>
                              <div className="flex items-center gap-3">
                                <button onClick={() => setForm(f => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))} className="h-7 w-7 rounded-lg text-white font-black" style={{ background: 'rgba(255,255,255,0.1)' }}>−</button>
                                <span className="text-white font-black text-lg w-8 text-center">{form.quantity}</span>
                                <button onClick={() => setForm(f => ({ ...f, quantity: Math.min(99, f.quantity + 1) }))} className="h-7 w-7 rounded-lg text-white font-black" style={{ background: 'rgba(255,255,255,0.1)' }}>+</button>
                                <span className="text-white/40 text-sm">{t('shop_units')}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { if (form.buyer_name && form.buyer_phone) setCheckoutStep('review'); }}
                        disabled={!form.buyer_name || !form.buyer_phone}
                        className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 haptic-btn disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}
                      >
                        {t('shop_review_btn')} <ChevronRight size={18} />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* ── STEP: REVIEW ── */}
                  {checkoutStep === 'review' && (
                    <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h2 className="text-xl font-black text-white">✅ {t('shop_review_title')}</h2>

                      <div className="space-y-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <ReviewRow label="Product" value={checkoutProduct.title} />
                        <ReviewRow label="Price" value={`${checkoutProduct.price}${checkoutType === 'rent' ? ` × ${form.rental_days} day(s)` : ` × ${form.quantity}`}`} highlight />
                        <ReviewRow label="Type" value={checkoutType === 'rent' ? `Rental (${form.rental_days} days)` : 'Purchase'} />
                        <div className="border-t border-white/10 my-2" />
                        <ReviewRow label="Name" value={form.buyer_name} />
                        <ReviewRow label="Phone" value={form.buyer_phone} />
                        {form.buyer_email && <ReviewRow label="Email" value={form.buyer_email} />}
                        {form.buyer_address && <ReviewRow label="Address" value={form.buyer_address} />}
                      </div>

                      <p className="text-xs text-white/40 text-center">{t('shop_wa_prompt')} <span className="text-emerald-400 font-black">{t('shop_wa_via')}</span> on your number.</p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setCheckoutStep('form')}
                          className="flex-1 py-3.5 rounded-2xl font-black text-white/60"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          Edit
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={submitOrder}
                          disabled={submitting}
                          className="flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 haptic-btn"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}
                        >
                          {submitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> {t('shop_confirm_btn')}</>}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP: SUCCESS ── */}
                  {checkoutStep === 'success' && orderResult && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 py-4">
                      {/* Animated checkmark */}
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                        className="h-24 w-24 rounded-full mx-auto flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))', border: '2px solid rgba(34,197,94,0.4)', boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}
                      >
                        <CheckCircle2 size={44} className="text-emerald-400" />
                      </motion.div>

                      <div>
                        <p className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1">🎉 Payment Successful</p>
                         <h2 className="text-2xl font-black text-white mt-1">Order #{orderResult.order_id.split('-')[1] || orderResult.order_id}</h2>
                        <p className="text-white/60 text-sm mt-2 px-4 leading-relaxed">
                          Your order has been confirmed. A receipt and delivery details have been sent to your Email & Phone number.
                        </p>
                      </div>

                      {/* Summary pill */}
                      <div className="rounded-2xl p-4 space-y-2 text-left" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p className="font-black text-white text-base">{checkoutProduct.title}</p>
                        <p className="text-emerald-400 font-bold">{checkoutType === 'rent' ? `${checkoutProduct.price} × ${form.rental_days} days` : `${checkoutProduct.price} × ${form.quantity}`}</p>
                        {form.buyer_email && <p className="text-xs text-white/50 pt-2 border-t border-white/10">📩 {form.buyer_email}</p>}
                        <p className="text-xs text-white/50">📞 {form.buyer_phone}</p>
                      </div>

                      {/* WhatsApp CTA */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => window.open(orderResult.whatsapp_url, '_blank')}
                        className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 haptic-btn"
                        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 6px 24px rgba(37,211,102,0.4)' }}
                      >
                        <MessageCircle size={18} />
                        Get Updates on WhatsApp
                      </motion.button>

                      <button onClick={closeCheckout} className="w-full py-3 text-white/40 hover:text-white transition-colors font-black text-sm">
                        Back to Shop
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EMI MODAL ── */}
      <BottomModal isOpen={!!showEMI} onClose={() => setShowEMI(null)} title={t('shop_emi_title')}>
        <div className="space-y-5">
          <div className="text-center py-3">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('shop_emi_emi')}</p>
            <h3 className="text-5xl font-black text-white mt-2 tracking-tighter">
              ₹12,400
              <span className="text-xl text-white/30">/mo</span>
            </h3>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span className="text-xs font-black text-emerald-400">{t('shop_emi_subsidy')}</span>
            </div>
          </div>

          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between">
              <p className="font-black text-white">{t('shop_emi_downpay')}</p>
              <p className="text-xl font-black text-emerald-400">{downpayment}%</p>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                animate={{ width: `${downpayment}%` }}
                transition={{ type: 'spring', bounce: 0.2 }}
                style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)' }}
              />
            </div>
            <input
              type="range" min="10" max="60" step="5"
              value={downpayment}
              onChange={(e) => setDownpayment(parseInt(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: '#22c55e' }}
            />
          </div>

          <button
            onClick={() => { setShowEMI(null); if (showEMI) openCheckout(showEMI, 'buy'); }}
            className="w-full py-4 rounded-2xl font-black text-white haptic-btn flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.4)' }}
          >
            {t('shop_emi_proceed')} <ArrowUpRight size={18} />
          </button>
        </div>
      </BottomModal>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────
function FormField({ icon, placeholder, value, onChange, type }: {
  icon: ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; type: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span className="text-white/30 shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
      />
    </div>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-white/40 shrink-0">{label}</span>
      <span className={`text-xs text-right font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function BottomModal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md p-6 rounded-t-[32px]"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="swipe-handle mb-5" onClick={onClose} />
            <h2 className="text-xl font-black text-white mb-5">{title}</h2>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
