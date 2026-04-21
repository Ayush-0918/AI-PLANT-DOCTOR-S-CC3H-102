'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Animated Counter Hook ─────────────────────────────────────────
function useCounter(end: number, duration = 1500, suffix = '') {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count, ref, suffix };
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ value, label, color, suffix = '+' }: { value: number; label: string; color: string; suffix?: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} style={{ background: color }} className="landing-stat-card">
      <p className="landing-stat-num">{count.toLocaleString()}{suffix}</p>
      <p className="landing-stat-label">{label}</p>
    </div>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="landing-faq-item" onClick={() => setOpen(!open)}>
      <div className="landing-faq-q">
        <span>{q}</span>
        <span className={`landing-faq-icon ${open ? 'open' : ''}`}>+</span>
      </div>
      {open && <p className="landing-faq-a">{a}</p>}
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '🔬',
      color: '#fde8d8',
      iconBg: '#ff7043',
      title: 'Fasal Rog Pahchaan',
      desc: 'AI-powered photo analysis identifies 38+ crop diseases, pests, and nutrient deficiencies in seconds. 84.87% verified accuracy.',
    },
    {
      icon: '🌿',
      color: '#e0f7e9',
      iconBg: '#43a047',
      title: 'Crop Identification',
      desc: 'Snap a photo and instantly identify the crop species, growth stage, and specific care requirements.',
    },
    {
      icon: '📋',
      color: '#dbeafe',
      iconBg: '#1e88e5',
      title: 'Upchar Yojana',
      desc: 'Step-by-step personalized treatment plans with fertilizer recommendations and local market prices.',
    },
    {
      icon: '📞',
      color: '#ede7f6',
      iconBg: '#7e57c2',
      title: 'Expert Doctor Call',
      desc: 'Connect instantly with AI-powered agricultural expert via voice call. Available 24/7 in Hindi and English.',
    },
    {
      icon: '🛒',
      color: '#fff8e1',
      iconBg: '#f59e0b',
      title: 'Krishi Bazaar',
      desc: 'Buy and sell seeds, fertilizers, tools, and equipment directly from farmers. Real mandi prices updated daily.',
    },
    {
      icon: '🌦️',
      color: '#e0f2fe',
      iconBg: '#0288d1',
      title: 'Mausam Sahaayata',
      desc: 'Hyper-local weather intelligence with crop-specific alerts — irrigation advice, frost warnings, and more.',
    },
  ];

  const steps = [
    { num: '1', title: 'Tasveer Kheencho', desc: 'Open the app and take a photo of your sick plant or crop. Works even in low light and dusty field conditions.' },
    { num: '2', title: 'AI Diagnosis Paao', desc: 'Our MobileNetV3 model analyzes the image and identifies the disease or deficiency with confidence scores.' },
    { num: '3', title: 'Upchar Karo', desc: 'Get a complete treatment plan, buy medicines from Krishi Bazaar, or call an expert doctor — all in one tap.' },
  ];

  const faqs = [
    { q: 'Kya yeh app Hindi mein kaam karta hai?', a: 'Haan! Plant Doctor AI fully supports Hindi, English, and multiple Indian regional languages. You can switch language from the settings in the app.' },
    { q: 'Iska AI kitna accurate hai?', a: 'Hamara MobileNetV3 model 84.87% validation accuracy ke saath train hua hai on 38+ crop disease classes using PlantVillage dataset. Har update ke saath accuracy badhti hai.' },
    { q: 'Kya expert call free hai?', a: 'Basic AI diagnosis bilkul free hai. Expert voice call feature premium plan mein available hai. Lekin pehle 3 calls sabke liye free hain.' },
    { q: 'Offline mein kaam karta hai?', a: 'Basic disease detection offline bhi kaam karta hai agar aapne pehle model download kiya ho. Market prices aur weather ke liye internet chahiye.' },
    { q: 'Kaunse crops support hote hain?', a: 'Tomato, Potato, Rice, Wheat, Corn, Grape, Apple, Pepper, Strawberry, Peach, Cherry — 38+ disease classes already supported. Aur crops jaldi aayenge.' },
  ];

  return (
    <div className="landing-root">
      {/* ─── NAVBAR ─────────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-icon">🌱</span>
            <span className="landing-logo-text">Plant Doctor <strong>AI</strong></span>
          </Link>

          <ul className={`landing-nav-links ${menuOpen ? 'open' : ''}`}>
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#how-it-works" onClick={() => setMenuOpen(false)}>Kaise Kaam Karta Hai</a></li>
            <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a></li>
            <li><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a></li>
          </ul>

          <div className="landing-nav-actions">
            <Link href="/dashboard" className="btn-open-app">
              🚀 App Kholein
            </Link>
            <button className="landing-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="landing-container hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI se apni fasal ki suraksha karein
            </div>

            <h1 className="hero-title">
              Apni Fasal Ka<br />
              <span className="hero-title-accent">Naya AI Doctor</span>
            </h1>

            <p className="hero-desc">
              Photo kheeencho aur seconds mein AI rog pahchaan karo. Crop disease detection,
              species identification, treatment plans, expert calls — sab ek premium app mein.
            </p>

            <div className="hero-ctas">
              <Link href="/dashboard" className="btn-primary-hero">
                <span>🚀</span>
                <div>
                  <small>Seedha Kholein</small>
                  <strong>App Shuru Karein</strong>
                </div>
              </Link>
              <a href="#how-it-works" className="btn-secondary-hero">
                <span>▶</span>
                <div>
                  <small>Dekhein kaise</small>
                  <strong>Kaam Karta Hai</strong>
                </div>
              </a>
            </div>

            <p className="hero-trust">
              <span className="trust-avatars">
                <span className="trust-dot" style={{ background: '#a8edea' }} />
                <span className="trust-dot" style={{ background: '#fed6e3' }} />
                <span className="trust-dot" style={{ background: '#96fbc4' }} />
                <span className="trust-dot" style={{ background: '#ffecd2' }} />
              </span>
              <strong>10,000+</strong> farmers already using — India, Nepal, Sri Lanka
            </p>
          </div>

          <div className="hero-phone-wrap">
            <div className="hero-phone-glow" />
            <div className="hero-phone">
              {/* Phone Screen */}
              <div className="phone-screen">
                <div className="phone-status-bar">
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <span>🔋 📶</span>
                </div>
                <div className="phone-content">
                  <p className="phone-greeting">Namaste, Kisan Ji! 🙏</p>
                  <p className="phone-date">Aaj fasal kaisi hai?</p>

                  <div className="phone-scan-btn">
                    <span>📷</span>
                    <div>
                      <strong>Fasal Scan Karein</strong>
                      <span>AI diagnosis in seconds</span>
                    </div>
                    <span className="phone-arrow">→</span>
                  </div>

                  <div className="phone-cards-row">
                    <div className="phone-mini-card" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                      <p className="pmc-val">84.87%</p>
                      <p className="pmc-label">AI Accuracy</p>
                    </div>
                    <div className="phone-mini-card" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                      <p className="pmc-val">28°C</p>
                      <p className="pmc-label">Aaj ka Mausam</p>
                    </div>
                  </div>

                  <div className="phone-alert-card">
                    <div className="pac-header">
                      <span className="pac-dot" />
                      <strong>Recent Scan</strong>
                    </div>
                    <p className="pac-disease">🍅 Tomato Early Blight</p>
                    <div className="pac-confidence">
                      <div className="pac-bar">
                        <div className="pac-fill" style={{ width: '94%' }} />
                      </div>
                      <span>94% confidence</span>
                    </div>
                  </div>

                  <div className="phone-bottom-nav">
                    <span className="pbn-item active">🏠</span>
                    <span className="pbn-item">📷</span>
                    <span className="pbn-item">👥</span>
                    <span className="pbn-item">🛒</span>
                    <span className="pbn-item">👤</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="hero-badge-float hero-badge-float-1">
              <span>🎯</span>
              <div>
                <strong>38+ Diseases</strong>
                <span>Detected</span>
              </div>
            </div>
            <div className="hero-badge-float hero-badge-float-2">
              <span>📞</span>
              <div>
                <strong>Expert Call</strong>
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────────── */}
      <section className="landing-stats-section" id="stats">
        <div className="landing-container">
          <p className="section-eyebrow center">Kisan Bharose Karte Hain</p>
          <h2 className="section-title center">Asli Nateeje, Asli Data</h2>
          <div className="stats-grid">
            <StatCard value={10000} label="Diagnoses Completed" color="linear-gradient(135deg, #e8f5e9, #c8e6c9)" />
            <StatCard value={28} label="States Covered" color="linear-gradient(135deg, #fff8e1, #ffecb3)" suffix="+" />
            <StatCard value={8500} label="Active Farmers" color="linear-gradient(135deg, #ede7f6, #d1c4e9)" suffix="+" />
            <StatCard value={85} label="AI Accuracy" color="linear-gradient(135deg, #fce4ec, #f8bbd0)" suffix="%" />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────── */}
      <section id="features" className="landing-features-section">
        <div className="landing-container">
          <p className="section-eyebrow center">Sab Kuch Ek Jagah</p>
          <h2 className="section-title center">Aapki Fasal Ko Jo Chahiye</h2>
          <p className="section-desc center">
            Easy features jo farming ko simple banate hain — bujurg kisan ho ya naujawan, sabke liye.
          </p>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon-wrap" style={{ background: f.iconBg }}>
                  <span>{f.icon}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="feature-card-bg" style={{ background: f.color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="landing-how-section">
        <div className="landing-container">
          <p className="section-eyebrow center">Simple Process</p>
          <h2 className="section-title center">Teen Steps Mein Shuru Karein</h2>
          <div className="how-grid">
            {steps.map((step, i) => (
              <div key={step.num} className="how-step" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="how-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < steps.length - 1 && <div className="how-connector" />}
              </div>
            ))}
          </div>

          {/* CTA inside section */}
          <div className="how-cta-wrap">
            <Link href="/dashboard" className="btn-primary-center">
              🌱 Abhi Shuru Karein — Bilkul Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" className="landing-pricing-section">
        <div className="landing-container">
          <p className="section-eyebrow center">Sabke Budget Ke Liye</p>
          <h2 className="section-title center">Seedha, Simple Pricing</h2>
          <div className="pricing-grid">
            {/* Free */}
            <div className="pricing-card">
              <div className="pricing-card-header">
                <h3>Free Plan</h3>
                <div className="pricing-price">
                  <span className="price-currency">₹</span>
                  <span className="price-amount">0</span>
                  <span className="price-period">/month</span>
                </div>
                <p>Basic AI diagnosis for every farmer</p>
              </div>
              <ul className="pricing-features">
                <li><span className="pf-icon">✅</span> 5 AI scans per day</li>
                <li><span className="pf-icon">✅</span> Basic disease detection</li>
                <li><span className="pf-icon">✅</span> Hindi + English support</li>
                <li><span className="pf-icon">✅</span> Krishi Bazaar access</li>
                <li><span className="pf-icon">✅</span> Community forum</li>
                <li><span className="pf-icon pf-no">✗</span> Expert voice calls</li>
                <li><span className="pf-icon pf-no">✗</span> Offline mode</li>
              </ul>
              <Link href="/dashboard" className="pricing-btn-outline">
                Free Mein Shuru Karein
              </Link>
            </div>

            {/* Premium */}
            <div className="pricing-card featured">
              <div className="pricing-badge-featured">Most Popular</div>
              <div className="pricing-card-header">
                <h3>Kisan Premium</h3>
                <div className="pricing-price">
                  <span className="price-currency">₹</span>
                  <span className="price-amount">199</span>
                  <span className="price-period">/month</span>
                </div>
                <p>Complete AI farming assistant</p>
              </div>
              <ul className="pricing-features">
                <li><span className="pf-icon">✅</span> Unlimited AI scans</li>
                <li><span className="pf-icon">✅</span> Advanced disease + soil analysis</li>
                <li><span className="pf-icon">✅</span> 3 expert voice calls/month</li>
                <li><span className="pf-icon">✅</span> Personalized treatment plans</li>
                <li><span className="pf-icon">✅</span> Mandi price alerts</li>
                <li><span className="pf-icon">✅</span> Offline mode</li>
                <li><span className="pf-icon">✅</span> Priority support</li>
              </ul>
              <Link href="/dashboard" className="pricing-btn-primary">
                🚀 App Kholein
              </Link>
            </div>

            {/* Pro */}
            <div className="pricing-card">
              <div className="pricing-card-header">
                <h3>Agri Business</h3>
                <div className="pricing-price">
                  <span className="price-currency">₹</span>
                  <span className="price-amount">999</span>
                  <span className="price-period">/month</span>
                </div>
                <p>For FPOs, collectives &amp; agri businesses</p>
              </div>
              <ul className="pricing-features">
                <li><span className="pf-icon">✅</span> Everything in Premium</li>
                <li><span className="pf-icon">✅</span> Up to 50 farmer accounts</li>
                <li><span className="pf-icon">✅</span> Admin dashboard</li>
                <li><span className="pf-icon">✅</span> Bulk scan analytics</li>
                <li><span className="pf-icon">✅</span> Unlimited expert calls</li>
                <li><span className="pf-icon">✅</span> Custom branding</li>
                <li><span className="pf-icon">✅</span> API access</li>
              </ul>
              <Link href="/dashboard" className="pricing-btn-outline">
                Contact Karein
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="landing-faq-section">
        <div className="landing-container faq-inner">
          <div>
            <p className="section-eyebrow">Sawaal Jawab</p>
            <h2 className="section-title">Aam Sawal</h2>
            <p className="section-desc">
              Koi aur sawaal ho? Community forum mein poochhein ya expert call karein.
            </p>
            <Link href="/dashboard" className="btn-primary-center faq-app-btn">
              App Mein Poochhein 💬
            </Link>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="landing-final-cta">
        <div className="landing-container final-cta-inner">
          <div className="final-cta-orb-1" />
          <div className="final-cta-orb-2" />
          <p className="section-eyebrow center light">Abhi Shuru Karein</p>
          <h2 className="final-cta-title">Apni Fasal Ki Suraksha<br />AI Ke Haath Mein Dein</h2>
          <p className="final-cta-desc">
            Millions of Indian farmers waste crops every year due to undetected diseases.
            Be among the first to use AI-powered precision agriculture.
          </p>
          <div className="final-cta-btns">
            <Link href="/dashboard" className="btn-final-primary">
              🚀 App Kholein — Abhi
            </Link>
            <Link href="/scanner" className="btn-final-secondary">
              📷 Live Scan Demo Dekhein
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand">
            <span className="landing-logo-icon">🌱</span>
            <span className="landing-logo-text">Plant Doctor <strong>AI</strong></span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link href="/admin">AI Metrics</Link>
            <Link href="/dashboard">Open App</Link>
          </div>
          <p className="footer-copy">
            © 2025 Plant Doctor AI — Made with ❤️ for Indian Farmers
          </p>
        </div>
      </footer>
    </div>
  );
}
