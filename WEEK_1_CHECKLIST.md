# 📋 WEEK 1 DAILY CHECKLIST (April 18-22, 2026)

**Goal**: Complete foundation, launch into Week 2 strong  
**Team Status**: Backend ✅, DevOps ✅, Frontend 🔄  

---

## 🎯 THIS WEEK'S TARGETS

| Task | Owner | Status | Hours | Target |
|------|-------|--------|-------|--------|
| UI Bug Fixes (6 bugs) | Frontend | 🔄 IN PROGRESS | 4.5h | Friday EOD |
| Database Indexes | Backend | ✅ DONE | 1h | ✅ |
| Redis Caching | Backend | ✅ DONE | 4h | ✅ |
| App Load Time | All | ⏳ TESTING | - | < 1s |
| Internal Demo | All | ⏳ PENDING | 0.5h | Friday 4pm |

---

## 📅 DAILY BREAKDOWN

### **TODAY (Thursday, April 18) 🚀**

#### Morning (9 AM - 12 PM)
- [ ] **Frontend Dev**: Start with Bug #1 - Language Dropdown Overlap (30 min)
  - File: `web/src/components/OnboardingFlow.tsx`
  - Use Radix UI Popover with collision detection
  - Test in browser at 320px width (mobile)
  
- [ ] **Backend Dev**: Verify database indexes with MongoDB
  ```bash
  mongosh
  > use plant_doctor
  > db.scans.getIndexes()
  ```
  - Confirm: 3 indexes on scans collection
  - Check performance: should be instant response
  
- [ ] **DevOps**: Verify Redis is running
  ```bash
  redis-cli ping  # Should respond PONG
  ```

#### Afternoon (1 PM - 5 PM)
- [ ] **Frontend Dev**: Bug #2 - Camera Missing Capture Button (1 hour)
  - File: `web/src/app/scanner/page.tsx`
  - Add prominent "📸 Capture Photo" button
  - Add "Stop Camera" button
  - Test with actual device camera
  
- [ ] **Frontend Dev**: Bug #3 - Assistant Popup No Close (30 min)
  - File: `web/src/components/VoiceAIFAB.tsx`
  - Add X icon to close popup
  - Add 5-second auto-dismiss
  - Test interaction
  
- [ ] **Backend Dev**: Monitor production dashboard
  - Check error rates (target: < 0.1%)
  - Check API latency (target: < 200ms)
  - Check database connections

#### End of Day (4 PM - 5 PM)
- [ ] **All**: Daily standup (15 min)
  - What's done? ✅
  - What's blockers? 🔴
  - What's next? ⏭️

---

### **Friday, April 19**

#### Morning (9 AM - 12 PM)
- [ ] **Frontend Dev**: Bug #4 - Crop Selector Scrollable (45 min)
  - File: `web/src/components/OnboardingFlow.tsx`
  - Make crop grid scrollable or searchable dropdown
  - Support all 16 crops (not just 6)
  - Mobile-first responsive
  
- [ ] **Frontend Dev**: Bug #5 - Community Posts Overlapping (1 hour)
  - File: `web/src/app/community/page.tsx`
  - Fix CSS grid gaps
  - Ensure responsive breakpoints
  - Test on mobile/tablet/desktop

#### Afternoon (1 PM - 5 PM)
- [ ] **Frontend Dev**: Bug #6 - Language Selector Position (1 hour)
  - Move from top-right to splash screen (Step 0)
  - Test onboarding flow completely
  - Ensure language persists

- [ ] **Frontend Dev**: Final QA
  - Test all 6 fixes on device
  - Check for any regressions
  - Screenshot results
  
- [ ] **All**: Internal Demo (4 PM - 4:30 PM)
  - Show fixed UI bugs
  - Demo database performance
  - Celebrate Week 1! 🎉

#### End of Week (4:30 PM - 5 PM)
- [ ] Deploy to staging
  - Backend: No changes (just monitoring)
  - Frontend: All UI fixes deployed
  - Test live at staging URL
  
- [ ] Weekly retrospective (10 min)
  - What went well? ✅
  - What was hard? 🚧
  - How to improve next week? 💡

---

## 🔍 QUICK REFERENCE: UI Bugs Detail

### Bug #1: Language Dropdown Overlaps (30 min)
**File**: `web/src/components/OnboardingFlow.tsx:250`  
**Issue**: Select dropdown goes off-screen, covers button  
**Fix**: Use Radix `<Popover>` with `side="bottom"` and collision detection
```tsx
// Before
<select value={lang} onChange={...}>
  {languages.map(...)}
</select>

// After
<Popover>
  <PopoverTrigger>{lang}</PopoverTrigger>
  <PopoverContent side="bottom" align="start" sideOffset={4}>
    {/* Language options */}
  </PopoverContent>
</Popover>
```

