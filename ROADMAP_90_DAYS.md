# 🗺️ Plant Doctor — 90-Day Upgrade Roadmap

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  WEEK 1-2: Foundation                 WEEK 3-4: Features              │
│  ✅ Database Indexing                 ✅ Soil Classification          │
│  ✅ Redis Caching                     ✅ Confidence Calibration      │
│  ✅ Fix 6 UI Bugs                     ✅ Expert Network Beta         │
│  ✅ Push Notifications Setup                                          │
│                                                                         │
│  WEEK 5-6: Monetization               WEEK 7-8: Launch & Scale      │
│  ✅ Dosage Calculator                 ✅ Performance Optimization    │
│  ✅ Pricing Intelligence              ✅ B2B Cooperative Channel     │
│  ✅ Marketplace Integration           ✅ Public Release & Marketing  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Week-by-Week Breakdown

### **WEEK 1: Foundation (Monday - Friday)**

#### Day 1-2: Database Optimization
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Create production indexes | 1h | Backend | ⏳ |
| Test index performance | 0.5h | Backend | ⏳ |
| Document index strategy | 0.5h | Backend | ⏳ |

**Deliverable**: App 10-40x faster on geospatial queries

---

#### Day 2-3: Redis Setup
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Install Redis (Docker) | 1h | DevOps | ⏳ |
| Implement cache layer | 2h | Backend | ⏳ |
| Integrate with weather/geo endpoints | 1h | Backend | ⏳ |

**Deliverable**: Weather API cache working, 95% fewer external API calls

---

#### Day 3-4: UI Bug Fixes (Critical)
| Bug | Time | Owner | Severity |
|-----|------|-------|----------|
| Language dropdown overlap | 30min | Frontend | 🔴 High |
| Camera missing capture button | 1h | Frontend | 🔴 High |
| Assistant popup no close | 30min | Frontend | 🟡 Medium |
| Crop selector scrollable | 45min | Frontend | 🟡 Medium |
| Community overlaps | 1h | Frontend | 🟡 Medium |

**Deliverable**: All 6 UI issues resolved, cleaner UX

---

#### Day 5: Push Notifications Foundation
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Set up Firebase Cloud Messaging (FCM) | 1.5h | DevOps | ⏳ |
| Create notification service | 2h | Backend | ⏳ |
| Wire up to pest alerts | 1.5h | Backend | ⏳ |

**Deliverable**: Pest alert notifications working

---

### **WEEK 2: Features (Monday - Friday)**

#### Day 1-2: Soil Classification
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Load existing soil_classifier.pth | 1h | Backend | ⏳ |
| Create soil prediction endpoint | 2h | Backend | ⏳ |
| Frontend UI for soil analysis | 1h | Frontend | ⏳ |

**Deliverable**: New `/soil/analyze` endpoint working

---

#### Day 2-3: Confidence Calibration
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Modify AI model output | 1h | Backend | ⏳ |
| Implement uncertainty scoring | 1h | Backend | ⏳ |
| Update scan endpoint response | 1h | Backend | ⏳ |

**Deliverable**: Reliability levels in disease predictions

---

#### Day 4-5: Expert Network MVP
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Create expert profile DB schema | 1h | Backend | ⏳ |
| Build expert search endpoint | 2h | Backend | ⏳ |
| Frontend expert directory UI | 2h | Frontend | ⏳ |

**Deliverable**: Expert search & booking working

---

### **WEEK 3-4: Monetization (Days 1-10)**

#### Day 1-3: Dosage Calculator (TOP PRIORITY)
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Backend calculation engine | 3h | Backend | ⏳ |
| Marketplace product matching | 2h | Backend | ⏳ |
| Frontend calculator UI | 2h | Frontend | ⏳ |
| One-click buy integration | 1h | Frontend | ⏳ |

**Deliverable**: Farmers can calculate → view products → buy in 3 clicks  
**Expected Revenue**: ₹500-2,000 per transaction

---

#### Day 4-5: Pricing Intelligence
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Integrate agro-dealer APIs | 2h | Backend | ⏳ |
| Price comparison engine | 1.5h | Backend | ⏳ |
| Frontend price display | 1h | Frontend | ⏳ |

