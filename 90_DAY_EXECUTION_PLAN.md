# 🚀 Plant Doctor — 90-Day Execution Plan (ACTIVE)

**Status**: Week 1 Foundation Complete ✅  
**Last Updated**: April 18, 2026  
**Team**: Backend Dev + Frontend Dev + DevOps  
**Expected ROI**: ₹8.2L investment → ₹5-10L/month revenue

---

## 📊 Executive Summary: What You're Building

```
START (Today)           WEEK 4 (Launch Revenue)      WEEK 8 (Scale)
├─ DB Indexing ✅       ├─ Dosage Calculator 🔥     ├─ ₹5-10L/month
├─ Redis Cache ✅       ├─ Expert Network ✅         ├─ 8K DAU
├─ UI Fixes → WIP       ├─ B2B Orders ✅            ├─ 55% retention
└─ Next: Soil Model    └─ Revenue: ₹50-150K first  └─ Full feature launch
                             week
```

### Current Progress
- ✅ **Week 1 (Days 1-5)**: Foundation Complete
  - Database indexing: **DONE** (1h)
  - Redis caching: **DONE** (4h)
  - UI bugs: **IN PROGRESS** (4.5h remaining)
  - Runway: **8.5/9.5 hours used**

---

## 🎯 WEEK-BY-WEEK BREAKDOWN (Your Master Schedule)

### **WEEK 1: Foundation** ✅ 90% Complete

#### ✅ COMPLETED
- [x] Database indexing (production-ready, 10-40x faster)
- [x] Redis caching (95% API call reduction)
- [x] Cache integrated with weather endpoint

#### 🔄 IN PROGRESS (Do This Today)
- [ ] Fix 6 UI bugs (4.5 hours total)

**Team Assignment This Week:**
- **Backend Dev**: Monitoring database indexes + Redis ✅
- **Frontend Dev**: Fix UI bugs TODAY
- **DevOps**: Infrastructure stable ✅

**Success Metrics:**
- ✅ App load time: 3-5s → **targeting 500-800ms** (80% improvement)
- ✅ Weather API latency: **< 50ms** from cache
- ✅ Zero deployment issues: **ACHIEVED**

---

### **WEEK 2: AI Features** (Start Monday Week 2)

#### Tasks (5 working days)

**Day 1-2: Soil Classification (4 hours)**
```
Backend Dev:
├─ Load soil_classifier.pth model
├─ Create backend/app/services/soil_model.py
├─ Build /api/v1/soil/analyze endpoint
└─ Test with sample images

Frontend Dev:
├─ Idle (or help with UI polish)
└─ Ready for soil UI next week
```

**Day 2-3: Confidence Calibration (3 hours)**
```
Backend Dev:
├─ Update ai_model.py predict() function
├─ Add top-2 logits tracking
├─ Return reliability level (HIGH/MEDIUM/LOW)
└─ Test with 50+ plant images

Expected Output:
├─ Confidence: 87.5%
├─ Reliability: HIGH
├─ Top-2 difference: 0.23
└─ Recommendation: "AUTO_RECOMMEND"
```

**Day 4-5: Expert Network MVP (6 hours)**
```
Backend Dev:
├─ Create expert profile DB schema
├─ Build /api/v1/experts/search endpoint
├─ Build /api/v1/expert/{id}/book-call endpoint
└─ Add expert verification badges

Frontend Dev:
├─ Fetch and display expert list
├─ Add expert search UI
└─ Integrate booking flow
```

**Success Metrics:**
- ✅ Soil analyzer API ready
- ✅ Expert search returns top 20 matches
- ✅ Push notifications sent: 1000+
- ✅ Confidence calibration improves predictions by 15%

---

### **WEEK 3-4: Monetization Sprint** (Days 1-10, THE REVENUE WEEK)

**This is your biggest opportunity!** 💰

