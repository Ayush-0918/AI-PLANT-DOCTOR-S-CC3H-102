import AppLogo from '@/components/AppLogo';

type SplineHeroProps = {
  sceneUrl?: string;
};

export default function SplineHero({ sceneUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL }: SplineHeroProps) {
  if (sceneUrl) {
    return (
      <div className="light-glass-card relative h-[420px] overflow-hidden rounded-[2rem] p-3 shadow-[0_30px_80px_rgba(148,163,184,0.22)]">
        <iframe
          src={sceneUrl}
          title="Plant Doctor 3D hero"
          className="h-full w-full rounded-[1.5rem] border-0"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="light-glass-card relative h-[420px] overflow-hidden rounded-[2rem] p-6 shadow-[0_30px_80px_rgba(148,163,184,0.22)]">
      <div className="floating-orb floating-orb-a" />
      <div className="floating-orb floating-orb-b" />
      <div className="floating-orb floating-orb-c" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 shadow-[0_10px_30px_rgba(148,163,184,0.12)] ring-1 ring-white/70 backdrop-blur-xl">
            <AppLogo size={34} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Judge Demo</p>
              <p className="text-sm font-bold text-slate-900">Premium AI Agriculture</p>
            </div>
          </div>

          <div className="float-slow rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(219,234,254,0.92))] px-4 py-3 shadow-[0_24px_50px_rgba(148,163,184,0.18)] ring-1 ring-white/70">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Realtime</p>
            <p className="mt-1 text-lg font-black text-slate-900">Scan + Diagnose + Call</p>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[360px] items-center justify-center">
          <div className="absolute inset-x-8 bottom-8 h-12 rounded-full bg-sky-200/60 blur-2xl" />

          <div className="float-slow relative z-20 w-[190px] rounded-[2.2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,245,249,0.86))] p-3 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-16 rounded-full bg-slate-900" />
              <div className="text-[10px] font-bold text-slate-400">9:41</div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.4rem] bg-[linear-gradient(135deg,#e0f2fe,#fef3c7)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Field Risk</p>
                <p className="mt-1 text-xl font-black text-slate-900">84.9%</p>
              </div>
              <div className="rounded-[1.3rem] bg-white/80 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Leaf Scan</p>
                <div className="mt-2 h-20 rounded-[1rem] bg-[linear-gradient(135deg,#dbeafe,#fce7f3)]" />
              </div>
              <div className="rounded-[1.3rem] bg-[linear-gradient(135deg,#fdf2f8,#dbeafe)] p-3">
                <p className="text-xs font-black text-slate-900">Doctor call ready</p>
                <p className="mt-1 text-[11px] text-slate-500">One tap live agronomist support</p>
              </div>
            </div>
          </div>

          <div className="story-card absolute -left-1 top-10 z-10 w-[150px] rotate-[-10deg] rounded-[1.6rem] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Weather AI</p>
            <p className="mt-2 text-2xl font-black text-slate-900">28°C</p>
            <p className="text-xs text-slate-500">Humidity stable, spray safe till 4 PM</p>
          </div>

          <div className="story-card absolute -right-2 bottom-8 z-10 w-[160px] rotate-[10deg] rounded-[1.6rem] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trust Layer</p>
            <p className="mt-2 text-lg font-black text-slate-900">Confidence + treatment + PDF</p>
          </div>
        </div>
      </div>
    </div>
  );
}