**Deliverable**: Farmers see best prices (local vs online)

---

#### Day 6-7: B2B Cooperative Ordering
| Task | Time | Owner | Status |
|------|------|-------|--------|
| B2B order DB schema | 1h | Backend | ⏳ |
| Bulk discount logic | 1h | Backend | ⏳ |
| Cooperative portal UI | 2h | Frontend | ⏳ |

**Deliverable**: Cooperatives can bulk-order at 15-25% discount

---

#### Day 8-10: Gamification + Dark Mode
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Badge system (database + logic) | 2h | Backend | ⏳ |
| Leaderboard endpoint | 1h | Backend | ⏳ |
| Dark mode theme system | 2h | Frontend | ⏳ |
| Badge UI components | 1h | Frontend | ⏳ |

**Deliverable**: Farmers can earn badges, dark mode available

---

### **WEEK 5-6: Launch Preparation**

#### Day 1-3: Performance Optimization
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Image compression + CDN setup | 2h | DevOps | ⏳ |
| API rate limiting | 1h | Backend | ⏳ |
| Frontend bundle optimization | 1.5h | Frontend | ⏳ |

**Deliverable**: App loads in < 2 seconds

---

#### Day 4-5: Testing & Docs
| Task | Time | Owner | Status |
|------|------|-------|--------|
| End-to-end testing (new features) | 2h | QA | ⏳ |
| API documentation (OpenAPI) | 1.5h | Backend | ⏳ |
| User guide (dosage calculator, etc.) | 1h | Product | ⏳ |

**Deliverable**: All features tested, documented

---

#### Day 6-7: Launch & Marketing
| Task | Time | Owner | Status |
|------|------|-------|--------|
| Deploy to production | 1h | DevOps | ⏳ |
| Launch announcement (email + in-app) | 1h | Marketing | ⏳ |
| Community posts showcase | 1h | Marketing | ⏳ |

**Deliverable**: Features live, farmers notified

---

## Team Structure & Assignments

### Option 1: Small Team (3 people)
```
┌─────────────────────────────────────┐
│  Backend Dev (1 FTE)               │
│  - All backend features             │
│  - Database optimization            │
│  - API development                  │
├─────────────────────────────────────┤
│  Frontend Dev (1 FTE)              │
│  - UI bug fixes                     │
│  - New pages/components             │
│  - Dark mode + responsive design    │
├─────────────────────────────────────┤
│  DevOps/Full-Stack (0.5 FTE)       │
│  - Redis + CDN setup                │
│  - Deployment & monitoring          │
│  - Database optimization            │
└─────────────────────────────────────┘

Timeline: 8-10 weeks
```

### Option 2: Larger Team (5 people)
```
┌─────────────────────────────────────┐
│  Backend Lead (1 FTE)              │
│  Backend Dev (1 FTE)               │
├─────────────────────────────────────┤
│  Frontend Lead (1 FTE)             │
│  Frontend Dev (0.5 FTE)            │
├─────────────────────────────────────┤
│  DevOps (0.5 FTE)                  │
└─────────────────────────────────────┘

Timeline: 5-6 weeks (parallel work)
```

---

## Gantt Chart (Visual)

```
                W1  W2  W3  W4  W5  W6  W7  W8
Database      [███░░░░░░░░░░░░░░░░░░░░░░░░░░]
Redis         [░███░░░░░░░░░░░░░░░░░░░░░░░░░]
UI Fixes      [░███░░░░░░░░░░░░░░░░░░░░░░░░░]
Notifications [░░███░░░░░░░░░░░░░░░░░░░░░░░]
Soil Model    [░░░███░░░░░░░░░░░░░░░░░░░░░░]
Confidence    [░░░███░░░░░░░░░░░░░░░░░░░░░░]
Experts       [░░░░███░░░░░░░░░░░░░░░░░░░░]
Dosage Calc   [░░░░░░███░░░░░░░░░░░░░░░░░░]
Pricing Intel [░░░░░░░███░░░░░░░░░░░░░░░░░]
B2B Orders    [░░░░░░░░███░░░░░░░░░░░░░░░░]
Gamification  [░░░░░░░░░███░░░░░░░░░░░░░░░]
Performance   [░░░░░░░░░░░███░░░░░░░░░░░░░]
Testing       [░░░░░░░░░░░░███░░░░░░░░░░░░]
Launch        [░░░░░░░░░░░░░███░░░░░░░░░░░]
Marketing     [░░░░░░░░░░░░░░███░░░░░░░░░]

Legend: [███] = In Progress  [░░░] = Not Started
```