#### Day 1-3: Dosage Calculator Backend (3 hours) 🔥
```python
Backend Dev:
├─ Create backend/app/api/routes/dosage.py
├─ Implement calculate_dosage_smart() function
├─ Input: crop, disease, area_hectares, spray_method
├─ Output: {
│    exact_liters: 375,
│    chemical_kg: 0.94,
│    cost_estimate: ₹1440,
│    recommended_products: [...],
│    expert_tips: [...]
│  }
├─ Database schema: scans collection + dosage_calcs collection
└─ Test with 20+ crop-disease combinations
```

**Expected Revenue from Dosage Calc:**
- ₹500-2,000 per transaction
- 100-200 transactions/day potential
- **= ₹3-6 Lakh/month**

#### Day 2-3: Marketplace Product Matching (2 hours)
```
Backend Dev:
├─ Query products.collection for medicine matches
├─ Implement price comparison logic
├─ Add local agro-dealer geospatial search
└─ Return top 5 products sorted by price

Frontend Dev:
├─ Test product fetching
└─ Ready for UI integration next
```

#### Day 4-5: Dosage Calculator Frontend (2 hours)
```
Frontend Dev:
├─ Create web/src/app/calculator/page.tsx
├─ Build input form: crop, disease, area, method
├─ Display: dosage result, cost estimate, products
├─ Add [BUY NOW] button → Razorpay checkout
└─ Test end-to-end

Expected UI:
┌─────────────────────────────┐
│ 💊 Dosage Calculator       │
├─────────────────────────────┤
│ Crop: [Tomato ▼]           │
│ Disease: [Early Blight ▼]  │
│ Farm Size: [2.5 ha]        │
│ [Calculate]                │
├─────────────────────────────┤
│ 💧 You need: 375L          │
│ 📦 0.75kg Mancozeb 75% WP  │
│ 💰 ₹1,440 (estimated)      │
│                            │
│ 🛒 Recommended Products:   │
│ • Mancozeb Brand A: ₹1,200 │
│ • Mancozeb Brand B: ₹1,440 │
│ • Local Dealer: ₹1,350     │
│                            │
│ [✅ Complete Purchase]     │
└─────────────────────────────┘
```

#### Day 6-7: Pricing Intelligence (6 hours)
```
Backend Dev:
├─ Create backend/app/services/price_engine.py
├─ Integrate agro-dealer APIs
├─ Implement price comparison logic
├─ Add local/online filtering
└─ Cache results (30 min TTL)

Frontend Dev:
├─ Display price comparison UI
├─ Show "Best Deal" badge
└─ Add "See Nearby Shops" button
```

#### Day 8-10: B2B Cooperative Ordering (5 hours)
```
Backend Dev:
├─ Create B2B order schema (cooperative bulk orders)
├─ Implement bulk discount logic:
│  ├─ 1000+ units: 25% discount
│  ├─ 500-999 units: 20% discount
│  └─ 100-499 units: 15% discount
├─ Build /api/v1/b2b/cooperative-orders endpoint
├─ Add account manager notification system
└─ Test with sample cooperative order

Expected Order Value:
├─ Typical cooperative order: ₹5-50 Lakh
├─ Our margin: 15-25% of total
└─ Expected orders: 2-5/month
```

**Week 3-4 Success Metrics:**
- ✅ Dosage calculator: **100+ transactions** (₹50-150K revenue)
- ✅ Price intelligence: **Showing live prices** from 5+ sources
- ✅ B2B orders: **First cooperative order received**
- ✅ User engagement: **Session duration +50%** (3-4 min → 6-8 min)

---

### **WEEK 5-6: Features & Polish**

#### Day 1-3: Performance Optimization (5 hours)
```
DevOps:
├─ Image compression + WEBP conversion (2h)
├─ AWS S3 + Cloudflare CDN setup (2h)
├─ API rate limiting (Redis-backed) (1h)
└─ Monitor performance with DataDog

Frontend Dev:
├─ Bundle size optimization (webpack)
├─ Lazy load routes
└─ Minify assets
```