### Bug #2: Camera Missing Capture (1 hour)
**File**: `web/src/app/scanner/page.tsx:150`  
**Issue**: Video stream plays but no button to take photo  
**Fix**: Add capture state + button
```tsx
const [capturing, setCapturing] = useState(false);
const videoRef = useRef(null);

const handleCapture = async () => {
  setCapturing(true);
  const canvas = document.createElement('canvas');
  // ... capture logic
};

return (
  <>
    <video ref={videoRef} />
    <button onClick={handleCapture}>📸 Capture Photo</button>
    <button onClick={() => setStream(null)}>Stop Camera</button>
  </>
);
```

### Bug #3: Assistant Popup No Close (30 min)
**File**: `web/src/components/VoiceAIFAB.tsx:180`  
**Issue**: Response bubble stays on screen forever  
**Fix**: Add close button + auto-dismiss
```tsx
useEffect(() => {
  const timer = setTimeout(() => setVisible(false), 5000);
  return () => clearTimeout(timer);
}, []);

return (
  <div className="fixed bottom-4 right-4">
    <button onClick={() => setVisible(false)}>✕</button>
    {response}
  </div>
);
```

### Bug #4: Crop Selector (45 min)
**File**: `web/src/components/OnboardingFlow.tsx:300`  
**Issue**: Grid shows only 6/16 crops due to overflow:hidden  
**Fix**: Make scrollable or searchable
```tsx
const [search, setSearch] = useState("");
const filtered = CROPS.filter(c => c.toLowerCase().includes(search));

return (
  <div className="max-h-64 overflow-y-auto">
    <input 
      placeholder="Search crop..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
    <div className="grid grid-cols-3 gap-2">
      {filtered.map(crop => (...))}
    </div>
  </div>
);
```

### Bug #5: Community Overlaps (1 hour)
**File**: `web/src/app/community/page.tsx`  
**Issue**: Post cards overlapping in some viewport widths  
**Fix**: CSS grid + responsive breakpoints
```tsx
// Add proper gap and responsive columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {posts.map(post => (
    <Card key={post.id} className="overflow-hidden">
      {/* Post content */}
    </Card>
  ))}
</div>
```

### Bug #6: Language Selector (1 hour)
**File**: `Onboarding flow`  
**Issue**: Language selector only appears after splash screen  
**Fix**: Move to splash screen (Step 0 of onboarding)
```tsx
// Create a SplashScreen component with language selector
export function SplashScreen() {
  const [lang, setLang] = useState("English");
  
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Logo />
      <Popover>
        <PopoverTrigger>
          {lang} 🌐
        </PopoverTrigger>
        <PopoverContent>
          {LANGUAGES.map(l => (
            <button onClick={() => setLang(l)}>{l}</button>
          ))}
        </PopoverContent>
      </Popover>
      <Button onClick={proceed}>Continue</Button>
    </div>
  );
}
```

---

## ✅ DEFINITION OF DONE (For Week 1)

- [ ] All 6 UI bugs fixed + tested on device
- [ ] Database indexes confirmed working (< 50ms queries)
- [ ] Redis cache confirmed working (weather < 50ms)
- [ ] Zero errors in production logs
- [ ] Internal demo successful
- [ ] Team ready for Week 2 sprint
- [ ] Staging deployment successful

---

## 📊 METRICS TO TRACK

### Database Performance
```bash
# Run in mongosh
db.scans.aggregate([{$indexStats: {}}])
# Look for: query_count increasing, query_time < 50ms
```

### API Latency
```bash
# Check in production logs
# Target: /weather endpoint < 50ms (cached)
# Target: All endpoints avg < 200ms
```

### App Load Time
```bash
# Chrome DevTools Lighthouse
# Target: First Contentful Paint < 1s
# Target: Largest Contentful Paint < 2s
```

---

## 🎁 By End of Week

**Frontend Dev Delivered:**
✅ 6 UI bugs fixed  
✅ Responsive on 320px-4K  
✅ Staging deployment live  
✅ Ready for Week 2 (soil UI)

**Backend Dev Delivered:**
✅ Production indexes  
✅ Redis caching  
✅ Both tested + validated  
✅ Ready for Week 2 (soil model)

**DevOps Delivered:**
✅ Infrastructure stable  
✅ Monitoring configured  
✅ Backup strategy ready  
✅ Ready for Week 2 (scale)

---

## 🚀 Week 2 Prep

**By End of Friday**, start preparing for Week 2:
- [ ] Backend: Review soil_classifier.pth model
- [ ] Frontend: Design soil analysis UI mockup
- [ ] DevOps: Plan Redis Docker config for Week 2 integration

---

**LET'S GO! 💪**

*Questions? Blockers? Ask now — don't let them slow you down this week!*