---

## Success Metrics & Milestones

### Week 1 Metrics
| Metric | Target | Current | Lift |
|--------|--------|---------|------|
| App Load Time (p95) | 500-800ms | 3-5s | **80% faster** |
| Weather API latency | < 50ms | 2-5s | **50x faster** |
| Database query time | < 100ms | 500-1000ms | **10x faster** |

---

### Week 2 Metrics
| Metric | Target | Expected |
|--------|--------|----------|
| Soil analyzer API ready | ✅ | ✅ |
| Expert search working | ✅ | ✅ |
| Push notifications sent | 1000+ | 5000+ |

---

### Week 4 Metrics (Launch)
| Metric | Target | Expected |
|--------|--------|----------|
| Dosage calculator transactions | 100 | 50-100 |
| Revenue (first week) | ₹50K-100K | ₹50-150K |
| User engagement (MAU) | +40% | +60% |
| Expert calls booked | 50 | 75-100 |

---

### Final Metrics (Week 8)
| Metric | Baseline | Target | Achieved |
|--------|----------|--------|----------|
| **DAU** | 5K | 8K | ⏳ |
| **Session Duration** | 3-4 min | 8-10 min | ⏳ |
| **Repeat Usage Rate** | 30% | 55% | ⏳ |
| **Monthly Revenue** | ₹0 | ₹5-10L | ⏳ |
| **App Load Time** | 3-5s | 500-800ms | ⏳ |
| **Expert Network Size** | 0 | 500+ | ⏳ |

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Redis setup delays | Medium | Low | Pre-install Docker image |
| UI bugs take longer | Medium | Low | Prioritize, hire contractor if needed |
| Soil model integration issues | Low | Medium | Have backup model ready |
| Marketplace API rate limits | Low | Medium | Implement client-side caching |
| Payment integration issues | Medium | High | Test with Razorpay sandbox first |
| Expert network sparse | High | Medium | Pre-recruit 100 experts before launch |

---

## Budget Estimate

| Category | Est. Cost | Duration |
|----------|-----------|----------|
| **Infrastructure** | | |
| Redis (AWS ElastiCache) | $100/month | Ongoing |
| CDN (Cloudflare or AWS) | $50/month | Ongoing |
| MongoDB Pro | $200/month | Ongoing |
| **Development** | | |
| Backend Dev (₹60K/week × 6) | ₹3,60,000 | 6 weeks |
| Frontend Dev (₹50K/week × 6) | ₹3,00,000 | 6 weeks |
| DevOps/QA (₹40K/week × 4) | ₹1,60,000 | 4 weeks |
| **Total** | **₹8,20,000** | **8 weeks** |
| **Potential Revenue (Week 8)** | **₹5-10 Lakhs/month** | **Ongoing** |

**ROI**: ~10x within 3 months

---

## Files to Create/Modify

### New Files to Create
```
backend/
  ├── app/core/cache.py                     (Redis caching)
  ├── app/services/soil_model.py            (Soil classification)
  ├── app/services/confidence_calibration.py
  ├── app/services/price_engine.py          (Price comparison)
  ├── app/api/routes/dosage.py              (Dosage calculator)
  ├── app/api/routes/expert_network.py      (Expert marketplace)
  └── app/api/routes/gamification.py        (Badges & leaderboard)

web/
  ├── src/app/calculator/page.tsx           (Dosage calculator UI)
  ├── src/app/experts/page.tsx              (Expert directory)
  ├── src/app/leaderboard/page.tsx          (Gamification)
  ├── src/context/ThemeContext.tsx          (Dark mode)
  └── src/components/DosageCalculator.tsx
```