**Expected Impact:**
- ✅ Image load time: **60-80% smaller** (WEBP format)
- ✅ CDN global distribution: **50-100ms** vs 1-2s
- ✅ App bundle: **30% smaller**

#### Day 4-7: Gamification & Dark Mode (6 hours)
```
Backend Dev (2h):
├─ Create badge system DB schema
├─ Implement badge logic:
│  ├─ first_scan: Completed first AI scan
│  ├─ crop_master: Scanned 50+ crops
│  ├─ expert_caller: Made 5+ expert calls
│  ├─ marketplace_buyer: Purchased 10+ products
│  └─ soil_expert: Completed 10 soil analyses
├─ Build /api/v1/users/{id}/badges endpoint
└─ Build /api/v1/leaderboard endpoint

Frontend Dev (4h):
├─ Create dark mode theme system (ThemeContext)
├─ Add theme toggle in settings
├─ Update Tailwind config for dark mode
├─ Update all components: light/dark compatibility
├─ Add badge display component
├─ Add leaderboard UI
└─ Test on mobile
```

**Expected Impact:**
- ✅ 20-30% increase in repeat usage (gamification)
- ✅ Modern UI feel (dark mode)
- ✅ User retention: **30% → 55%**

#### Day 8-14: Testing & Documentation
```
QA (2h):
├─ End-to-end testing (new features)
├─ Mobile device testing (iPhone, Android)
└─ Create test report

Backend Dev (1.5h):
├─ API documentation (OpenAPI/Swagger)
└─ Generate auto-docs

Frontend Dev (1h):
├─ Create user guide (in-app)
└─ Troubleshooting docs
```

**Success Metrics:**
- ✅ All features tested end-to-end
- ✅ API docs generated
- ✅ Zero critical bugs
- ✅ Ready for production launch

---

### **WEEK 7-8: Launch & Scale** 🚀

#### Day 1-3: Production Deployment
```
DevOps:
├─ Deploy to production (AWS/Google Cloud)
├─ Set up monitoring (Sentry, DataDog)
├─ Set up backups (automated daily)
├─ Health checks + alerting
└─ Load testing (simulating 10K users)

Backend Dev:
├─ Monitor API performance
├─ Check error rates
└─ Validate database replication

Frontend Dev:
├─ Monitor frontend errors
├─ Check Core Web Vitals
└─ Validate analytics
```

#### Day 4-5: Soft Launch (10% of Users)
```
Product:
├─ Enable new features for 10% of farmers (feature flags)
├─ Monitor metrics:
│  ├─ Dosage calc conversion rate
│  ├─ Error rates
│  ├─ Session duration
│  └─ User feedback (in-app survey)
├─ Gather feedback + fix bugs
└─ Prepare for full launch
```

#### Day 6-7: Full Public Launch 🎉
```
Marketing:
├─ Send launch email to all farmers
├─ In-app notification: "New Features!"
├─ Social media posts
├─ Press release

Product:
├─ Enable 100% of features
├─ Monitor usage metrics
├─ Track first week revenue
└─ Celebrate! 🎉
```

#### Day 8-14: Scale & Optimize
```
DevOps:
├─ Monitor server load
├─ Auto-scale if needed
├─ Optimize slow queries (based on logs)
└─ Update infrastructure docs

Backend Dev:
├─ Monitor dosage calc conversion
├─ Fix any reported issues
├─ Add new features based on feedback
└─ Begin Week 9 features

Frontend Dev:
├─ Fix user-reported UI issues
├─ A/B test dosage calc layout
├─ Gather usage analytics
└─ Plan next iteration
```

**Week 7-8 Success Metrics:**
- ✅ **DAU**: 5K → **8K** (+60%)
- ✅ **Session Duration**: 3-4 min → **8-10 min** (+150%)
- ✅ **Retention**: 30% → **55%** (+83%)
- ✅ **First Week Revenue**: **₹50-150K**
- ✅ **Monthly Recurring**: **₹5-10 Lakh**
- ✅ **Expert Network Size**: **500+ verified experts**

