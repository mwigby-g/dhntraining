import { useState, useEffect, useCallback } from "react";

// ============================================================
// Design tokens — non-negotiable, from dhn-style/design-tokens.md
// ============================================================
const NAVY       = "#1a2744";
const TEAL       = "#2a9d8f";
const TEAL_DARK  = "#228176";
const TEAL_LIGHT = "#e6f5f3";
const WARM       = "#f8f6f1";
const WARM_DIM   = "#edeae3";
const WHITE      = "#ffffff";
const CAUTION       = "#e76f51";
const CAUTION_LIGHT = "#fdeee9";
const GOLD       = "#d4a843";
const GOLD_LIGHT = "#fdf6e3";
const GOLD_DARK  = "#9a7a2e";
const TEXT       = "#1e1e1e";
const TEXT_MID   = "#4a4a4a";
const TEXT_LIGHT = "#717171";

const STORAGE_KEY = "dnr-training-v1";

// ============================================================
// Persistence (see dhn-style/persistence.md)
// ============================================================
function loadState() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch { return {}; }
}
function saveState(state) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
function serialize(v) {
  if (v instanceof Set) return { __set: [...v] };
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) out[k] = serialize(v[k]);
    return out;
  }
  return v;
}
function rehydrate(stored, template) {
  if (stored && typeof stored === "object" && Array.isArray(stored.__set)) {
    return new Set(stored.__set);
  }
  if (template instanceof Set) return template;
  if (Array.isArray(stored)) return stored.map((s, i) => rehydrate(s, template?.[i]));
  if (stored && typeof stored === "object") {
    const out = {};
    for (const k of Object.keys(stored)) out[k] = rehydrate(stored[k], template?.[k]);
    return out;
  }
  return stored;
}
function usePersistentActivity(activityKey, initialValue) {
  const [value, setValue] = useState(() => {
    const all = loadState();
    if (all[activityKey] !== undefined) return rehydrate(all[activityKey], initialValue);
    return initialValue;
  });
  useEffect(() => {
    const all = loadState();
    all[activityKey] = serialize(value);
    saveState(all);
  }, [activityKey, value]);
  return [value, setValue];
}
function markActivityDone(moduleId, activityId) {
  const all = loadState();
  if (!all.__completed) all.__completed = {};
  if (!all.__completed[moduleId]) all.__completed[moduleId] = [];
  if (!all.__completed[moduleId].includes(activityId)) {
    all.__completed[moduleId].push(activityId);
    saveState(all);
  }
}
function getCompletedActivities(moduleId) {
  const all = loadState();
  return new Set((all.__completed && all.__completed[moduleId]) || []);
}
function clearAllProgress() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}
function hasAnyActivityProgress() {
  const all = loadState();
  if (!all || typeof all !== "object") return false;
  const keys = Object.keys(all).filter(k => !k.startsWith("__"));
  return keys.length > 0;
}

// ============================================================
// Module data
// ============================================================
const modules = [
  {
    id: "engagement-trajectory",
    label: "1. Engagement & Symptom Trajectories",
    short: "Engagement",
    sdt: "Guide",
    sdtBlurb: "Phase 1 (Guide) of the DN workflow per Lim et al. (2026). Activities cover the engagement gauges, weekly PHQ-9 and GAD-7 trajectories, and the daily-EMA line graph. SME-supplied conversation framing pending.",
    activities: ["gauge-read", "trajectory-mismatch"],
  },
  {
    id: "sleep-passive-active",
    label: "2. Sleep & Passive-Active Integration",
    short: "Sleep + Behavior",
    sdt: "Refinement",
    sdtBlurb: "Phase 2 (Refinement) of the DN workflow per Lim et al. (2026). Activities cover the sleep visualization and the dual-axis passive-active graph. SME-supplied conversation framing pending.",
    activities: ["sleep-read", "passive-active-story"],
  },
  {
    id: "correlation-matrix",
    label: "3. The Correlation Matrix",
    short: "Matrix",
    sdt: "Refinement",
    sdtBlurb: "Phase 2 (Refinement) of the DN workflow per Lim et al. (2026). Activities cover reading the Spearman correlation matrix and translating a single cell into plain-English observation. Cell verdicts and translation models pending SME.",
    activities: ["matrix-read", "matrix-translate"],
  },
  {
    id: "polar-multidimensional",
    label: "4. Polar Charts & Closing the Program",
    short: "Polar",
    sdt: "Autonomy",
    sdtBlurb: "Phase 3 (Autonomy) of the DN workflow per Lim et al. (2026). Activities cover the intake/interim/completion radar charts and the closing chart note. Per-pattern guidance and model closing content pending SME.",
    activities: ["polar-read", "completion-summary"],
  },
];