### Files to Modify
```
backend/
  ├── app/main.py                           (Add startup events)
  ├── app/core/database.py                  (Add indexes)
  ├── app/ai_model.py                       (Confidence calibration)
  └── requirements.txt                      (Add redis, boto3, pillow)

web/
  ├── src/app/scanner/page.tsx              (Fix camera button)
  ├── src/app/community/page.tsx            (Fix overlaps)
  ├── src/components/OnboardingFlow.tsx     (Fix dropdowns + crop selector)
  ├── tailwind.config.ts                    (Dark mode support)
  └── package.json                          (Optional: new deps)
```

---

## Dependency Graph

```
┌─────────────────────────────────────┐
│  Database Indexes (Week 1)          │ ← Foundation (no dependencies)
├─────────────────────────────────────┤
│  Redis Caching (Week 1-2)           │ ← Depends on infrastructure
├─────────────────────────────────────┤
│  UI Fixes (Week 1)                  │ ← Independent
├─────────────────────────────────────┤
│  Soil Model (Week 2)                │ ← Can run in parallel
├─────────────────────────────────────┤
│  Dosage Calculator (Week 3-4)       │ ← Needs marketplace DB
│  ├─ Backend calculation             │   
│  ├─ Product matching                │ ← Depends on marketplace API
│  └─ Frontend UI                     │
├─────────────────────────────────────┤
│  Pricing Intelligence (Week 4)      │ ← Depends on dosage calc
├─────────────────────────────────────┤
│  B2B Ordering (Week 4)              │ ← Independent
├─────────────────────────────────────┤
│  Expert Network (Week 2-3)          │ ← Independent
├─────────────────────────────────────┤
│  Gamification (Week 4)              │ ← Depends on user actions
├─────────────────────────────────────┤
│  Performance Optimization (Week 5)  │ ← Final polish
├─────────────────────────────────────┤
│  Launch (Week 6-8)                  │ ← All features ready
└─────────────────────────────────────┘
```

---

## Decision Tree: What to Start With?

```
START
  │
  ├─ Do you have database issues?
  │  YES → Start with Database Indexing (Week 1)
  │  NO  → Continue
  │
  ├─ Need to improve revenue?
  │  YES → Start with Dosage Calculator (Week 3-4)
  │  NO  → Continue
  │
  ├─ Have UI/UX complaints?
  │  YES → Start with UI Fixes (Week 1)
  │  NO  → Continue
  │
  └─ Want to scale to 100K users?
     YES → Start with Redis + CDN (Week 1-2)
     NO  → Proceed incrementally
```

---

## Success Story Timeline

### Week 1
✅ "App is 10x faster!"  
✅ "Camera button works now"  
✅ "No more notifications delays"

### Week 4
✅ "Farmers love the dosage calculator!"  
✅ "First ₹50K revenue!"  
✅ "100 new experts joined"

### Week 8
✅ "MAU up 60% to 8,000 farmers"  
✅ "Monthly recurring revenue ₹5-10 Lakhs"  
✅ "B2B cooperatives ordering bulk"

---

## Key Success Factors

1. **Start Small**: Database indexing + UI fixes first (quick wins build momentum)
2. **Focus on Revenue**: Dosage calculator is your #1 monetization lever
3. **Parallel Work**: DevOps infrastructure (Redis/CDN) while dev team works on features
4. **Testing**: Test each feature end-to-end before moving to next week
5. **Feedback Loop**: Launch to 1% of users, gather feedback, iterate

---

## Questions to Ask Your Team

1. Can we deploy to production weekly?
2. Do we have DevOps capacity for Redis/CDN setup?
3. Can we pre-recruit 100 experts before Week 2?
4. Do we have performance monitoring (Sentry, DataDog)?
5. How will we handle database migrations safely?

---

**Remember**: The goal is not perfection, it's **iteration and revenue** 🎯

Start with Week 1 tasks NOW. You can complete them in parallel and have a foundation-ready app by Friday.

Good luck! 🚀