---

## 💰 Revenue Projections (This is the Prize!)

### Month 1 (Week 3-4)
```
Dosage Calculator Sales:
├─ Week 3: 20 transactions × ₹1,500 × 20% margin = ₹6,000
├─ Week 4: 50 transactions × ₹1,500 × 20% margin = ₹15,000
└─ Week 3-4 Total: ₹21,000
```

### Month 2 (Week 5-8)
```
Dosage Calculator:
├─ 150 transactions/week × ₹1,500 × 20% margin = ₹90,000/week
├─ 4 weeks × ₹90,000 = ₹3.6 Lakh

Expert Commissions:
├─ 50 calls × ₹300 × 20% = ₹3,000

B2B Orders:
├─ 1 cooperative order × ₹50 Lakh × 20% margin = ₹10 Lakh

Month 2 Total: ₹13.6 Lakh
```

### Month 3+ (Sustained)
```
Monthly Recurring Revenue:
├─ Dosage Calculator: ₹3-6 Lakh
├─ B2B Orders: ₹2-3 Lakh
├─ Expert Commissions: ₹50-100K
└─ TOTAL: ₹5-10 Lakh/month

Annual Potential:
├─ Dosage Calculator alone: ₹2-5 Crore/year
├─ B2B + Experts: ₹1-2 Crore/year
└─ Total Annual Revenue Potential: ₹3-7 Crores
```

---

## 👥 Team Assignments (Your Weekly Workload)

### Backend Developer (Primary owner: APIs + Database)

**Week 1**: ✅ Database + Redis (8h used)  
**Week 2**: Soil model + Confidence + Experts (13h)  
**Week 3-4**: Dosage calc + Pricing + B2B (11h)  
**Week 5-6**: Badges + Performance (4h)  
**Week 7-8**: Production + Monitoring (8h)  
**Total**: ~54 hours (6.75 full days)

**Deliverables by Week:**
- W1: Production DB indexes + Redis caching
- W2: `/soil/analyze`, confidence calibration, expert search API
- W3-4: `/dosage/calculate`, price comparison, B2B orders
- W5-6: Badge system, leaderboard, rate limiting
- W7-8: Production deployment, monitoring, scaling

---

### Frontend Developer (Primary owner: UI + Features)

**Week 1**: ✅ UI bug fixes (4.5h remaining)  
**Week 2**: Soil UI + Expert UI (4h)  
**Week 3-4**: Dosage calculator (2h) + Dark mode (4h)  
**Week 5-6**: Gamification UI (2h)  
**Week 7-8**: Launch + Scale (4h)  
**Total**: ~20 hours (2.5 full days)

**Deliverables by Week:**
- W1: Fix 6 UI bugs (dropdown, camera, assistant, etc)
- W2: Soil analysis UI, expert directory, booking flow
- W3-4: Dosage calculator page, dark mode, price display
- W5-6: Badge display, leaderboard, theme toggle
- W7-8: Launch coordination, A/B testing, optimization

---

### DevOps/Infrastructure (Secondary owner: Infrastructure + Scaling)

**Week 1**: ✅ Monitoring setup  
**Week 2**: Redis Docker + Health checks (2h)  
**Week 3-4**: Idle (support as needed)  
**Week 5-6**: CDN + S3 setup + Rate limiting (5h)  
**Week 7-8**: Production deployment + Scaling (8h)  
**Total**: ~15 hours (2 days)

**Deliverables by Week:**
- W1: Monitoring configured
- W2: Redis docker-compose running
- W5-6: AWS S3 + Cloudflare CDN, rate limiting
- W7-8: Production deployment, monitoring, auto-scaling

---