// ============================================================
// Primitives
// ============================================================
function Card({ children, style }) {
  return (
    <div style={{ background: WHITE, borderRadius: 14, boxShadow: "0 2px 12px rgba(26,39,68,.07)", padding: 24, marginBottom: 20, ...style }}>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Eyebrow({ children, color = TEXT_LIGHT }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Prose({ children }) {
  return <div style={{ fontSize: 13, color: TEXT_MID, lineHeight: 1.7, marginBottom: 12 }}>{children}</div>;
}

function Quote({ text, attr }) {
  return (
    <div style={{
      borderLeft: `3px solid ${GOLD}`, background: GOLD_LIGHT,
      padding: "14px 18px", borderRadius: "0 10px 10px 0", margin: "16px 0",
      fontSize: 13, color: TEXT, lineHeight: 1.6, fontStyle: "italic",
    }}>
      {text}
      <div style={{ fontSize: 11, color: GOLD_DARK, marginTop: 6, fontStyle: "normal", fontWeight: 600 }}>
        {attr}
      </div>
    </div>
  );
}

function ConceptTiles({ tiles, color = TEAL }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
      {tiles.map((tile, i) => (
        <div key={i} style={{ background: WARM, borderRadius: 10, padding: 14, borderLeft: `3px solid ${color}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{tile.h}</div>
          <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.5 }}>{tile.p}</div>
        </div>
      ))}
    </div>
  );
}

function InfoBubble({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 16, marginBottom: 12, border: `1.5px solid ${open ? TEAL : WARM_DIM}`, borderRadius: 10, overflow: "hidden", transition: "border-color .15s" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", textAlign: "left", padding: "12px 16px",
          border: "none", background: open ? TEAL_LIGHT : WHITE,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
          transition: "background .15s", fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: open ? TEAL : WARM_DIM,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background .15s",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: open ? WHITE : TEXT_LIGHT, lineHeight: 1 }}>i</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: open ? TEAL_DARK : TEXT, flex: 1 }}>{title}</div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? TEAL_DARK : TEXT_LIGHT} strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${TEAL}`, background: WHITE, fontSize: 13, color: TEXT_MID, lineHeight: 1.6 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ActivityWrap({ children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        background: NAVY, color: WHITE, borderRadius: "12px 12px 0 0",
        padding: "12px 20px", fontSize: 11, fontWeight: 700,
        letterSpacing: ".06em", textTransform: "uppercase",
      }}>
        Interactive activity
      </div>
      <div style={{
        background: WHITE, borderRadius: "0 0 12px 12px",
        border: `1px solid ${WARM_DIM}`, borderTop: "none", padding: 20,
      }}>
        {children}
      </div>
    </div>
  );
}

function ActivityHead({ title, instructions }) {
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: TEXT_MID, marginBottom: 20, lineHeight: 1.6 }}>{instructions}</div>
    </>
  );
}

function TagButton({ label, selected, onClick, color, disabled }) {
  const bg = selected ? (color === "teal" ? TEAL_LIGHT : color === "caution" ? CAUTION_LIGHT : color === "gold" ? GOLD_LIGHT : WARM_DIM) : WHITE;
  const border = selected ? (color === "teal" ? TEAL : color === "caution" ? CAUTION : color === "gold" ? GOLD : TEXT_LIGHT) : WARM_DIM;
  const textColor = selected ? (color === "teal" ? TEAL_DARK : color === "caution" ? CAUTION : color === "gold" ? GOLD_DARK : TEXT) : TEXT_LIGHT;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 14px", borderRadius: 20, border: `2px solid ${border}`,
        background: bg, color: textColor, fontSize: 12, fontWeight: 600,
        cursor: disabled ? "default" : "pointer", transition: "all .15s",
        margin: 3, fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function TextArea({ value, onChange, placeholder, disabled, minHeight = 60 }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => !disabled && onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 12px",
        border: `1.5px solid ${WARM_DIM}`, borderRadius: 8,
        fontSize: 13, fontFamily: "inherit", resize: "vertical",
        minHeight, lineHeight: 1.5, boxSizing: "border-box",
        background: disabled ? WARM : WHITE, color: TEXT,
      }}
    />
  );
}

function SubmitBtn({ onClick, disabled, label = "Submit", submittedLabel = "Submitted" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 26px", borderRadius: 12, border: "none",
        background: disabled ? WARM_DIM : TEAL,
        color: disabled ? TEXT_LIGHT : WHITE,
        fontSize: 14, fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {disabled ? submittedLabel : label}
    </button>
  );
}

function SuggestedReveal({ show, title = "Suggested approach", children }) {
  if (!show) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ background: TEAL_LIGHT, border: `1px solid ${TEAL}`, borderRadius: 12, padding: 20, animation: "fadeIn .3s ease" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEAL_DARK, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

// SDT-move callout (used inside reveals)
function PhaseMove({ phase, children }) {
  return (
    <div style={{
      background: GOLD_LIGHT, padding: 12, borderRadius: 8,
      fontSize: 12, color: TEXT_MID, lineHeight: 1.6, marginTop: 14,
    }}>
      <strong style={{ color: GOLD_DARK }}>The {phase} move:</strong> {children}
    </div>
  );
}

// Placeholder block for content that needs subject-matter-expert review before deployment.
// Used wherever the prior content asserted claims not directly supported by the paper or codebook.
function Placeholder({ note }) {
  return (
    <div style={{
      background: "#fff8e7",
      border: "1px dashed #d4a93a",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
      color: "#7a5a14",
      lineHeight: 1.5,
      margin: "10px 0",
      fontStyle: "italic",
    }}>
      <strong style={{ fontStyle: "normal" }}>[Placeholder]</strong> {note}
    </div>
  );
}

// ============================================================
// Mock visualization components
// These are stylized but accurate renderings of the actual report visualizations.
// Used inline in concept and activity sections.
// ============================================================

// A gauge — the half-donut with traffic-light bands
function MockGauge({ value, label, caption, bands = "engagement" }) {
  // bands: "engagement" = red→yellow→green→blue; "quality" same idea
  const bandSegs = [
    { color: CAUTION, frac: 0.25 },
    { color: GOLD, frac: 0.25 },
    { color: TEAL, frac: 0.25 },
    { color: "#3a7ca5", frac: 0.25 }, // a desaturated blue band (matches the report)
  ];
  // Note: the "blue" here is a band-segment color in the source visualization,
  // not a UI accent color. It's only used inside the gauge SVG to mirror the report.
  const cx = 60, cy = 60, r = 50;
  const arcPath = (start, end) => {
    const a0 = Math.PI - start * Math.PI;
    const a1 = Math.PI - end * Math.PI;
    const x0 = cx + r * Math.cos(a0), y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy - r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  let acc = 0;
  const segs = bandSegs.map((s) => {
    const start = acc;
    acc += s.frac;
    return { ...s, start, end: acc };
  });
  // needle
  const vClamped = Math.max(0, Math.min(1, value));
  const needleA = Math.PI - vClamped * Math.PI;
  const nx = cx + (r - 5) * Math.cos(needleA);
  const ny = cy - (r - 5) * Math.sin(needleA);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{label}</div>
      <svg width="120" height="78" viewBox="0 0 120 78">
        {segs.map((s, i) => (
          <path key={i} d={arcPath(s.start, s.end)} stroke={s.color} strokeWidth="10" fill="none" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={TEXT} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={TEXT} />
      </svg>
      <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginTop: -4 }}>
        {Math.round(vClamped * 100)}%
      </div>
      {caption && <div style={{ fontSize: 11, color: TEXT_MID, marginTop: 4, lineHeight: 1.4, maxWidth: 160, margin: "4px auto 0" }}>{caption}</div>}
    </div>
  );
}

// Weekly trajectory line graph — PHQ-9 or GAD-7
function MockTrajectory({ scores, max, title, color = NAVY, threshold }) {
  // scores: array of numbers, weekly
  const w = 320, h = 120, pad = 24;
  const xStep = (w - pad * 2) / Math.max(1, scores.length - 1);
  const ys = scores.map(s => h - pad - (s / max) * (h - pad * 2));
  const xs = scores.map((_, i) => pad + i * xStep);

  // Severity bands as horizontal background strips (simplified)
  const sevBands = max === 27
    ? [{ from: 0, to: 4, c: TEAL_LIGHT }, { from: 5, to: 9, c: GOLD_LIGHT }, { from: 10, to: 14, c: "#fdf0e8" }, { from: 15, to: 27, c: CAUTION_LIGHT }]
    : [{ from: 0, to: 4, c: TEAL_LIGHT }, { from: 5, to: 9, c: GOLD_LIGHT }, { from: 10, to: 14, c: "#fdf0e8" }, { from: 15, to: 21, c: CAUTION_LIGHT }];

  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{title}</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        {sevBands.map((b, i) => {
          const y0 = h - pad - (b.to / max) * (h - pad * 2);
          const y1 = h - pad - (b.from / max) * (h - pad * 2);
          return <rect key={i} x={pad} y={y0} width={w - pad * 2} height={y1 - y0} fill={b.c} />;
        })}
        <path d={pathD} stroke={color} strokeWidth="2" fill="none" />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r="3" fill={color} />
            <text x={x} y={ys[i] - 8} textAnchor="middle" fontSize="10" fill={TEXT} fontWeight="600">{scores[i]}</text>
          </g>
        ))}
        {/* x axis labels */}
        {xs.map((x, i) => (
          <text key={`xl-${i}`} x={x} y={h - 6} textAnchor="middle" fontSize="9" fill={TEXT_LIGHT}>
            W{i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Daily EMA line graph — normalized 0-1, 1-3 series (anxiety, depression, difficulty functioning).
// Background severity bands match the codebook's normalized thresholds (0–0.2 minimal, etc.).
function MockDailyEMA({ days, series, title = "Daily Surveys (Higher Score = More Symptomatic)" }) {
  // days: array of x-axis labels (e.g., ["M", "T", "W", ...])
  // series: array of { label, color, values } where values is same length as days, 0–1
  const w = 360, h = 150, pad = 32;
  const xStep = (w - pad * 2) / Math.max(1, days.length - 1);
  const xOf = (i) => pad + i * xStep;
  const yOf = (v) => h - pad - v * (h - pad * 2);

  // Normalized severity bands (codebook section 3d)
  const bands = [
    { from: 0.0, to: 0.2, c: TEAL_LIGHT },
    { from: 0.2, to: 0.4, c: GOLD_LIGHT },
    { from: 0.4, to: 0.6, c: "#fdf0e8" },
    { from: 0.6, to: 0.8, c: CAUTION_LIGHT },
    { from: 0.8, to: 1.0, c: CAUTION_LIGHT },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{title}</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        {bands.map((b, i) => {
          const y0 = yOf(b.to);
          const y1 = yOf(b.from);
          return <rect key={i} x={pad} y={y0} width={w - pad * 2} height={y1 - y0} fill={b.c} />;
        })}
        {series.map((s, si) => {
          const pathD = s.values.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(v)}`).join(" ");
          return (
            <g key={si}>
              <path d={pathD} stroke={s.color} strokeWidth="2" fill="none" />
              {s.values.map((v, i) => (
                <circle key={i} cx={xOf(i)} cy={yOf(v)} r="2.5" fill={s.color} />
              ))}
            </g>
          );
        })}
        {/* x labels */}
        {days.map((d, i) => (
          <text key={`xl-${i}`} x={xOf(i)} y={h - 8} textAnchor="middle" fontSize="9" fill={TEXT_LIGHT}>
            {d}
          </text>
        ))}
        {/* y axis label hint */}
        <text x={6} y={yOf(0.5)} fontSize="8" fill={TEXT_LIGHT} transform={`rotate(-90 6 ${yOf(0.5)})`}>Intensity (0–1)</text>
      </svg>
      {/* legend */}
      {series.length > 1 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 10, color: TEXT_MID, marginTop: 2, paddingLeft: pad }}>
          {series.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 10, height: 2, background: s.color }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sleep bar chart — last week's sleeping patterns.
// Codebook convention: the x-axis runs 16:00 (4pm of the day BEFORE the row label)
// to 16:00 (4pm of the day OF the row label). This way a bedtime of 1am shows up as a
// continuous bar instead of being split between two rows.
//
// Input convention for `start` and `end`:
//   - Values are in hours since 16:00 of the prior afternoon.
//   - So 16:00 prior day = 0, midnight = 8, 6am = 14, 4pm same day = 24, midnight next day = 32, etc.
//   - More practically: subtract 16 from the wall clock hour, add 24 if past midnight.
//   - Example: bedtime 10pm = 22, so input is 22-16 = 6. Wake at 6am next day = (24+6)-16 = 14.
//   - In this app, we kept the raw "hours from 16:00 prior" convention so SVG math is simple;
//     start=22 means 22:00 prior afternoon (an early-evening start), and start=26 means 2am.
function MockSleepBars({ days }) {
  // days: [{ label: "Mon 09-24", start: 0.5, end: 7.0, hours: 6.5 }, ...]
  // x axis: hours 16 (4pm yesterday) → 16 (4pm today), so 24h, but visual scale starts at 16 (4pm)
  // For simplicity, we'll map start/end in hours since 16:00 day before; start < end
  const w = 360, h = 200, pad = 60;
  const xMin = 16, xMax = 40; // 4pm to 4pm next day
  const rowH = (h - 30) / days.length;
  const xScale = (hr) => pad + ((hr - xMin) / (xMax - xMin)) * (w - pad - 20);

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Last Week's Sleeping Patterns</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {days.map((d, i) => {
          const y = 10 + i * rowH;
          const x0 = xScale(d.start);
          const x1 = xScale(d.end);
          return (
            <g key={i}>
              <text x={pad - 6} y={y + rowH / 2 + 4} textAnchor="end" fontSize="9" fill={TEXT_MID}>{d.label}</text>
              <rect x={x0} y={y + 4} width={x1 - x0} height={rowH - 10} fill={TEAL} rx="2" />
              <text x={(x0 + x1) / 2} y={y + rowH / 2 + 4} textAnchor="middle" fontSize="10" fill={WHITE} fontWeight="700">{d.hours}h</text>
            </g>
          );
        })}
        {/* x ticks */}
        {[18, 22, 26, 30, 34, 38].map((hr) => (
          <g key={hr}>
            <line x1={xScale(hr)} y1={h - 20} x2={xScale(hr)} y2={h - 16} stroke={TEXT_LIGHT} />
            <text x={xScale(hr)} y={h - 6} textAnchor="middle" fontSize="9" fill={TEXT_LIGHT}>
              {((hr % 24) + 24) % 24 === 0 ? "12am" : (hr % 24) > 12 ? `${(hr % 24) - 12}pm` : `${hr % 24}am`}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Passive-active integration: a dual-axis chart — bars (passive) + line (active)
function MockDualAxis({ days, barLabel, lineLabel, barColor = TEAL_LIGHT, lineColor = CAUTION }) {
  const w = 360, h = 160, pad = 30;
  const maxBar = Math.max(...days.map(d => d.bar)) * 1.1;
  const maxLine = Math.max(...days.map(d => d.line)) * 1.1 || 1;
  const xStep = (w - pad * 2) / days.length;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{barLabel} (bars) vs. {lineLabel} (line)</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {days.map((d, i) => {
          const x = pad + i * xStep + xStep * 0.15;
          const bw = xStep * 0.7;
          const bh = (d.bar / maxBar) * (h - pad * 2);
          const y = h - pad - bh;
          return <rect key={i} x={x} y={y} width={bw} height={bh} fill={barColor} stroke={TEAL} />;
        })}
        {/* line */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          points={days.map((d, i) => {
            const x = pad + i * xStep + xStep / 2;
            const y = h - pad - (d.line / maxLine) * (h - pad * 2);
            return `${x},${y}`;
          }).join(" ")}
        />
        {days.map((d, i) => {
          const x = pad + i * xStep + xStep / 2;
          const y = h - pad - (d.line / maxLine) * (h - pad * 2);
          return <circle key={`pt-${i}`} cx={x} cy={y} r="3" fill={lineColor} />;
        })}
        {/* x labels */}
        {days.map((d, i) => (
          <text key={`lbl-${i}`} x={pad + i * xStep + xStep / 2} y={h - 8} textAnchor="middle" fontSize="9" fill={TEXT_LIGHT}>
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Correlation matrix heatmap, matching the published JOPM report's conventions.
//
// Convention:
// - `labels` is an array of N variable names.
// - `values[i][j]` is the correlation between labels[i] and labels[j], for j < i.
//   The diagonal is omitted; `values[0]` is `[]` (no cells in the first row).
// - Display: the matrix is shaped like a staircase descending from top-left.
//   * Y-axis labels are labels[1..N-1] — top to bottom, every variable except the first.
//   * X-axis labels are labels[0..N-2] — left to right, every variable except the last.
//   * Row i has i cells (at columns 0..i-1).
//   So with 7 variables, you get a 6-row triangle: row 1 has 1 cell, row 6 has 6 cells.
// - A vertical colorbar on the right shows the −1 → +1 scale with the same gradient as the cells.
function MockMatrix({ labels, values, highlight }) {
  const cellSize = 60;
  const leftPad = 90;
  const topPad = 4;
  const labelRowH = 28;
  const colorbarW = 14;
  const colorbarGap = 36;       // space between rightmost cell and colorbar
  const colorbarLabelW = 28;    // space for "+1", "0", "−1" labels right of the bar

  const nRows = labels.length - 1;
  const nCols = labels.length - 1;
  const matrixRight = leftPad + nCols * cellSize;
  const w = matrixRight + colorbarGap + colorbarW + colorbarLabelW;
  const h = topPad + nRows * cellSize + labelRowH;

  // Viridis colormap (matplotlib default for correlation heatmaps).
  // Anchors sampled at intervals on v ∈ [-1, +1].
  // Codebook matrix uses this palette: -1 dark purple, 0 teal, +1 yellow.
  const VIRIDIS = [
    { v: -1.0, r: 68,  g: 1,   b: 84  },  // #440154
    { v: -0.75, r: 65, g: 68,  b: 135 }, // #444487
    { v: -0.5, r: 59,  g: 82,  b: 139 }, // #3b528b
    { v: -0.25, r: 49, g: 104, b: 142 }, // #31688e
    { v:  0.0, r: 33,  g: 145, b: 140 }, // #21918c (teal, near-zero)
    { v:  0.25, r: 53, g: 183, b: 121 }, // #35b779
    { v:  0.5, r: 94,  g: 201, b: 98  }, // #5ec962
    { v:  0.75, r: 180, g: 222, b: 44 },// #b4de2c
    { v:  1.0, r: 253, g: 231, b: 37 }, // #fde725
  ];

  const colorFor = (v) => {
    if (v === null || v === undefined) return "transparent";
    const clamped = Math.max(-1, Math.min(1, v));
    // Find bracketing anchors and interpolate linearly.
    let lo = VIRIDIS[0], hi = VIRIDIS[VIRIDIS.length - 1];
    for (let i = 0; i < VIRIDIS.length - 1; i++) {
      if (clamped >= VIRIDIS[i].v && clamped <= VIRIDIS[i + 1].v) {
        lo = VIRIDIS[i];
        hi = VIRIDIS[i + 1];
        break;
      }
    }
    const span = hi.v - lo.v;
    const t = span === 0 ? 0 : (clamped - lo.v) / span;
    const r = Math.round(lo.r + t * (hi.r - lo.r));
    const g = Math.round(lo.g + t * (hi.g - lo.g));
    const b = Math.round(lo.b + t * (hi.b - lo.b));
    return `rgb(${r},${g},${b})`;
  };

  // Viridis is dark at the low end and bright at the high end.
  // Use white text only on the dark half; dark text on teal-green-yellow cells.
  // Matplotlib's annotated heatmap convention: switch around v ≈ -0.15.
  const textColorFor = (v) => (v !== null && v !== undefined && v < -0.15 ? WHITE : TEXT);

  // Build colorbar gradient by sampling colorFor at a sequence of stops.
  const colorbarStops = [];
  const colorbarStopCount = 17;
  for (let i = 0; i < colorbarStopCount; i++) {
    const t = i / (colorbarStopCount - 1);  // 0..1
    const v = 1 - 2 * t;                     // top of bar = +1, bottom = -1
    colorbarStops.push({ offset: `${(t * 100).toFixed(1)}%`, color: colorFor(v) });
  }
  const gradientId = `matrixColorbar-${Math.abs(labels.join('').length)}`;

  const colorbarX = matrixRight + colorbarGap;
  const colorbarTop = topPad;
  const colorbarHeight = nRows * cellSize;

  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {colorbarStops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        {/* Rows: i = 1..N-1 (skip the first label whose row has no cells). */}
        {labels.slice(1).map((rowLabel, displayRowIdx) => {
          const i = displayRowIdx + 1;
          const yTop = topPad + displayRowIdx * cellSize;
          return (
            <g key={`row-${i}`}>
              <text
                x={leftPad - 6}
                y={yTop + cellSize / 2 + 4}
                textAnchor="end"
                fontSize="10"
                fill={TEXT_MID}
                fontWeight="600"
              >
                {rowLabel}
              </text>
              {/* Row i has cells at columns 0..i-1 (strictly lower triangle, diagonal omitted). */}
              {Array.from({ length: i }, (_, j) => {
                const v = values[i]?.[j];
                if (v === null || v === undefined) return null;
                const x = leftPad + j * cellSize;
                const isHi = highlight && highlight.row === i && highlight.col === j;
                return (
                  <g key={`cell-${i}-${j}`}>
                    <rect x={x} y={yTop} width={cellSize} height={cellSize} fill={colorFor(v)} />
                    <text
                      x={x + cellSize / 2}
                      y={yTop + cellSize / 2 + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fill={textColorFor(v)}
                      fontWeight="600"
                    >
                      {v.toFixed(2)}
                    </text>
                    {isHi && (
                      <rect
                        x={x + 1}
                        y={yTop + 1}
                        width={cellSize - 2}
                        height={cellSize - 2}
                        fill="none"
                        stroke={CAUTION}
                        strokeWidth="2.5"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* X-axis labels: columns 0..N-2, horizontal as in codebook. */}
        {labels.slice(0, -1).map((colLabel, j) => {
          const cx = leftPad + j * cellSize + cellSize / 2;
          const cy = topPad + nRows * cellSize + 16;
          return (
            <text
              key={`col-${j}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              fontSize="10"
              fill={TEXT_MID}
              fontWeight="600"
            >
              {colLabel}
            </text>
          );
        })}

        {/* Colorbar legend on the right. */}
        <text x={colorbarX + colorbarW / 2} y={colorbarTop - 6} textAnchor="middle" fontSize="9" fill={TEXT_LIGHT} fontWeight="700" textTransform="uppercase">
          Correlation
        </text>
        <rect x={colorbarX} y={colorbarTop} width={colorbarW} height={colorbarHeight} fill={`url(#${gradientId})`} />
        {/* Tick marks and labels at +1, 0.5, 0, -0.5, -1 */}
        {[
          { v:  1, label:  "1" },
          { v:  0.5, label: "0.5" },
          { v:  0, label: "0" },
          { v: -0.5, label: "−0.5" },
          { v: -1, label: "−1" },
        ].map((tick) => {
          const y = colorbarTop + ((1 - tick.v) / 2) * colorbarHeight;
          return (
            <g key={tick.label}>
              <line x1={colorbarX + colorbarW} y1={y} x2={colorbarX + colorbarW + 3} y2={y} stroke={TEXT_LIGHT} />
              <text x={colorbarX + colorbarW + 6} y={y + 3} textAnchor="start" fontSize="9" fill={TEXT_MID}>
                {tick.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Polar / radar chart with overlay
function MockPolar({ axes, series, title }) {
  // axes: array of axis labels
  // series: [{ label, color, values (same length as axes, 0..1) }]
  const cx = 130, cy = 130, r = 100;
  const n = axes.length;
  const point = (i, frac) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * frac * Math.cos(angle), cy + r * frac * Math.sin(angle)];
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4, textAlign: "center" }}>{title}</div>
      <svg width="260" height="280" viewBox="0 0 260 280">
        {/* rings */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const pts = axes.map((_, i) => point(i, frac).join(",")).join(" ");
          return <polygon key={frac} points={pts} fill="none" stroke={WARM_DIM} />;
        })}
        {/* spokes */}
        {axes.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={`sp-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={WARM_DIM} />;
        })}
        {/* series */}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => point(i, v).join(",")).join(" ");
          return (
            <polygon key={si} points={pts} fill={s.color} fillOpacity="0.25" stroke={s.color} strokeWidth="2" />
          );
        })}
        {/* axis labels */}
        {axes.map((label, i) => {
          const [x, y] = point(i, 1.18);
          return (
            <text key={`lbl-${i}`} x={x} y={y} textAnchor="middle" fontSize="10" fill={TEXT_MID} fontWeight="600">
              {label}
            </text>
          );
        })}
      </svg>
      {/* legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", fontSize: 11, color: TEXT_MID, marginTop: -10 }}>
        {series.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: s.color, borderRadius: 2 }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expandable key for the polar chart axis abbreviations. Trainees will see
// the short labels in the actual report — but they also need to know what
// each one means. Default closed so it doesn't crowd the chart for trainees
// who already know.
function PolarAxisKey() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8, marginBottom: 12, border: `1.5px solid ${open ? TEAL : WARM_DIM}`, borderRadius: 10, overflow: "hidden", transition: "border-color .15s" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", textAlign: "left", padding: "10px 14px",
          border: "none", background: open ? TEAL_LIGHT : WHITE,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
          transition: "background .15s", fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: open ? TEAL : WARM_DIM,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background .15s",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: open ? WHITE : TEXT_LIGHT, lineHeight: 1 }}>i</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: open ? TEAL_DARK : TEXT, flex: 1 }}>
          What the axis abbreviations stand for
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? TEAL_DARK : TEXT_LIGHT} strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${TEAL}`, background: WHITE }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_LIGHT, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                Symptom panel
              </div>
              <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
                <strong style={{ color: NAVY }}>Anx</strong> &nbsp; Anxiety (GAD-7)<br />
                <strong style={{ color: NAVY }}>Dep</strong> &nbsp; Depression (PHQ-9)<br />
                <strong style={{ color: NAVY }}>DF</strong> &nbsp;&nbsp; Difficulty functioning (SDS)
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_LIGHT, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                Positive panel
              </div>
              <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
                <strong style={{ color: NAVY }}>ESA</strong> &nbsp; Emotional self-awareness<br />
                <strong style={{ color: NAVY }}>PSS</strong> &nbsp; Perceived social support<br />
                <strong style={{ color: NAVY }}>SE</strong> &nbsp;&nbsp; Self-efficacy<br />
                <strong style={{ color: NAVY }}>Mot</strong> &nbsp; Motivation<br />
                <strong style={{ color: NAVY }}>DL</strong> &nbsp;&nbsp; Digital literacy
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: TEXT_LIGHT, lineHeight: 1.5, marginTop: 10 }}>
            These same abbreviations appear in the published reports. Worth learning rather than memorizing once — trainees often confuse SE (self-efficacy) with ESA (emotional self-awareness).
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Module 1 — Engagement & Trajectories
// ============================================================
function Module1Concepts() {
  return (
    <Card>
      <Section title="The patient in this training">
        <Prose>
          A 28-year-old advanced-degree student. Anxious, articulate, mildly self-critical, referred to the Digital Clinic for anxiety. Eight-week program. You will walk through his weekly reports across the four modules of this training as if you were his digital navigator from intake to completion. He is the case patient from <a href="https://jopm.jmir.org/2026/1/e90255" target="_blank" rel="noopener noreferrer" style={{ color: TEAL_DARK, fontWeight: 600 }}>Lim et al. (2026)</a>.
        </Prose>
      </Section>

      <Section title="What the first page of the report contains">
        <Prose>
          The weekly data report opens with three engagement gauges (data quality, daily survey completion, skill practices) followed by the weekly PHQ-9 and GAD-7 trajectory line graphs, then a daily-EMA line graph showing daily anxiety, depression, and difficulty functioning normalized to 0–1.
        </Prose>
        <Placeholder note="How to frame the relationship between engagement gauges and symptom trajectories for the patient — needs SME review before deployment." />
      </Section>

      <Section title="The three engagement gauges">
        <ConceptTiles tiles={[
          { h: "Data Quality (left gauge)", p: "Quality and consistency of passive data collected from the patient's mobile device over the last 7 days. Scored 0 to 1. Per codebook: 0.0–0.2 poor; 0.4–0.6 average; above 0.6 good (target range). Scores above 0.6 indicate reliable data capture." },
          { h: "Daily Survey Completion (middle gauge)", p: "Number of daily EMA surveys completed out of 7 over the past 7 days, as a percentage. EMA (ecological momentary assessment) is the brief daily prompt asking the patient to rate today's anxiety, mood, and ability to manage their day. 100% means full participation across the week." },
          { h: "Skill Practices (right gauge)", p: "Frequency of completed therapeutic skill practices from Assess and Learn (excluding weekly and daily surveys). Expectation is at least one practice per day; the percentage is calculated against that target. Above 100% indicates the patient exceeded the expected level." },
        ]} />
      </Section>

      <Section title="Weekly versus daily trajectories">
        <Prose>
          The weekly PHQ-9 and GAD-7 are validated clinical instruments completed once per week. The daily EMA is a brief single-item prompt completed daily and displayed normalized 0–1. Both are shown in the report.
        </Prose>
      </Section>

      <Section title="The severity bands behind the colored backgrounds">
        <Prose>
          The weekly trajectory graphs have colored background bands mapped to validated severity cutoffs, per the codebook:
        </Prose>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
          <div style={{ background: WARM, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>PHQ-9 (Depression) — score 0–27</div>
            <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
              0–4 &nbsp;&nbsp;No depression<br />
              5–9 &nbsp;&nbsp;Mild<br />
              10–14 &nbsp;Moderate<br />
              15–19 &nbsp;Moderately severe<br />
              20–27 &nbsp;Severe
            </div>
          </div>
          <div style={{ background: WARM, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 8 }}>GAD-7 (Anxiety) — score 0–21</div>
            <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
              0–4 &nbsp;&nbsp;Minimal<br />
              5–9 &nbsp;&nbsp;Mild<br />
              10–14 &nbsp;Moderate<br />
              15–21 &nbsp;Severe
            </div>
          </div>
        </div>
        <Prose style={{ marginTop: 10 }}>
          The daily EMA scores are normalized to a 0–1 scale, with severity bands per codebook: 0–0.2 minimal, 0.2–0.4 mild, 0.4–0.6 moderate, 0.6–0.8 severe, 0.8–1.0 very severe.
        </Prose>
      </Section>

      <Section title="The ≥3-point alert threshold">
        <Prose>
          Per Lim et al. (2026): DNs review weekly PHQ-9 and GAD-7 scores and typically notify the clinician when an increase of approximately 3 or more points is observed. All changes in symptom scores are documented in the patient's note, but larger increases prompt same-day communication from the DN to the clinician so that potential treatment adjustments can be considered at the next scheduled visit.
        </Prose>
      </Section>

      <Section title="The first page of his Week 2 report">
        <div style={{ background: WARM, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
            <MockGauge value={0.84} label="Data Quality" caption="Strong passive data this week." />
            <MockGauge value={0.71} label="Daily Surveys" caption="5 of 7 completed." />
            <MockGauge value={0.29} label="Skill Practices" caption="2 of 7 expected." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <MockTrajectory scores={[4, 5, 4, 4, 5]} max={27} title="Weekly PHQ-9 (Depression)" color={NAVY} />
            <MockTrajectory scores={[15, 10, 7, 7, 6]} max={21} title="Weekly GAD-7 (Anxiety)" color={NAVY} />
          </div>
        </div>
        <Placeholder note="The values shown above are illustrative of an early-program week (Week 2) for the case patient. Specific numeric values across weeks are not all reported in the published case and may need verification or replacement with documented Week 2 values. Walkthrough commentary for this report deferred to SME." />
      </Section>

      <InfoBubble title="What the case patient looked like at Week 6">
        Per Lim et al. (2026): by Week 6, the case patient's skills practice engagement dropped to 0%, while weekly anxiety continued to decline. The paper interprets this as the patient having internalized coping strategies, with the graphs anchoring validation of his growing autonomy in symptom management. The 0%-engagement-with-continuing-improvement pattern recurs in the closing chart note in Module 4.
      </InfoBubble>
    </Card>
  );
}

function GaugeReadActivity() {
  const vignettes = [
    {
      id: "v1",
      vignette: "Week 3 report. The patient has been in the program for two weeks. He sits down, opens the report on his phone with you over video, and looks at the first page. What's the first sentence you say to him?",
      gauges: { dq: 0.38, ds: 0.86, sp: 0.71 },
      gaugeCaptions: { dq: "38%", ds: "86%", sp: "71%" },
    },
    {
      id: "v2",
      vignette: "Week 5. At last week's session he said the daily survey notification was 'getting annoying.' He opens the new report. What do you say first?",
      gauges: { dq: 0.88, ds: 0.29, sp: 0.86 },
      gaugeCaptions: { dq: "88%", ds: "29%", sp: "86%" },
    },
    {
      id: "v3",
      vignette: "Week 7. Finals week. His weekly GAD-7 dropped three points since last week, but his skills practice gauge dropped substantially. He opens the report. What's your first sentence?",
      gauges: { dq: 0.91, ds: 1.0, sp: 0.14 },
      gaugeCaptions: { dq: "91%", ds: "100%", sp: "14%" },
    },
  ];

  const [responses, setResponses] = usePersistentActivity("engagement-trajectory:gauge-read:responses", {});
  const [submitted, setSubmitted] = usePersistentActivity("engagement-trajectory:gauge-read:submitted", false);

  const setResponse = (vid, text) => {
    if (submitted) return;
    setResponses((prev) => ({ ...prev, [vid]: text }));
  };

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("engagement-trajectory", "gauge-read");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="What's your first move?"
        instructions="Three weeks, three reports. For each one, write the opening sentence you'd actually say to him as he opens the report."
      />

      <Placeholder note="This activity previously used a pick-one-of-four multiple-choice structure with interpretive verdicts that were not directly supported by the published paper or DN codebook. Reverted to open-ended response while SME reviews and provides definitive opening-move guidance per vignette." />

      {vignettes.map((v) => (
        <div key={v.id} style={{ marginBottom: 22, padding: 16, background: WARM, borderRadius: 10 }}>
          <Eyebrow>Vignette</Eyebrow>
          <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 14 }}>{v.vignette}</div>

          <div style={{ display: "flex", justifyContent: "space-around", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <MockGauge value={v.gauges.dq} label="Data Quality" caption={v.gaugeCaptions.dq} />
            <MockGauge value={v.gauges.ds} label="Daily Surveys" caption={v.gaugeCaptions.ds} />
            <MockGauge value={v.gauges.sp} label="Skill Practices" caption={v.gaugeCaptions.sp} />
          </div>

          <Eyebrow>Your opening line</Eyebrow>
          <TextArea
            value={responses[v.id] || ""}
            onChange={(t) => setResponse(v.id, t)}
            disabled={submitted}
            placeholder="The actual words you'd say to him."
            minHeight={70}
          />
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={onSubmit} disabled={submitted} />
      </div>

      <SuggestedReveal show={submitted} title="Model openings — pending SME">
        <Placeholder note="Model opening lines per vignette and discussion of common navigator missteps will be supplied by SME. The vignette setups (gauge values, clinical context) are intended as illustrative; what counts as the 'strongest' opening is a judgment call that needs grounding in DN training practice." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

function TrajectoryMismatchActivity() {
  return (
    <WorksheetTrajectoryMismatch />
  );
}

function WorksheetTrajectoryMismatch() {
  const [r, setR] = usePersistentActivity("engagement-trajectory:trajectory-mismatch:r", {});
  const [submitted, setSubmitted] = usePersistentActivity("engagement-trajectory:trajectory-mismatch:submitted", false);

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("engagement-trajectory", "trajectory-mismatch");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="Daily volatility, weekly stability"
        instructions="The patient looks at his Week 3 daily-EMA line and says 'My anxiety is all over the place — I'm not getting better.' His weekly GAD-7 dropped from 15 to 7 over the same window. Write what you actually say to him."
      />

      <div style={{ padding: 14, background: WARM, borderRadius: 10, marginBottom: 16 }}>
        <Eyebrow>What he sees on the daily line</Eyebrow>
        <div style={{ marginTop: 6 }}>
          <MockDailyEMA
            days={["M", "T", "W", "Th", "F", "Sa", "Su"]}
            series={[
              { label: "Anxiety", color: CAUTION, values: [0.45, 0.55, 0.30, 0.70, 0.20, 0.50, 0.35] },
              { label: "Depression", color: "#3a7ca5", values: [0.30, 0.40, 0.25, 0.55, 0.15, 0.35, 0.25] },
              { label: "Difficulty functioning", color: TEAL, values: [0.40, 0.45, 0.30, 0.50, 0.25, 0.40, 0.30] },
            ]}
          />
        </div>
        <Eyebrow>What the weekly line shows</Eyebrow>
        <div style={{ marginTop: 6 }}>
          <MockTrajectory scores={[15, 10, 7]} max={21} title="Weekly GAD-7" color={NAVY} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What do you say to him — in your actual words?</Eyebrow>
        <TextArea
          value={r.response}
          onChange={(v) => setR({ ...r, response: v })}
          disabled={submitted}
          placeholder="Write the actual words you'd say. Not 'I would validate his feelings' — the actual sentences."
          minHeight={90}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What are you trying to teach him about the two graphs?</Eyebrow>
        <TextArea
          value={r.teach}
          onChange={(v) => setR({ ...r, teach: v })}
          disabled={submitted}
          placeholder="One or two sentences."
          minHeight={60}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={onSubmit} disabled={submitted} />
      </div>

      <SuggestedReveal show={submitted} title="Strong-response model — pending SME">
        <Placeholder note="The interpretive model response, common-mistake analysis, and Phase 1 framing previously here used metaphors and pedagogical claims not directly supported by the published paper or DN codebook. The vignette setup (daily volatility versus weekly stability) is structurally accurate to the published case at Week 3 — the specific 'what to say to him' guidance needs SME review." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

// ============================================================
// Module 2 — Sleep & Passive-Active
// ============================================================
function Module2Concepts() {
  return (
    <Card>
      <Section title="The middle of the report">
        <Prose>
          The middle of the weekly report contains the sleep visualization, the dual-axis passive-active graph, and the correlation matrix (covered in Module 3). The paper describes the DN-supported workflow as "collaborative interpretation": the DN brings the visible patterns, the patient brings the lived experience.
        </Prose>
      </Section>

      <Section title="Reading the sleep bars">
        <Prose>
          Per codebook: the sleep visualization is a horizontal bar per day. The left endpoint is the estimated sleep onset, the right endpoint is the wake-up time, and the white number centered within the bar is the total sleep duration in hours. Sleep data is collected via accelerometer plus screen-time activity.
        </Prose>
        <Prose style={{ marginTop: 6 }}>
          The x-axis runs from 4pm one afternoon to 4pm the next afternoon (16:00 to 16:00), per the codebook example. This allows a late bedtime to render as a continuous bar rather than splitting across two rows.
        </Prose>
        <div style={{ background: WARM, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <MockSleepBars days={[
            { label: "Mon", start: 24.5, end: 31, hours: 6.5 },
            { label: "Tue", start: 26, end: 30.5, hours: 4.5 },
            { label: "Wed", start: 25, end: 31, hours: 6.0 },
            { label: "Thu", start: 26, end: 30.5, hours: 4.5 },
            { label: "Fri", start: 22, end: 29, hours: 7.0 },
            { label: "Sat", start: 26.5, end: 30.5, hours: 4.0 },
            { label: "Sun", start: 24.5, end: 30, hours: 5.5 },
          ]} />
        </div>
        <Placeholder note="How to approach reading a sleep visualization with a patient — naming versus judging patterns, when to probe a specific night versus the week's overall shape — needs SME review." />
      </Section>

      <Section title="The dual-axis passive-active graph">
        <Prose>
          Per codebook: the dual-axis graph overlays a passive behavioral metric (shown as bars — steps, screen time, hometime, or entropy) with an active daily survey score (shown as a line — daily anxiety, depression, or difficulty functioning). The left y-axis applies to the passive metric; the right y-axis applies to the survey score. Where the line graph is discontinuous, that indicates missing data for those days. All higher survey scores indicate more symptomatic conditions.
        </Prose>
        <div style={{ background: WARM, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <MockDualAxis
            days={[
              { label: "Mon", bar: 8500, line: 0.30 },
              { label: "Tue", bar: 1200, line: 0.70 },
              { label: "Wed", bar: 9000, line: 0.35 },
              { label: "Thu", bar: 900, line: 0.65 },
              { label: "Fri", bar: 7800, line: 0.40 },
              { label: "Sat", bar: 11000, line: 0.25 },
              { label: "Sun", bar: 5500, line: 0.45 },
            ]}
            barLabel="Steps"
            lineLabel="Daily anxiety"
          />
        </div>
        <Placeholder note="Guidance on how to use the dual-axis graph in conversation with a patient — pointing-and-asking versus narrating, handling the temptation to over-read a single week's co-movement — needs SME review." />
      </Section>
    </Card>
  );
}

function SleepReadActivity() {
  // Three sleep-pattern vignettes. For each, classify what the pattern most likely reflects.
  const cases = [
    {
      id: "s1",
      label: "Pattern A",
      desc: "Bedtime varies from 10pm to 2am. Wake time is consistent around 7am. Total hours range 5–9.",
      days: [
        { label: "Mon", start: 22, end: 31, hours: 9 },
        { label: "Tue", start: 23.5, end: 31, hours: 7.5 },
        { label: "Wed", start: 25, end: 31, hours: 6 },
        { label: "Thu", start: 23, end: 31, hours: 8 },
        { label: "Fri", start: 26, end: 31, hours: 5 },
        { label: "Sat", start: 22, end: 31, hours: 9 },
        { label: "Sun", start: 24, end: 31, hours: 7 },
      ],
      correct: new Set(["fixed-wake", "variable-bedtime"]),
    },
    {
      id: "s2",
      label: "Pattern B",
      desc: "Bedtime is consistent at 11pm. Wake times vary widely — some 5am, some 11am. Total hours: 6–12.",
      days: [
        { label: "Mon", start: 23, end: 35, hours: 12 },
        { label: "Tue", start: 23, end: 29, hours: 6 },
        { label: "Wed", start: 23, end: 30, hours: 7 },
        { label: "Thu", start: 23, end: 34, hours: 11 },
        { label: "Fri", start: 23, end: 30, hours: 7 },
        { label: "Sat", start: 23, end: 35, hours: 12 },
        { label: "Sun", start: 23, end: 31, hours: 8 },
      ],
      correct: new Set(["fixed-bedtime", "variable-wake"]),
    },
    {
      id: "s3",
      label: "Pattern C",
      desc: "Three nights of 4–5 hours followed by one night of 11 hours, repeating. Both bedtime and wake time inconsistent.",
      days: [
        { label: "Mon", start: 26, end: 30, hours: 4 },
        { label: "Tue", start: 25, end: 30, hours: 5 },
        { label: "Wed", start: 26.5, end: 30.5, hours: 4 },
        { label: "Thu", start: 22, end: 33, hours: 11 },
        { label: "Fri", start: 26, end: 30.5, hours: 4.5 },
        { label: "Sat", start: 25.5, end: 30.5, hours: 5 },
        { label: "Sun", start: 22, end: 33, hours: 11 },
      ],
      correct: new Set(["debt-rebound", "both-variable"]),
    },
  ];

  const tags = [
    { id: "fixed-wake", label: "Anchored wake time" },
    { id: "variable-bedtime", label: "Variable bedtime" },
    { id: "fixed-bedtime", label: "Anchored bedtime" },
    { id: "variable-wake", label: "Variable wake time" },
    { id: "debt-rebound", label: "Debt-and-rebound pattern" },
    { id: "both-variable", label: "Both anchors loose" },
    // Distractors. "consistent" is the trap for Pattern A (anchored wake reads as "consistent" on
    // a quick glance). "narrow-window" is the trap for Pattern B (the 11pm-anchored bedtime can read
    // as a stable window if you don't look at the wake column).
    { id: "consistent", label: "Consistent sleep window" },
    { id: "narrow-window", label: "Tight sleep window" },
  ];

  const [selections, setSelections] = usePersistentActivity("sleep-passive-active:sleep-read:selections",
    Object.fromEntries(cases.map(c => [c.id, new Set()])));
  const [submitted, setSubmitted] = usePersistentActivity("sleep-passive-active:sleep-read:submitted", false);

  const toggle = (cid, tid) => {
    if (submitted) return;
    setSelections((prev) => {
      const next = { ...prev };
      const s = new Set(next[cid] || []);
      if (s.has(tid)) s.delete(tid); else s.add(tid);
      next[cid] = s;
      return next;
    });
  };

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("sleep-passive-active", "sleep-read");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="Naming the sleep pattern"
        instructions="Three weeks of sleep bars. For each, select the descriptors that apply. The point is not to diagnose — it's to have language ready when you ask the patient to look at the bars with you."
      />

      {cases.map((c) => {
        const sel = selections[c.id] || new Set();
        const correctHits = [...sel].filter(s => c.correct.has(s));
        const wrongHits = [...sel].filter(s => !c.correct.has(s));
        const status = !submitted ? "neutral"
          : (correctHits.length === c.correct.size && wrongHits.length === 0) ? "correct"
          : (correctHits.length > 0 && wrongHits.length === 0) ? "partial"
          : "incorrect";
        const borderColor = status === "correct" ? TEAL : status === "partial" ? GOLD : status === "incorrect" ? CAUTION : WARM_DIM;

        return (
          <div key={c.id} style={{ marginBottom: 18, padding: 14, background: WARM, borderRadius: 10, borderLeft: `3px solid ${borderColor}` }}>
            <Eyebrow>{c.label}</Eyebrow>
            <div style={{ fontSize: 12, color: TEXT_MID, marginBottom: 10, lineHeight: 1.5 }}>{c.desc}</div>
            <div style={{ marginBottom: 12 }}>
              <MockSleepBars days={c.days} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {tags.map((t) => {
                const isSel = sel.has(t.id);
                const color = submitted
                  ? (isSel && c.correct.has(t.id) ? "teal"
                    : isSel && !c.correct.has(t.id) ? "caution"
                    : !isSel && c.correct.has(t.id) ? "gold"
                    : undefined)
                  : "teal";
                return (
                  <TagButton
                    key={t.id}
                    label={t.label}
                    selected={isSel || (submitted && c.correct.has(t.id))}
                    onClick={() => toggle(c.id, t.id)}
                    color={color}
                    disabled={submitted}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={onSubmit} disabled={submitted} />
      </div>

      <SuggestedReveal show={submitted} title="What the patterns describe">
        <Placeholder note="The structural descriptors (anchored wake, variable bedtime, etc.) are direct observations from the sleep bars. The clinical and behavioral interpretations of what each pattern might reflect (work versus depression versus deadline-driven sleep) require SME guidance grounded in DN training practice rather than the published documents alone." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

function PassiveActiveStoryActivity() {
  const [r, setR] = usePersistentActivity("sleep-passive-active:passive-active-story:r", {});
  const [submitted, setSubmitted] = usePersistentActivity("sleep-passive-active:passive-active-story:submitted", false);

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("sleep-passive-active", "passive-active-story");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="Telling the week's story"
        instructions="The Week 4 passive-active integration graph for the grad student. This is what you see when you open the report for his session. Walk through what you'd say to him — what you point at, what you ask, what you avoid."
      />

      <div style={{ padding: 14, background: WARM, borderRadius: 10, marginBottom: 16 }}>
        <Eyebrow>Steps vs. daily anxiety, Week 4</Eyebrow>
        <div style={{ marginTop: 6 }}>
          <MockDualAxis
            days={[
              { label: "Mon", bar: 6500, line: 0.30 },
              { label: "Tue", bar: 1200, line: 0.65 },
              { label: "Wed", bar: 800, line: 0.70 },
              { label: "Thu", bar: 600, line: 0.60 },
              { label: "Fri", bar: 5500, line: 0.40 },
              { label: "Sat", bar: 7200, line: 0.35 },
              { label: "Sun", bar: 6000, line: 0.40 },
            ]}
            barLabel="Steps"
            lineLabel="Daily anxiety"
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What is the first day you point at, and why?</Eyebrow>
        <TextArea value={r.firstDay} onChange={(v) => setR({ ...r, firstDay: v })} disabled={submitted} placeholder="One sentence." minHeight={50} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What question do you ask him about the pattern?</Eyebrow>
        <TextArea value={r.question} onChange={(v) => setR({ ...r, question: v })} disabled={submitted} placeholder="The actual question, not a description of it." minHeight={60} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What would be a poor takeaway to push toward, and why?</Eyebrow>
        <TextArea value={r.bad} onChange={(v) => setR({ ...r, bad: v })} disabled={submitted} placeholder="The trap that the obvious-looking pattern sets up." minHeight={60} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={onSubmit} disabled={submitted} />
      </div>

      <SuggestedReveal show={submitted} title="A walk-through — pending SME">
        <div style={{ background: GOLD_LIGHT, padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 12, color: TEXT_MID, lineHeight: 1.6 }}>
          <strong style={{ color: GOLD_DARK }}>Context from the published case:</strong> Per Lim et al. (2026), the case patient was sick during Week 4 ("illness in Week 4"); the paper's discussion of the Week 4 matrix and dual-axis context frames the symptom changes as "linked to necessary recovery behaviors rather than indicating treatment failure." This activity's vignette is structured to mirror that scenario.
        </div>
        <Placeholder note="The model walk-through (which day to point at first, what question to ask, what trap to avoid) is interpretive guidance that goes beyond what the paper or codebook directly state. Needs SME review." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

// ============================================================
// Module 3 — Correlation Matrix
// ============================================================
function Module3Concepts() {
  return (
    <Card>
      <Section title="What the matrix shows">
        <Prose>
          Per the paper and codebook: each cell is the Spearman correlation between two variables across the days of the past week. The variables include passive metrics (steps, screen time, hometime, entropy) and active daily-EMA scores (daily anxiety, daily depression, daily difficulty functioning, labeled "Daily DF"). Values run from −1 to +1.
        </Prose>
        <Prose style={{ marginTop: 8 }}>
          Per codebook: positive correlations (values between 0 and 1) mean that as one variable increases, the other increases; the closer to +1, the stronger. Negative correlations (values between −1 and 0) mean that as one variable increases, the other decreases; the closer to −1, the stronger. The color scale uses viridis, with yellow at the strongly positive end and dark purple at the strongly negative end.
        </Prose>

        <div style={{ background: WARM, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <MockMatrix
            labels={["Daily Anx", "Daily DF", "Daily Dep", "Entropy", "Hometime", "Screen Time", "Steps"]}
            values={[
              [null],
              [0.51, null],
              [0.84, 0.66, null],
              [-0.22, -0.35, -0.24, null],
              [0.15, 0.39, 0.24, -0.93, null],
              [0.27, 0.33, 0.39, -0.33, 0.38, null],
              [-0.20, -0.21, -0.38, 0.29, -0.40, -0.28, null],
            ]}
            highlight={{ row: 4, col: 1 }}
          />
          <div style={{ fontSize: 11, color: TEXT_LIGHT, marginTop: 6, textAlign: "center" }}>
            Week 4 correlation matrix from the case patient (Lim et al., 2026, Figure 9). Highlighted cell: hometime ↔ daily difficulty functioning = +0.39.
          </div>
        </div>
      </Section>

      <Section title="What the matrix cannot tell you">
        <Prose>
          Per codebook: "Correlation does not equal to causation. This graph cannot show that one variable causes a change in another variable, only how changes in variables are associated with each other." Additionally per codebook: "A correlation of 0 means there is no linear relationship. However, just because a correlation is 0 does not necessarily mean there is no relationship there. There is always the possibility that two variables have a nonlinear relationship."
        </Prose>
      </Section>

      <Placeholder note="Guidance on how to triage cells in a real matrix (which are clinically meaningful versus mechanical artifacts versus too weak to act on), how to choose an anchor cell for patient conversation, and how to translate a cell into plain-English observation — all require SME review. Neither the paper nor the codebook provides numeric magnitude thresholds for distinguishing meaningful from weak correlations, and the categorization of any specific cell is a clinical judgment, not a codified rule." />
    </Card>
  );
}

function MatrixReadActivity() {
  // Show a matrix; trainee selects which findings are real, which are artifactual, which are weak.
  // Matrix labels (and column/row indices, both 0-indexed in `labels`):
  //   Daily Anx=0, Daily DF=1, Daily Dep=2, Entropy=3, Hometime=4, Screen Time=5, Steps=6
  // values[i] is the i-th row of the lower triangle. row 0 (Daily Anx) has no cells; the bottom row (Steps) has 6 cells.
  // Cell `row`/`col` in this array reference positions in the lower-triangular `values` array.
  const cells = [
    { id: "df-anx",         label: "Daily Difficulty Functioning ↔ Daily Anxiety = +0.51",      row: 1, col: 0 },
    { id: "hometime-ent",   label: "Hometime ↔ Entropy = −0.93",                                 row: 4, col: 3 },
    { id: "hometime-df",    label: "Hometime ↔ Daily Difficulty Functioning = +0.39",            row: 4, col: 1 },
    { id: "screen-ent",     label: "Screen Time ↔ Entropy = −0.33",                              row: 5, col: 3 },
    { id: "steps-hometime", label: "Steps ↔ Hometime = −0.40",                                   row: 6, col: 4 },
    { id: "steps-df",       label: "Steps ↔ Daily Difficulty Functioning = −0.21",               row: 6, col: 1 },
    { id: "entropy-df",     label: "Entropy ↔ Daily Difficulty Functioning = −0.35",             row: 3, col: 1 },
  ];

  const verdictTags = [
    { id: "real", label: "Clinically meaningful" },
    { id: "artifact", label: "Definitional / mechanical" },
    { id: "weak", label: "Too weak to act on" },
  ];

  const [verdicts, setVerdicts] = usePersistentActivity("correlation-matrix:matrix-read:verdicts", {});
  const [submitted, setSubmitted] = usePersistentActivity("correlation-matrix:matrix-read:submitted", false);
  const [activeIdx, setActiveIdx] = usePersistentActivity("correlation-matrix:matrix-read:activeIdx", 0);

  const activeCell = cells[activeIdx];
  const activeVerdict = verdicts[activeCell.id];
  const isLocked = !!activeVerdict;  // once sorted, the cell is locked in

  const sortedCount = cells.filter((c) => verdicts[c.id]).length;
  const allSorted = sortedCount === cells.length;

  const setVerdict = (cellId, v) => {
    if (verdicts[cellId]) return;  // locked once chosen
    setVerdicts((prev) => ({ ...prev, [cellId]: v }));
  };

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("correlation-matrix", "matrix-read");
  };

  const goPrev = () => setActiveIdx(Math.max(0, activeIdx - 1));
  const goNext = () => setActiveIdx(Math.min(cells.length - 1, activeIdx + 1));

  return (
    <ActivityWrap>
      <ActivityHead
        title="Sorting the cells"
        instructions="Same Week 4 matrix as below. For each cell, record what you'd call it: clinically meaningful, a definitional / mechanical artifact, or too weak to act on. The matrix highlights the current cell. SME-supplied verdicts and per-cell rationales will replace the placeholder text below."
      />

      <Placeholder note="The three-category sort (meaningful / artifact / weak) is the activity's structure. The category for each specific cell is a clinical judgment, not codified in the published paper or DN codebook. SME to provide a verdict and one-line rationale per cell." />

      <div style={{ background: WARM, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <MockMatrix
          labels={["Daily Anx", "Daily DF", "Daily Dep", "Entropy", "Hometime", "Screen Time", "Steps"]}
          values={[
            [null],
            [0.51, null],
            [0.84, 0.66, null],
            [-0.22, -0.35, -0.24, null],
            [0.15, 0.39, 0.24, -0.93, null],
            [0.27, 0.33, 0.39, -0.33, 0.38, null],
            [-0.20, -0.21, -0.38, 0.29, -0.40, -0.28, null],
          ]}
          highlight={{ row: activeCell.row, col: activeCell.col }}
        />
      </div>

      {/* Active-cell card */}
      <div
        style={{
          padding: "16px 18px",
          background: WARM,
          borderRadius: 10,
          border: `2px solid ${isLocked ? NAVY : WARM_DIM}`,
          marginBottom: 12,
          minHeight: 130,
          transition: "border-color .2s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <Eyebrow>Cell {activeIdx + 1} of {cells.length}</Eyebrow>
          <div style={{ fontSize: 11, color: TEXT_LIGHT }}>
            {sortedCount === 0 ? "Record your read for each cell" : `${sortedCount} of ${cells.length} recorded`}
          </div>
        </div>
        <div style={{ fontSize: 15, color: TEXT, marginBottom: 14, fontWeight: 500, lineHeight: 1.4 }}>
          {activeCell.label}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {verdictTags.map((t) => {
            const isSel = activeVerdict === t.id;
            return (
              <TagButton
                key={t.id}
                label={t.label}
                selected={isSel}
                onClick={() => setVerdict(activeCell.id, t.id)}
                color="teal"
                disabled={isLocked}
              />
            );
          })}
        </div>

        {/* Once a verdict is recorded, surface a placeholder for the SME-supplied rationale. */}
        {isLocked && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: WHITE,
              borderRadius: 8,
              borderLeft: `3px solid ${NAVY}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
              Your read: {verdictTags.find((t) => t.id === activeVerdict)?.label}
            </div>
            <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.5, fontStyle: "italic" }}>
              [Placeholder] SME-supplied rationale for this cell will go here, including the working verdict and reasoning grounded in DN training practice.
            </div>
          </div>
        )}
      </div>

      {/* Navigation row: prev / dots / next */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          onClick={goPrev}
          disabled={activeIdx === 0}
          style={{
            padding: "8px 14px",
            background: activeIdx === 0 ? WARM_DIM : WHITE,
            color: activeIdx === 0 ? TEXT_LIGHT : NAVY,
            border: `1px solid ${WARM_DIM}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: activeIdx === 0 ? "not-allowed" : "pointer",
          }}
        >
          ← Previous
        </button>

        {/* Dot indicator: jump to any cell; no right/wrong color until SME verdicts are added */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {cells.map((c, i) => {
            const hasVerdict = !!verdicts[c.id];
            const isActive = i === activeIdx;
            const bg = hasVerdict ? NAVY : WARM_DIM;
            const size = isActive ? 12 : 8;
            return (
              <button
                key={c.id}
                onClick={() => setActiveIdx(i)}
                aria-label={`Go to cell ${i + 1}`}
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: isActive ? `2px solid ${NAVY}` : "none",
                  background: bg,
                  padding: 0,
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              />
            );
          })}
        </div>

        <button
          onClick={goNext}
          disabled={activeIdx === cells.length - 1}
          style={{
            padding: "8px 14px",
            background: activeIdx === cells.length - 1 ? WARM_DIM : WHITE,
            color: activeIdx === cells.length - 1 ? TEXT_LIGHT : NAVY,
            border: `1px solid ${WARM_DIM}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: activeIdx === cells.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          Next →
        </button>
      </div>

      {/* Final panel — visible once all sorted */}
      {allSorted && (
        <div
          style={{
            padding: "14px 18px",
            background: WARM,
            borderRadius: 10,
            border: `1px solid ${WARM_DIM}`,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_LIGHT, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
              All cells recorded
            </div>
            <div style={{ fontSize: 14, color: TEXT_MID }}>
              SME-supplied verdicts and gestalt reveal will appear after submit.
            </div>
          </div>
          {!submitted && <SubmitBtn onClick={onSubmit} label="Submit" />}
        </div>
      )}

      <SuggestedReveal show={submitted} title="Gestalt reveal — pending SME">
        <Placeholder note="The narrative reveal (sorting the cells into the three categories with reasoning about why each falls where, plus the broader Phase 2 framing of how the matrix functions in a session) will be supplied by SME." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}


function MatrixTranslateActivity() {
  const [r, setR] = usePersistentActivity("correlation-matrix:matrix-translate:r", {});
  const [submitted, setSubmitted] = usePersistentActivity("correlation-matrix:matrix-translate:submitted", false);

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("correlation-matrix", "matrix-translate");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="One cell, one sentence"
        instructions="Pick the strongest non-artifactual cell from the Week 4 matrix and write the single sentence you'd actually say to the patient. Then write what you'd avoid saying."
      />

      <div style={{ background: WARM, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <MockMatrix
          labels={["Daily Anx", "Daily DF", "Daily Dep", "Entropy", "Hometime", "Screen Time", "Steps"]}
          values={[
            [null],
            [0.51, null],
            [0.84, 0.66, null],
            [-0.22, -0.35, -0.24, null],
            [0.15, 0.39, 0.24, -0.93, null],
            [0.27, 0.33, 0.39, -0.33, 0.38, null],
            [-0.20, -0.21, -0.38, 0.29, -0.40, -0.28, null],
          ]}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>Which cell are you going to anchor the conversation on, and why that one?</Eyebrow>
        <TextArea value={r.pick} onChange={(v) => setR({ ...r, pick: v })} disabled={submitted} placeholder="Name the cell and the reason." minHeight={60} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>The actual sentence you say to him</Eyebrow>
        <TextArea value={r.sentence} onChange={(v) => setR({ ...r, sentence: v })} disabled={submitted} placeholder="One sentence. Plain English. Not 'the correlation is...'." minHeight={70} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What you avoid saying — and why</Eyebrow>
        <TextArea value={r.avoid} onChange={(v) => setR({ ...r, avoid: v })} disabled={submitted} placeholder="The phrasing that would overreach from the data." minHeight={70} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={onSubmit} disabled={submitted} />
      </div>

      <SuggestedReveal show={submitted} title="Model translation — pending SME">
        <Placeholder note="A model anchor cell, the sentence to say to the patient, and the phrasings to avoid all require SME guidance. The activity's structure (pick a cell, write the translation, name what to avoid) is sound; the model answers are clinical judgment calls not codified in the documents." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

// ============================================================
// Module 4 — Polar & Closing
// ============================================================
function Module4Concepts() {
  return (
    <Card>
      <Section title="The radar / polar chart">
        <Prose>
          Per Lim et al. (2026) and the codebook: the report's radar charts (titled "Baseline Metrics" and "Positive Valence Metrics") show patient scores at three time points across the program — intake (pink), interim/midpoint (blue), and completion (green). The two panels separate symptom axes from positive-valence axes:
        </Prose>
        <Prose style={{ marginTop: 6 }}>
          Symptom axes (anxiety via GAD-7, depression via PHQ-9, difficulty functioning via SDS): inward movement means lower scores, indicating improvement. Positive-valence axes (emotional self-awareness, perceived social support, self-efficacy, motivation, digital literacy, sometimes flourishing): outward movement means higher scores, indicating improvement. All scores are normalized 0–1 in the visualization for cross-domain comparison.
        </Prose>

        <PolarAxisKey />

        <div style={{ background: WARM, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MockPolar
              title="Symptom axes (inward = better)"
              axes={["Anx", "Dep", "DF"]}
              series={[
                { label: "Intake", color: "#e76f51", values: [0.85, 0.50, 0.75] },
                { label: "Interim", color: "#3a7ca5", values: [0.45, 0.30, 0.45] },
                { label: "Completion", color: "#2a9d8f", values: [0.30, 0.25, 0.20] },
              ]}
            />
            <MockPolar
              title="Positive axes (outward = better)"
              axes={["ESA", "PSS", "SE", "Motivation", "DL"]}
              series={[
                { label: "Intake", color: "#e76f51", values: [0.50, 0.60, 0.45, 0.40, 0.55] },
                { label: "Interim", color: "#3a7ca5", values: [0.70, 0.70, 0.55, 0.55, 0.65] },
                { label: "Completion", color: "#2a9d8f", values: [0.85, 0.80, 0.80, 0.85, 0.85] },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="A second polar chart in the appendix">
        <Prose>
          The DN codebook (section 4d) describes a second polar visualization in the report appendix — three separate panels showing start week, median week, and final week. This appendix polar combines phenotyping features (hometime, screen time, entropy, sleep, steps) AND survey scores on the same axes, with all values binned into 5 discrete levels (0–4). Gray segments indicate missing data; white segments indicate level 0.
        </Prose>
        <Prose style={{ marginTop: 6 }}>
          The 5-level binning thresholds per codebook:
        </Prose>
        <div style={{ background: WARM, borderRadius: 10, padding: 14, fontFamily: "'DM Mono', monospace", fontSize: 11, color: TEXT_MID, lineHeight: 1.8, marginTop: 6 }}>
          <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Phenotyping features (higher level = more activity / time)</div>
          Hometime &nbsp;&nbsp;&nbsp;&nbsp;0h | 0–10h | 10–15h | 15–20h | 20h+<br />
          Screen &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0h | 0–4h | 4–8h | 8–12h | 12h+<br />
          Entropy &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0 | 0–0.25 | 0.25–0.5 | 0.5–1 | 1+<br />
          Steps &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0 | 0–5k | 5–10k | 10–15k | 15k+<br />
          Sleep &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0h | 0–5h | 5–10h | 10–15h | 15h+
          <div style={{ fontWeight: 700, color: NAVY, marginTop: 12, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Survey features (higher level = more symptomatic)</div>
          PHQ-9 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0–4 | 5–9 | 10–14 | 15–21 | 22–27<br />
          GAD-7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0 | 0–4 | 5–9 | 10–14 | 15–21<br />
          Daily EMA &nbsp;&nbsp;&nbsp;&nbsp;0–2 | 2–4 | 4–6 | 6–8 | 8–10
        </div>
      </Section>

      <Section title="The Week 6 finding from the case patient">
        <Prose>
          Per Lim et al. (2026): the case patient's skills-practice engagement dropped to 0% in Week 6 while weekly anxiety continued to decline. The paper interprets this as the patient having "successfully internalized coping strategies." The completion polar chart in the same paper shows positive-valence axes (particularly motivation and self-efficacy) expanded outward beyond interim levels at the end of the program.
        </Prose>
      </Section>

      <Placeholder note="Phase 3 conversation guidance — how to facilitate the closing session, how much to narrate vs. let the patient narrate, how to handle mixed polar-chart results, and how to address patient questions about what happens after the program ends — needs SME review. The paper notes that the program offers a static PDF report on request, but specifics on conversation framing are not codified in the documents." />
    </Card>
  );
}

function PolarReadActivity() {
  // Four polar-chart configurations. Trainee tags what they observe in each shape pattern.
  // Verdicts unsettled pending SME — `correct` sets removed; tags are recorded but not graded.
  const cases = [
    {
      id: "p1",
      label: "Pattern 1",
      desc: "Completion shape strongly contracted on symptom axes. Positive-valence axes expanded substantially beyond interim.",
      sym: { intake: [0.85, 0.5, 0.75], interim: [0.5, 0.3, 0.5], completion: [0.25, 0.2, 0.2] },
      pos: { intake: [0.5, 0.6, 0.45, 0.4, 0.55], interim: [0.7, 0.7, 0.55, 0.55, 0.65], completion: [0.85, 0.8, 0.8, 0.85, 0.85] },
    },
    {
      id: "p2",
      label: "Pattern 2",
      desc: "Completion symptoms similar to interim — flat from Week 4 to Week 8. Positive-valence axes expanded notably.",
      sym: { intake: [0.85, 0.5, 0.75], interim: [0.5, 0.4, 0.45], completion: [0.5, 0.4, 0.45] },
      pos: { intake: [0.4, 0.5, 0.4, 0.3, 0.5], interim: [0.55, 0.6, 0.5, 0.5, 0.6], completion: [0.8, 0.75, 0.75, 0.8, 0.8] },
    },
    {
      id: "p3",
      label: "Pattern 3",
      desc: "Symptoms contracted, but interim and completion positive-valence shapes are nearly identical. Motivation specifically dropped slightly from interim to completion.",
      sym: { intake: [0.8, 0.55, 0.7], interim: [0.45, 0.35, 0.45], completion: [0.3, 0.25, 0.25] },
      pos: { intake: [0.45, 0.55, 0.4, 0.5, 0.5], interim: [0.65, 0.7, 0.55, 0.65, 0.65], completion: [0.7, 0.7, 0.6, 0.55, 0.7] },
    },
    {
      id: "p4",
      label: "Pattern 4",
      desc: "Interim (Week 4) shows the strongest improvement. Completion (Week 8) regressed slightly from interim across most axes — still better than intake, but not as good as the midpoint.",
      sym: { intake: [0.85, 0.55, 0.75], interim: [0.35, 0.20, 0.30], completion: [0.50, 0.35, 0.45] },
      pos: { intake: [0.40, 0.55, 0.40, 0.45, 0.55], interim: [0.80, 0.75, 0.75, 0.80, 0.75], completion: [0.65, 0.65, 0.60, 0.55, 0.65] },
    },
  ];

  const tags = [
    { id: "symptom-improve", label: "Symptoms improved" },
    { id: "symptom-plateau", label: "Symptom plateau" },
    { id: "positive-improve", label: "Positive-valence expanded" },
    { id: "positive-plateau", label: "Positive-valence plateau" },
    { id: "strong-finish", label: "Strong overall finish" },
    { id: "mixed-finish", label: "Mixed finish, worth discussing" },
    { id: "watch-motivation", label: "Motivation drop worth noting" },
    { id: "interim-peak", label: "Interim was the high point" },
    { id: "regression-from-peak", label: "Regression from interim peak" },
  ];

  const [selections, setSelections] = usePersistentActivity("polar-multidimensional:polar-read:selections",
    Object.fromEntries(cases.map(c => [c.id, new Set()])));
  const [submitted, setSubmitted] = usePersistentActivity("polar-multidimensional:polar-read:submitted", false);

  const toggle = (cid, tid) => {
    if (submitted) return;
    setSelections((prev) => {
      const next = { ...prev };
      const s = new Set(next[cid] || []);
      if (s.has(tid)) s.delete(tid); else s.add(tid);
      next[cid] = s;
      return next;
    });
  };

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("polar-multidimensional", "polar-read");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="Reading the shape across time"
        instructions="Four patients' completion polar charts. For each, select the descriptors you'd apply to the three-shape comparison."
      />

      <Placeholder note="The structural descriptors (whether symptoms improved or plateaued, whether positive-valence expanded, whether interim was the peak) are direct observations from the polar shapes. Which combinations 'should' be selected for each pattern, plus the closing-session implications of each pattern, are clinical judgment calls awaiting SME review." />

      {cases.map((c) => {
        const sel = selections[c.id] || new Set();
        return (
          <div key={c.id} style={{ marginBottom: 18, padding: 14, background: WARM, borderRadius: 10 }}>
            <Eyebrow>{c.label}</Eyebrow>
            <div style={{ fontSize: 12, color: TEXT_MID, marginBottom: 10, lineHeight: 1.5 }}>{c.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <MockPolar
                title="Symptoms (inward=better)"
                axes={["Anx", "Dep", "DF"]}
                series={[
                  { label: "Intake", color: "#e76f51", values: c.sym.intake },
                  { label: "Interim", color: "#3a7ca5", values: c.sym.interim },
                  { label: "Completion", color: "#2a9d8f", values: c.sym.completion },
                ]}
              />
              <MockPolar
                title="Positive (outward=better)"
                axes={["ESA", "PSS", "SE", "Mot", "DL"]}
                series={[
                  { label: "Intake", color: "#e76f51", values: c.pos.intake },
                  { label: "Interim", color: "#3a7ca5", values: c.pos.interim },
                  { label: "Completion", color: "#2a9d8f", values: c.pos.completion },
                ]}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {tags.map((t) => {
                const isSel = sel.has(t.id);
                return (
                  <TagButton
                    key={t.id}
                    label={t.label}
                    selected={isSel}
                    onClick={() => toggle(c.id, t.id)}
                    color="teal"
                    disabled={submitted}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn onClick={onSubmit} disabled={submitted} />
      </div>

      <SuggestedReveal show={submitted} title="Per-pattern closing session guidance — pending SME">
        <Placeholder note="SME to supply: for each of the four patterns, what the closing session should prioritize, which axes are the clinical anchors, and the Phase 3 framing for that specific pattern. The four patterns are designed to span clean finish / plateau / motivation dip / interim peak — the diagnostic categories and their conversation implications need SME-supplied content." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

function CompletionSummaryActivity() {
  const [r, setR] = usePersistentActivity("polar-multidimensional:completion-summary:r", {});
  const [submitted, setSubmitted] = usePersistentActivity("polar-multidimensional:completion-summary:submitted", false);

  const onSubmit = () => {
    setSubmitted(true);
    markActivityDone("polar-multidimensional", "completion-summary");
  };

  return (
    <ActivityWrap>
      <ActivityHead
        title="The closing chart note"
        instructions="At the end of every patient's Digital Clinic program, the navigator documents a brief summary in the chart. Write what you'd write for the graduate student. Then write what you'd say to him directly in the closing session."
      />

      <div style={{ background: WARM, borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <Eyebrow>His final polar chart (illustrative)</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
          <MockPolar
            title="Symptoms (inward=better)"
            axes={["Anx", "Dep", "DF"]}
            series={[
              { label: "Intake", color: "#e76f51", values: [0.85, 0.30, 0.75] },
              { label: "Interim", color: "#3a7ca5", values: [0.45, 0.20, 0.45] },
              { label: "Completion", color: "#2a9d8f", values: [0.30, 0.20, 0.20] },
            ]}
          />
          <MockPolar
            title="Positive (outward=better)"
            axes={["ESA", "PSS", "SE", "Mot", "DL"]}
            series={[
              { label: "Intake", color: "#e76f51", values: [0.50, 0.65, 0.45, 0.40, 0.55] },
              { label: "Interim", color: "#3a7ca5", values: [0.70, 0.70, 0.55, 0.55, 0.65] },
              { label: "Completion", color: "#2a9d8f", values: [0.85, 0.80, 0.80, 0.85, 0.85] },
            ]}
          />
        </div>
        <div style={{ fontSize: 12, color: TEXT_LIGHT, marginTop: 10, lineHeight: 1.5 }}>
          Per Lim et al. (2026): the case patient reached 0% skills practice in Week 6 and continued improving (paper interprets this as internalization). The specific polar values shown are illustrative.
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>The chart note (3–5 sentences)</Eyebrow>
        <TextArea
          value={r.note}
          onChange={(v) => setR({ ...r, note: v })}
          disabled={submitted}
          placeholder="What the clinician needs to know."
          minHeight={120}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Eyebrow>What you say to him directly in the closing session</Eyebrow>
        <TextArea
          value={r.toHim}
          onChange={(v) => setR({ ...r, toHim: v })}
          disabled={submitted}
          placeholder="Three or four sentences."
          minHeight={120}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SubmitBtn
          onClick={onSubmit}
          disabled={submitted}
          label="Submit"
          submittedLabel="Submitted"
        />
      </div>

      <SuggestedReveal show={submitted} title="Model closing — pending SME">
        <Placeholder note="A model chart note and a model 'what you say to him' closing, plus a self-assessment rubric for the trainee to compare their answer against, will be supplied by SME. The structure of the activity (separate clinical-register note for the clinician, separate plain-register summary for the patient) is sound. The model content needs grounding in DN training practice rather than interpretive content." />
      </SuggestedReveal>
    </ActivityWrap>
  );
}

// Yes/No row used inside the self-assessment checklist. Two pills, not a checkbox —
// forces an explicit choice (skipping a row leaves it unrated, not implicitly "no").
function ChecklistItem({ label, value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: `1px solid ${WARM_DIM}` }}>
      <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.5, flex: 1 }}>{label}</div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <TagButton
          label="Yes"
          selected={value === "yes"}
          onClick={() => onChange("yes")}
          color="teal"
          disabled={disabled}
        />
        <TagButton
          label="No"
          selected={value === "no"}
          onClick={() => onChange("no")}
          color="caution"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ============================================================
// Activity label map
// ============================================================
const ACTIVITY_LABELS = {
  "engagement-trajectory": {
    "gauge-read": "What's your first move?",
    "trajectory-mismatch": "Daily volatility, weekly stability",
  },
  "sleep-passive-active": {
    "sleep-read": "Naming the sleep pattern",
    "passive-active-story": "Telling the week's story",
  },
  "correlation-matrix": {
    "matrix-read": "Sorting the cells",
    "matrix-translate": "One cell, one sentence",
  },
  "polar-multidimensional": {
    "polar-read": "Reading the shape across time",
    "completion-summary": "The closing chart note",
  },
};

// ============================================================
// Shell components
// ============================================================
function ResetMenu({ onReset }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setMenuOpen(!menuOpen); setConfirming(false); }}
        style={{
          background: "transparent", border: "none", color: WHITE,
          cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
        }}
        aria-label="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {menuOpen && (
        <div style={{
          position: "absolute", top: 32, right: 0, background: WHITE,
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.15)",
          minWidth: 220, zIndex: 200, padding: 8,
        }}>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              style={{
                width: "100%", background: "transparent", border: "none",
                padding: "10px 12px", textAlign: "left", cursor: "pointer",
                fontSize: 13, color: TEXT, borderRadius: 6, fontFamily: "inherit",
              }}
            >
              Reset all progress
            </button>
          ) : (
            <div style={{ padding: 4 }}>
              <div style={{ fontSize: 12, color: TEXT_MID, marginBottom: 8, lineHeight: 1.5 }}>
                This will erase all your activity progress. Are you sure?
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={onReset}
                  style={{
                    flex: 1, padding: "8px 12px", background: CAUTION,
                    color: WHITE, border: "none", borderRadius: 6,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => { setConfirming(false); setMenuOpen(false); }}
                  style={{
                    flex: 1, padding: "8px 12px", background: WHITE,
                    color: NAVY, border: `1px solid ${WARM_DIM}`, borderRadius: 6,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Glossary
// ============================================================
const GLOSSARY = [
  {
    term: "Digital Navigator",
    short: "navigator",
    def: "The trained team member who supports the patient's use of the mindLAMP app and walks them through the weekly report. Not a clinician; works alongside the clinician with weekly check-ins.",
  },
  {
    term: "mindLAMP",
    def: "The open-source smartphone platform built by the Division of Digital Psychiatry at BIDMC that the Digital Clinic runs on. LAMP stands for Learn, Assess, Manage, Prevent. Collects active surveys, passive sensor data, and skill-practice activity. Full docs at docs.lamp.digital.",
  },
  {
    term: "EMA",
    expand: "Ecological Momentary Assessment",
    def: "Brief in-the-moment surveys delivered through the app. In this program, three single-item daily questions ask the patient to rate today's anxiety, mood, and ability to manage day-to-day life on simple scales. Different from the weekly PHQ-9 and GAD-7, which are longer validated instruments.",
  },
  {
    term: "PHQ-9",
    expand: "Patient Health Questionnaire–9",
    def: "Nine-item depression severity screener. Score range 0–27. Bands: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe. Completed weekly in the app.",
  },
  {
    term: "GAD-7",
    expand: "Generalized Anxiety Disorder–7",
    def: "Seven-item anxiety severity screener. Score range 0–21. Bands: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe. Completed weekly in the app.",
  },
  {
    term: "SDS",
    expand: "Sheehan Disability Scale",
    def: "Measures how much symptoms interfere with daily life. Score range 0–30. In the report, this is the 'difficulty functioning' axis on the symptom panel of the polar chart.",
  },
  {
    term: "Daily DF",
    expand: "Daily Difficulty Functioning",
    def: "The daily EMA item 'I am able to manage my day-to-day life.' Scored 0–4 in the app, but reversed in the report so higher = more difficulty (i.e., more symptomatic).",
  },
  {
    term: "ESA",
    expand: "Emotional Self-Awareness",
    def: "Positive-valence measure on the polar chart appendix. Higher is better. Tracks how well the patient identifies and understands their own emotions.",
  },
  {
    term: "PSS",
    expand: "Perceived Social Support",
    def: "Positive-valence measure on the polar chart appendix. Higher is better. Tracks the patient's sense of having people they can rely on.",
  },
  {
    term: "SE",
    expand: "Self-Efficacy",
    def: "Positive-valence measure on the polar chart appendix. Higher is better. Tracks the patient's belief in their own ability to handle challenges.",
  },
  {
    term: "Motivation",
    short: "Mot",
    def: "Positive-valence measure on the polar chart appendix, drawn from a validated motivation scale. Higher is better.",
  },
  {
    term: "DL",
    expand: "Digital Literacy",
    def: "Positive-valence measure on the polar chart appendix. Higher is better. Tracks the patient's comfort and skill with using digital tools, including the app.",
  },
  {
    term: "Passive data",
    def: "Sensor data collected continuously by the phone in the background without the patient doing anything — GPS-derived metrics (entropy, hometime), accelerometer-derived metrics (steps, sleep), and screen state (screen time, sleep). Contrast with active data (the surveys).",
  },
  {
    term: "Entropy",
    def: "A passive metric derived from GPS. High entropy means the patient spent time at many different locations across the day. Low entropy means they were in one or two places. Definitionally inverse to hometime.",
  },
  {
    term: "Hometime",
    def: "A passive metric. Hours the phone was at the patient's identified home location. Definitionally inverse to entropy.",
  },
  {
    term: "Spearman correlation",
    def: "The statistical method used in the report's correlation matrix. Ranks the values of each variable across the past week's days, then correlates the ranks. Robust to skewed distributions and captures monotonic but non-linear relationships. Values run from −1 to +1.",
  },
  {
    term: "Cortex",
    def: "The open-source Python pipeline developed by the Division of Digital Psychiatry that turns raw mindLAMP sensor streams into the metrics shown in the report (sleep estimates, step counts, entropy, etc.).",
  },
  {
    term: "Digital Clinic",
    def: "The eight-week virtual treatment program at BIDMC for adults with mild-to-moderate anxiety or depression, structured around weekly clinician sessions, weekly digital navigator sessions, and continuous app use.",
  },
  {
    term: "BIDMC",
    expand: "Beth Israel Deaconess Medical Center",
    def: "The teaching hospital affiliated with Harvard Medical School where the Division of Digital Psychiatry and the Digital Clinic are based.",
  },
];

function GlossaryPanel({ open, onClose }) {
  const [query, setQuery] = useState("");
  if (!open) return null;
  const q = query.toLowerCase().trim();
  const filtered = q
    ? GLOSSARY.filter(g =>
        g.term.toLowerCase().includes(q) ||
        (g.expand && g.expand.toLowerCase().includes(q)) ||
        g.def.toLowerCase().includes(q)
      )
    : GLOSSARY;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(26,39,68,.35)", zIndex: 150,
        }}
      />
      {/* Slide-down panel */}
      <div style={{
        position: "fixed", top: 56, right: 12, width: "min(420px, calc(100% - 24px))",
        maxHeight: "calc(100vh - 80px)",
        background: WHITE, borderRadius: 12,
        boxShadow: "0 8px 32px rgba(26,39,68,.20)",
        zIndex: 160, display: "flex", flexDirection: "column",
        animation: "fadeIn .2s ease",
      }}>
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid ${WARM_DIM}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_LIGHT, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Glossary
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginTop: 2 }}>
              Terms used in the report
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close glossary"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, color: TEXT_LIGHT, display: "flex", alignItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "10px 18px", borderBottom: `1px solid ${WARM_DIM}` }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms or definitions..."
            style={{
              width: "100%", padding: "8px 12px",
              border: `1.5px solid ${WARM_DIM}`, borderRadius: 8,
              fontSize: 13, fontFamily: "inherit",
              boxSizing: "border-box", background: WHITE, color: TEXT,
            }}
            autoFocus
          />
        </div>
        <div style={{ overflowY: "auto", padding: "8px 0", flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ padding: "16px 18px", fontSize: 13, color: TEXT_LIGHT, fontStyle: "italic" }}>
              No matches.
            </div>
          )}
          {filtered.map((g) => (
            <div key={g.term} style={{ padding: "10px 18px", borderBottom: `1px solid ${WARM_DIM}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                {g.term}
                {g.expand && (
                  <span style={{ fontSize: 12, fontWeight: 500, color: TEXT_LIGHT, marginLeft: 8 }}>
                    {g.expand}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.6, marginTop: 4 }}>
                {g.def}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Topbar({ showCount, completedCount, onReset }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  return (
    <>
      <div style={{
        background: NAVY, color: WHITE, padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, background: TEAL, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 4 4 5-7" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Navigator Report Training
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => setGlossaryOpen(true)}
            style={{
              background: "transparent", border: `1px solid rgba(255,255,255,.25)`,
              color: WHITE, fontSize: 11, fontWeight: 600,
              padding: "5px 10px", borderRadius: 14, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: ".04em",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Glossary
          </button>
          {showCount && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              {completedCount}/{modules.length} completed
            </div>
          )}
          {onReset && <ResetMenu onReset={onReset} />}
        </div>
      </div>
      <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </>
  );
}

function Footer() {
  return (
    <div style={{
      background: NAVY, color: "rgba(255,255,255,.6)",
      textAlign: "center", padding: "22px 20px",
      fontSize: 11, lineHeight: 1.7, marginTop: "auto",
    }}>
      <strong style={{ color: "rgba(255,255,255,.9)" }}>Navigator Report Reading Training</strong><br />
      Division of Digital Psychiatry<br />
      Beth Israel Deaconess Medical Center / Harvard Medical School
    </div>
  );
}

function ProgressBar({ completedCount }) {
  const pct = (completedCount / modules.length) * 100;
  return (
    <div style={{ height: 4, background: WARM_DIM, position: "sticky", top: 56, zIndex: 99 }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: `linear-gradient(90deg, ${TEAL}, ${GOLD})`,
        transition: "width .3s",
      }} />
    </div>
  );
}

function ModuleOrientation({ moduleObj, completedActivities }) {
  const acts = moduleObj.activities;
  const labels = ACTIVITY_LABELS[moduleObj.id] || {};

  return (
    <div style={{
      background: `linear-gradient(135deg, ${TEAL_LIGHT} 0%, ${WARM} 100%)`,
      border: `1px solid ${WARM_DIM}`,
      borderRadius: 14, padding: 22, marginBottom: 24,
    }}>
      <div style={{ display: "inline-block", padding: "4px 12px", background: WHITE, borderRadius: 14, fontSize: 11, fontWeight: 700, color: TEAL_DARK, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>
        Phase: {moduleObj.sdt}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{moduleObj.label}</div>
      <div style={{ fontSize: 13, color: TEXT_MID, lineHeight: 1.6, marginBottom: 18 }}>{moduleObj.sdtBlurb}</div>

      <div style={{ background: WHITE, borderRadius: 10, padding: 14 }}>
        <Eyebrow>Activities in this module</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {acts.map((aid) => {
            const done = completedActivities.has(aid);
            return (
              <div key={aid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `1.5px solid ${done ? TEAL : WARM_DIM}`,
                  background: done ? TEAL : WHITE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 13, color: done ? TEXT : TEXT_MID, lineHeight: 1.4, textDecoration: done ? "line-through" : "none" }}>
                  {labels[aid] || aid}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Landing({ onStart, hasProgress, onReset }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: WARM, fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Topbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 20px 40px", flex: 1, width: "100%" }}>
        <Eyebrow>For Digital Navigators</Eyebrow>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginTop: 6, marginBottom: 16 }}>
          Reading and Discussing the Weekly Data Report
        </h1>
        <Prose>
          A four-module training on the visualizations that come out of the weekly data report — engagement gauges, symptom trajectories, sleep bars, passive-active integration, correlation matrices, and polar charts — and how to discuss them with a patient across the eight weeks of the Digital Clinic program.
        </Prose>
        <Prose>
          The reports are generated from data collected through <strong style={{ color: NAVY }}>mindLAMP</strong>, the open-source smartphone platform built at the Division of Digital Psychiatry. LAMP stands for <em>Learn, Assess, Manage, Prevent</em>; the app collects active surveys, passive sensor data, and skill-practice activity in one place. Full platform documentation is at <a href="https://docs.lamp.digital" target="_blank" rel="noopener noreferrer" style={{ color: TEAL_DARK, fontWeight: 600 }}>docs.lamp.digital</a>.
        </Prose>
        <Prose>
          The training walks through a single anonymized case (a graduate student with anxiety, drawn from <a href="https://jopm.jmir.org/2026/1/e90255" target="_blank" rel="noopener noreferrer" style={{ color: TEAL_DARK, fontWeight: 600 }}>Lim et al., 2026</a>) from intake to closing. Each module focuses on a different page of his report and a different phase of the navigator's role: guide, refinement, and autonomy.
        </Prose>
        <Prose style={{ fontSize: 12, color: TEXT_LIGHT, marginTop: -4 }}>
          A glossary of every acronym and term used in the report is available from the top bar at any point.
        </Prose>

        <div style={{ marginTop: 20, marginBottom: 24, padding: 20, background: WHITE, borderRadius: 12, border: `1px solid ${WARM_DIM}` }}>
          <Eyebrow>What you'll do</Eyebrow>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, color: TEXT_MID, lineHeight: 1.8 }}>
            <li>Read each of the six core visualization types accurately</li>
            <li>Practice translating numbers into plain-English observations a patient can use</li>
            <li>Work through the case patient's reports week by week — Weeks 2, 4, and 8</li>
            <li>Write a closing chart note</li>
          </ul>
        </div>

        <button
          onClick={onStart}
          style={{
            padding: "14px 28px", background: TEAL, color: WHITE,
            border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 2px 12px rgba(42,157,143,.3)`,
          }}
        >
          {hasProgress ? "Resume training" : "Start training"}
        </button>
        {hasProgress && (
          <button
            onClick={onReset}
            style={{
              marginLeft: 12, padding: "14px 22px", background: WHITE,
              color: NAVY, border: `1.5px solid ${WARM_DIM}`, borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Start over
          </button>
        )}
      </div>
      <Footer />
    </div>
  );
}

function ModuleBody({ moduleObj, completedActivities }) {
  if (moduleObj.id === "engagement-trajectory") {
    return (
      <>
        <ModuleOrientation moduleObj={moduleObj} completedActivities={completedActivities} />
        <Module1Concepts />
        <GaugeReadActivity />
        <TrajectoryMismatchActivity />
      </>
    );
  }
  if (moduleObj.id === "sleep-passive-active") {
    return (
      <>
        <ModuleOrientation moduleObj={moduleObj} completedActivities={completedActivities} />
        <Module2Concepts />
        <SleepReadActivity />
        <PassiveActiveStoryActivity />
      </>
    );
  }
  if (moduleObj.id === "correlation-matrix") {
    return (
      <>
        <ModuleOrientation moduleObj={moduleObj} completedActivities={completedActivities} />
        <Module3Concepts />
        <MatrixReadActivity />
        <MatrixTranslateActivity />
      </>
    );
  }
  if (moduleObj.id === "polar-multidimensional") {
    return (
      <>
        <ModuleOrientation moduleObj={moduleObj} completedActivities={completedActivities} />
        <Module4Concepts />
        <PolarReadActivity />
        <CompletionSummaryActivity />
      </>
    );
  }
  return null;
}

// ============================================================
// App
// ============================================================
export default function App() {
  const [screen, setScreen] = usePersistentActivity("__screen", "landing");
  const [currentModule, setCurrentModule] = usePersistentActivity("__currentModule", 0);
  const [completed, setCompleted] = usePersistentActivity("__moduleCompleted", new Set());
  const [activityTick, setActivityTick] = useState(0);

  // Polling for activity completion updates
  useEffect(() => {
    const onFocus = () => setActivityTick((t) => t + 1);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
      const interval = window.setInterval(() => setActivityTick((t) => t + 1), 1500);
      return () => {
        window.removeEventListener("focus", onFocus);
        window.clearInterval(interval);
      };
    }
  }, []);

  const completedSet = completed instanceof Set ? completed : new Set(completed?.__set || []);

  const onReset = useCallback(() => {
    clearAllProgress();
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  if (screen === "landing") {
    return (
      <Landing
        onStart={() => {
          setScreen("training");
          if (!(completedSet.size > 0 || hasAnyActivityProgress())) {
            setCurrentModule(0);
          }
        }}
        hasProgress={completedSet.size > 0 || hasAnyActivityProgress()}
        onReset={onReset}
      />
    );
  }

  const m = modules[currentModule] || modules[0];
  const completedActivitiesForCurrent = getCompletedActivities(m.id);
  void activityTick;

  const markComplete = () => {
    const next = new Set(completedSet);
    next.add(m.id);
    setCompleted(next);
    if (currentModule < modules.length - 1) {
      setCurrentModule(currentModule + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Last module — go back to landing or stay
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: WARM, fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Topbar showCount completedCount={completedSet.size} onReset={onReset} />
      <ProgressBar completedCount={completedSet.size} />

      {/* Module pill nav */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${WARM_DIM}`, padding: "12px 20px", position: "sticky", top: 60, zIndex: 98 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginRight: 4 }}>
            Module {currentModule + 1} of {modules.length}
          </span>
          {modules.map((mod, i) => {
            const isActive = i === currentModule;
            const isDone = completedSet.has(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => { setCurrentModule(i); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{
                  padding: "6px 12px", borderRadius: 20,
                  border: `1.5px solid ${isActive ? TEAL : WARM_DIM}`,
                  background: isActive ? TEAL_LIGHT : isDone ? WARM : WHITE,
                  color: isActive ? TEAL_DARK : isDone ? TEXT_MID : TEXT_LIGHT,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isDone ? "✓ " : ""}{mod.short}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px", flex: 1, width: "100%" }}>
        <ModuleBody moduleObj={m} completedActivities={completedActivitiesForCurrent} />

        {/* Bottom nav */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 12, flexWrap: "wrap" }}>
          {currentModule > 0 ? (
            <button
              onClick={() => { setCurrentModule(currentModule - 1); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{
                padding: "12px 22px", background: WHITE, color: NAVY,
                border: `1.5px solid ${WARM_DIM}`, borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ← Previous module
            </button>
          ) : <div />}
          <button
            onClick={markComplete}
            style={{
              padding: "12px 26px", background: TEAL, color: WHITE,
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {currentModule < modules.length - 1 ? "Mark complete & next →" : "Mark complete"}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
