"use client";

import Link from 'next/link';
// Generic branding — no company-specific logo
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/LanguageContext';
import { useEffect, useRef } from 'react';

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('revealed'); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Feature items bullet ── */
function FeatureItems({ keys }: { keys: string[] }) {
  const { t } = useTranslation();
  return (
    <ul className="feature-items">
      {keys.map(k => (
        <li key={k}>
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {t(k)}
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const r1 = useReveal();
  const r2 = useReveal();
  const r3 = useReveal();
  const r4 = useReveal();

  return (
    <div className="homepage">

      {/* Aurora Background Effects */}
      <div className="aurora-glow"></div>
      <div className="dot-grid"></div>

      {/* Everything sits above the effects */}
      <div className="relative z-10">

        {/* ── Glass Navigation Bar ── */}
        <header className="container mt-5 mb-8">
          <nav className="glass-nav flex items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-3 group no-underline">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-lg transition-transform duration-300 group-hover:scale-110">G</div>
              <span className="text-white text-xl font-bold tracking-tight">GetPlanning</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-6">
              <LanguageSwitcher />
              <Link href="/login" className="glass-button flex items-center justify-center h-10 px-3 sm:px-6 text-white text-xs sm:text-sm font-bold tracking-wide no-underline whitespace-nowrap">
                {t("login")}
              </Link>
            </div>
          </nav>
        </header>

        {/* ═══════════ HERO SECTION ═══════════ */}
        <section className="container hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              {t("hero_title_1")} <br />
              <span className="text-gradient">{t("hero_title_2")}</span>
            </h1>

            <p className="hero-subtitle">
              {t("hero_subtitle")}
            </p>

            <Link href="/login" className="btn-gradient no-underline">
              {t("cta_button")}
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="hero-preview animate-float">
            <div className="dashboard-preview glass-panel p-2">
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="text-slate-500 text-xs ml-3 font-mono">{t("dashboard_label")}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t("stat_active_projects")}</p>
                    <p className="text-white text-3xl font-bold">12</p>
                    <p className="text-green-400 text-xs mt-1">↑ +3</p>
                  </div>
                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t("stat_teams_deployed")}</p>
                    <p className="text-white text-3xl font-bold">47</p>
                    <p className="text-teal-400 text-xs mt-1">↑ 94%</p>
                  </div>
                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t("stat_compliance")}</p>
                    <p className="text-white text-3xl font-bold">98%</p>
                    <p className="text-purple-400 text-xs mt-1">↑ +2.4%</p>
                  </div>
                </div>

                <div className="glass-panel rounded-lg p-4 h-32 flex items-end gap-2">
                  <div className="chart-bar h-[65%]"></div>
                  <div className="chart-bar h-[45%]"></div>
                  <div className="chart-bar h-[80%]"></div>
                  <div className="chart-bar h-[55%]"></div>
                  <div className="chart-bar h-[90%]"></div>
                  <div className="chart-bar h-[70%]"></div>
                  <div className="chart-bar h-[85%]"></div>
                  <div className="chart-bar h-[60%]"></div>
                  <div className="chart-bar h-[95%]"></div>
                  <div className="chart-bar h-[75%]"></div>
                  <div className="chart-bar h-[88%]"></div>
                  <div className="chart-bar h-[92%]"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURE 1: ANALYTICS ═══════════ */}
        <section ref={r1} className="reveal-section feature-section">
          <div className="container feature-row">
            <div className="feature-text">
              <div className="feature-badge feature-badge-purple">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
              <h2 className="feature-heading">{t("feature_analytics_title")}</h2>
              <p className="feature-subheading">{t("feature_analytics_subtitle")}</p>
              <p className="feature-description">{t("feature_analytics_desc")}</p>
              <FeatureItems keys={[
                "feature_analytics_item_1",
                "feature_analytics_item_2",
                "feature_analytics_item_3",
                "feature_analytics_item_4",
              ]} />
              <Link href="/login" className="feature-cta feature-cta-purple">
                {t("feature_analytics_cta")} <span className="text-lg">→</span>
              </Link>
            </div>

            <div className="feature-visual">
              {/* Mini analytics mockup */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-400">trending_up</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">79.1%</p>
                    <p className="text-slate-400 text-xs">{t("overall_efficiency")}</p>
                  </div>
                </div>
                <div className="flex gap-2 h-24 items-end">
                  <div className="chart-bar h-[40%]"></div>
                  <div className="chart-bar h-[60%]"></div>
                  <div className="chart-bar h-[75%]"></div>
                  <div className="chart-bar h-[55%]"></div>
                  <div className="chart-bar h-[85%]"></div>
                  <div className="chart-bar h-[90%]"></div>
                  <div className="chart-bar h-[70%]"></div>
                  <div className="chart-bar h-[95%]"></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-green-400 text-xl font-bold">1898h</p>
                    <p className="text-slate-500 text-xs">{t("achieved_labor_value")}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-purple-400 text-xl font-bold">3</p>
                    <p className="text-slate-500 text-xs">{t("active_projects")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURE 2: WORKFORCE ═══════════ */}
        <section ref={r2} className="reveal-section feature-section">
          <div className="container feature-row feature-row-reverse">
            <div className="feature-text">
              <div className="feature-badge feature-badge-teal">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h2 className="feature-heading">{t("feature_workforce_title")}</h2>
              <p className="feature-subheading">{t("feature_workforce_subtitle")}</p>
              <p className="feature-description">{t("feature_workforce_desc")}</p>
              <FeatureItems keys={[
                "feature_workforce_item_1",
                "feature_workforce_item_2",
                "feature_workforce_item_3",
                "feature_workforce_item_4",
              ]} />
              <Link href="/login" className="feature-cta feature-cta-teal">
                {t("feature_workforce_cta")} <span className="text-lg">→</span>
              </Link>
            </div>

            <div className="feature-visual">
              {/* Team management mockup */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-teal-400">calendar_month</span>
                    </div>
                    <p className="text-white font-bold">{t("plan_next_week_title")}</p>
                  </div>
                </div>
                {/* Worker slots */}
                <div className="flex flex-col gap-3">
                  {[
                  { week: "S+1", pct: "85", w: "w-[85%]" },
                  { week: "S+2", pct: "60", w: "w-[60%]" },
                  { week: "S+3", pct: "30", w: "w-[30%]" },
                ].map(({ week, pct, w }) => (
                    <div key={week} className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
                      <span className="text-teal-400 font-bold text-sm w-10">{week}</span>
                      <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all ${w}`}></div>
                      </div>
                      <span className="text-slate-400 text-xs font-mono">{pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-teal-400 text-lg font-bold">12</p>
                    <p className="text-slate-500 text-[10px] uppercase">{t("persons")}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-cyan-400 text-lg font-bold">47</p>
                    <p className="text-slate-500 text-[10px] uppercase">{t("scheduled_tasks")}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 text-center">
                    <p className="text-green-400 text-lg font-bold">94%</p>
                    <p className="text-slate-500 text-[10px] uppercase">{t("ready")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURE 3: COMPLIANCE ═══════════ */}
        <section ref={r3} className="reveal-section feature-section">
          <div className="container feature-row">
            <div className="feature-text">
              <div className="feature-badge feature-badge-mixed">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <h2 className="feature-heading">{t("feature_compliance_title")}</h2>
              <p className="feature-subheading">{t("feature_compliance_subtitle")}</p>
              <p className="feature-description">{t("feature_compliance_desc")}</p>
              <FeatureItems keys={[
                "feature_compliance_item_1",
                "feature_compliance_item_2",
                "feature_compliance_item_3",
                "feature_compliance_item_4",
              ]} />
              <Link href="/login" className="feature-cta feature-cta-mixed">
                {t("feature_compliance_cta")} <span className="text-lg">→</span>
              </Link>
            </div>

            <div className="feature-visual">
              {/* Compliance mockup */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-400">verified</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">{t("validation_checklist")}</p>
                    <p className="text-slate-400 text-xs">98% {t("stat_compliance").toLowerCase()}</p>
                  </div>
                </div>
                {/* Checklist items */}
                <div className="flex flex-col gap-2">
                  {[
                    { label: "materials_ok", done: true },
                    { label: "tools_ok", done: true },
                    { label: "subcontractors", done: true },
                    { label: "visual_proof", done: false },
                  ].map(item => (
                    <div key={item.label}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                        item.done ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${item.done ? 'text-green-400' : 'text-slate-500'}`}>
                        {item.done ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className={`text-sm font-medium ${item.done ? 'text-green-300' : 'text-slate-400'}`}>
                        {t(item.label)}
                      </span>
                      {item.done && (
                        <span className="ml-auto text-green-400 text-[10px] uppercase font-bold tracking-wider">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <p className="text-green-400 text-2xl font-bold">98%</p>
                  <p className="text-green-300/60 text-xs">{t("stat_compliance")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CTA FOOTER ═══════════ */}
        <section ref={r4} className="reveal-section footer-cta-section">
          <div className="container text-center">
            <h2 className="footer-cta-title">{t("footer_cta_title")}</h2>
            <p className="footer-cta-desc">{t("footer_cta_desc")}</p>
            <Link href="/login" className="btn-gradient no-underline text-lg px-10 py-4">
              {t("cta_button")}
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