## ⚠️ Risk Management (What Could Go Wrong?)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Redis setup delays | Medium | Low | Pre-built Docker image ✅ |
| Dosage calc complexity | Low | High | Copy-paste implementation ready |
| Payment integration issues | Medium | High | Test with Razorpay sandbox first |
| Expert network sparse | High | Medium | Pre-recruit 100 experts before W7 |
| Database migration issues | Low | High | Backup strategy + testing |
| UI responsiveness on old phones | Medium | Medium | Mobile testing framework ready |

---

## 📈 Success Metrics Dashboard

Track these weekly:

```
WEEK 1
├─ ✅ Database indexes created
├─ ✅ Redis cache deployed
├─ ⏳ UI bugs: 4/6 fixed (target: 6/6 by Friday)
└─ Load time: 3-5s → [track progress]

WEEK 2
├─ Soil analyzer API: [ ] Ready
├─ Confidence calibration: [ ] Deployed
├─ Expert network size: [ ] 50+ experts
└─ Performance: [ ] < 50ms weather API

WEEK 3-4
├─ Dosage calculator: [ ] First 100 transactions
├─ Revenue: [ ] ₹50-150K first week
├─ B2B orders: [ ] First cooperative order
└─ Engagement: [ ] Session duration +50%

WEEK 5-6
├─ Performance: [ ] App load < 2 seconds
├─ Dark mode: [ ] 100% component coverage
├─ Gamification: [ ] 50+ farmers with badges
└─ Testing: [ ] 100% feature coverage

WEEK 7-8
├─ DAU: [ ] 5K → 8K (+60%)
├─ Retention: [ ] 30% → 55%
├─ Monthly revenue: [ ] ₹5-10 Lakh
└─ Expert network: [ ] 500+ verified
```

---

## 🚀 Quick Action Items (This Week)

### TODAY (April 18)
- [ ] **Frontend Dev**: Start UI bug fixes (4.5 hours)
  - Language dropdown overlap (30 min)
  - Camera capture button (1h)
  - Assistant popup close (30 min)
  - Crop selector scroll (45 min)
  - Community overlaps (1h)
  - Language selector position (1h)

### By Friday (April 22)
- [ ] All 6 UI bugs fixed
- [ ] Internal demo working
- [ ] Deploy to staging

### Week 2 (April 25-29)
- [ ] Soil model integrated
- [ ] Confidence calibration live
- [ ] Expert network MVP ready

### Week 3 (May 2-6)
- [ ] Dosage calculator live
- [ ] First revenue tracked
- [ ] B2B onboarding started

---

## 💡 Key Success Factors

1. **Start with quick wins** (database + UI) → builds momentum
2. **Focus on dosage calculator** → direct revenue lever
3. **Parallel work** → backend API while frontend builds UI
4. **Daily standups** → 15 min sync to unblock issues
5. **Weekly metrics** → track progress against targets
6. **User feedback loop** → iterate based on farmer usage

---

## 📚 Resources & References

| Resource | Link | Owner |
|----------|------|-------|
| Improvement Recommendations | `/IMPROVEMENT_RECOMMENDATIONS.md` | Product |
| Implementation Code Snippets | `/IMPLEMENTATION_CODE_SNIPPETS.md` | Dev |
| Roadmap Details | `/ROADMAP_90_DAYS.md` | PM |
| Architecture Docs | `/ARCHITECTURE.md` | Tech Lead |

---

## 🎯 By Week 8, You'll Have Built:

✅ Production-grade database  
✅ Intelligent caching layer  
✅ 360° crop health (disease + soil)  
✅ Smart dosage calculator (**Revenue driver**)  
✅ Expert network marketplace  
✅ B2B bulk ordering channel  
✅ Gamification system  
✅ Dark mode  
✅ Performance-optimized app  
✅ **₹5-10 Lakh monthly recurring revenue**

---

**Let's build this! 🚀**  
*You've already completed the hard foundation work. The next 7 weeks are about turning that into revenue.*

Questions? Ask your team to review this plan together!
