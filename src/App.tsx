import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  Search,
  Users,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  Plus,
  ArrowUpRight,
  Download,
  ChevronRight,
  Globe,
  Check,
  LoaderCircle,
  ShieldCheck,
  SlidersHorizontal,
  ExternalLink,
  RefreshCw,
  PanelLeftClose,
  TriangleAlert,
  X,
  Save,
  Sparkles,
} from "lucide-react";
import type { SeoReport } from "./pro/types";
import { exportJSON } from "./pro/download";
import LegacyAudit from "./LegacyAudit";
import "./pro/studio.css";
import { studioApi as api, isVercelRuntime } from "./pro/client-api";
import SessionKeyPanel from "./pro/SessionKeyPanel";
import { hasSessionKey, subscribeSessionKey } from "./pro/session-key";
const icons = {
  Overview: LayoutDashboard,
  Issues: ShieldCheck,
  Keywords: Search,
  Competitors: Users,
  "Action plan": ClipboardCheck,
  Progress: ChartNoAxesCombined,
  Reports: FileText,
};
const palette = ["#7259ed", "#38b5b2", "#f5af4c", "#ec6f88"];
function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`s-tag ${tone}`}>{children}</span>;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="s-empty">
      <Search size={30} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
function ChartBox({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="s-card">
      <div className="s-card-head">
        <div>
          <h3>{title}</h3>
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
const date = (s: string) =>
  new Date(s).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export default function App() {
  const [reports, setReports] = useState<SeoReport[]>([]),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("Overview"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [newOpen, setNewOpen] = useState(false),
    [config, setConfig] = useState<any>({}),
    [legacy, setLegacy] = useState(false),
    [filter, setFilter] = useState(""),
    [notice, setNotice] = useState("");
  async function exportPDF(report: SeoReport) {
    try {
      const module = await import("./pro/export");
      module.exportPDF(report);
    } catch {
      setError("PDF export failed. Please retry or use JSON export.");
    }
  }
  const [form, setForm] = useState({
    client: "",
    url: "",
    location: "Long Island, NY",
    focus: "",
    maxPages: 3,
    useAI: true,
    agency: "SEO Analytic",
    preparedBy: isVercelRuntime ? "" : "Debashis Dey",
    fee: "",
    html: "",
  });
  const [rank, setRank] = useState({
    keyword: "",
    date: new Date().toISOString().slice(0, 10),
    position: "",
    source: "Search Console",
  });
  const [notes, setNotes] = useState("");
  const [branding, setBranding] = useState({
    agency: "",
    preparedBy: "",
    fee: "",
  });
  const report = reports.find((r) => r.id === selected) || reports[0];
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        api("/api/reports"),
        api("/api/config"),
      ]);
      setReports(a.reports);
      setConfig(b);
      if (a.reports.length && !selected) setSelected(a.reports[0].id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    if (isVercelRuntime)
      return subscribeSessionKey(() =>
        setConfig((old: any) => ({ ...old, aiConfigured: hasSessionKey() })),
      );
  }, []);
  useEffect(() => {
    if (report) {
      setNotes(report.notes);
      setBranding({
        agency: report.agency,
        preparedBy: report.preparedBy,
        fee: report.fee === null ? "" : String(report.fee),
      });
    }
  }, [report?.id, report?.revision]);
  async function patch(changes: any) {
    if (!report || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = await api("/api/reports/" + report.id, "PATCH", {
        revision: report.revision,
        ...changes,
      });
      setReports((old) =>
        old.map((r) => (r.id === d.report.id ? d.report : r)),
      );
      setNotice("Changes saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = await api("/api/reports", "POST", {
        ...form,
        fee: form.fee === "" ? null : Number(form.fee),
        html: form.html || undefined,
      });
      setReports((old) => [d.report, ...old]);
      setSelected(d.report.id);
      setNewOpen(false);
      setTab("Overview");
      setNotice("Report saved. Review the findings before client delivery.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const average = report?.pages.length
    ? Math.round(
        report.pages.reduce((n, p) => n + p.score, 0) / report.pages.length,
      )
    : 0;
  const done = report?.tasks.filter((t) => t.status === "done").length || 0;
  const issues = report?.strategy?.issues || [];
  const keywords = report?.strategy?.keywordPlan || [];
  const competitors = report?.strategy?.competitors || [];
  const breakdown = report?.pages[0]
    ? Object.entries(report.pages[0].scores).map(([name, s], i) => ({
        name: ["On-page", "Content", "Technical", "Accessibility"][i],
        score: Math.round((s.score / [25, 25, 30, 20][i]) * 100),
      }))
    : [];
  const severity = ["Critical", "High", "Medium", "Low"]
    .map((name) => ({
      name,
      value: issues.filter((i) => i.severity === name).length,
    }))
    .filter((x) => x.value);
  const history = reports
    .filter(
      (r) => report && new URL(r.url).hostname === new URL(report.url).hostname,
    )
    .slice()
    .reverse()
    .map((r) => ({
      date: date(r.createdAt),
      score: Math.round(
        r.pages.reduce((n, p) => n + p.score, 0) / (r.pages.length || 1),
      ),
    }));
  const selectedKeyword = rank.keyword || report?.rankings[0]?.keyword || "";
  const observations = (report?.rankings || [])
    .filter((k) => k.keyword === selectedKeyword)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const headerActions = (
    <>
      <button className="s-btn" onClick={() => setNewOpen(true)}>
        <Plus size={16} /> New report
      </button>
      {report && (
        <button className="s-btn primary" onClick={() => exportPDF(report)}>
          <Download size={16} /> Download PDF
        </button>
      )}
    </>
  );
  if (legacy)
    return (
      <>
        <button className="s-legacy-back" onClick={() => setLegacy(false)}>
          ← Return to reporting workspace
        </button>
        <LegacyAudit />
      </>
    );
  return (
    <div className="studio">
      <aside className="s-sidebar">
        <div className="s-brand">
          <div className="s-brand-icon">
            <ChartNoAxesCombined size={24} />
          </div>
          <span>
            SEO Analytic<small>REPORTING STUDIO</small>
          </span>
        </div>
        <div className="s-workspace">
          <div className="s-avatar">{isVercelRuntime ? "SA" : "DD"}</div>
          <div>
            {isVercelRuntime ? "Your workspace" : "Debashis Dey"}
            <small>
              {isVercelRuntime
                ? "Reports in this browser"
                : "Private workspace"}
            </small>
          </div>
          <ShieldCheck size={15} />
        </div>
        <div className="s-nav-label">WORKSPACE</div>
        <nav>
          {Object.entries(icons).map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => {
                setTab(name);
                setFilter("");
              }}
            >
              <Icon size={19} />
              {name}
              {name === "Issues" && issues.length > 0 && (
                <span>{issues.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="s-side-bottom">
          <div className="s-model">
            <Sparkles size={19} />
            <div>
              Muse Spark 1.3
              <small>
                {config.aiConfigured
                  ? isVercelRuntime
                    ? "Session key active"
                    : "Server key connected"
                  : "AI setup required"}
              </small>
            </div>
            <span className={config.aiConfigured ? "s-dot" : ""} />
          </div>
          <button onClick={() => setLegacy(true)}>
            Open free HTML checker <ArrowUpRight size={15} />
          </button>
        </div>
      </aside>
      <div className="s-main">
        <header className="s-topbar">
          <div className="s-breadcrumb">
            Workspace <ChevronRight size={14} /> <strong>{tab}</strong>
          </div>
          <div className="s-top-actions">
            <span className="s-private">
              <ShieldCheck size={15} />{" "}
              {isVercelRuntime ? "Saved in this browser" : "Private"}
            </span>
            <div className="s-avatar small">
              {isVercelRuntime ? "SA" : "DD"}
            </div>
          </div>
        </header>
        <main className="s-body">
          <div className="s-page-title">
            <div>
              <div className="s-eyebrow">CLIENT INTELLIGENCE</div>
              <h1>
                {tab === "Overview" ? "A clearer path to organic growth." : tab}
              </h1>
              <p>
                {tab === "Overview"
                  ? "From page evidence to a plan your clients can act on."
                  : "Evidence, priorities and accountable follow-through."}
              </p>
            </div>
            <div className="s-actions">{headerActions}</div>
          </div>
          {isVercelRuntime && <SessionKeyPanel />}
          {isVercelRuntime && (
            <p className="s-storage-note">
              Reports and progress stay in this browser. Export JSON or PDF for
              a backup before clearing site data.
            </p>
          )}
          {error && (
            <div role="alert" className="s-alert">
              <TriangleAlert size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="s-notice">
              <Check size={16} />
              {notice}
            </div>
          )}
          {loading ? (
            <div className="s-loading">
              <LoaderCircle className="spin" /> Loading your reports…
            </div>
          ) : !report ? (
            <Empty
              title="Your next client report starts here"
              detail="Choose New report to audit a website, research competitors and build an action plan."
            />
          ) : (
            <>
              <section className="s-client-strip">
                <div className="s-client-symbol">
                  <Globe size={23} />
                </div>
                <div>
                  <label htmlFor="client-select">CURRENT CLIENT REPORT</label>
                  <select
                    id="client-select"
                    value={report.id}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {reports.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.client} · {date(r.createdAt)}
                      </option>
                    ))}
                  </select>
                  <a href={report.url} target="_blank" rel="noreferrer">
                    {new URL(report.url).hostname} <ExternalLink size={11} />
                  </a>
                </div>
                <div className="s-client-meta">
                  <span>{report.location}</span>
                  <small>Audited {date(report.createdAt)}</small>
                </div>
                <Tag tone={report.state === "draft" ? "amber" : "teal"}>
                  {report.state === "draft"
                    ? "Consultant review needed"
                    : report.state}
                </Tag>
              </section>
              {tab === "Overview" && (
                <>
                  <div className="s-metrics">
                    <div className="s-metric">
                      <span>HTML checklist</span>
                      <strong>
                        {average}
                        <small>/100</small>
                      </strong>
                      <p>
                        {report.pages.length} sampled pages · not a ranking
                        score
                      </p>
                      <div className="s-mini-track">
                        <span style={{ width: average + "%" }} />
                      </div>
                    </div>
                    <div className="s-metric">
                      <span>Priority findings</span>
                      <strong>
                        {issues.length ||
                          report.pages.reduce(
                            (n, p) =>
                              n + p.checks.filter((c) => !c.passed).length,
                            0,
                          )}
                      </strong>
                      <p>
                        {
                          issues.filter((i) =>
                            ["Critical", "High"].includes(i.severity),
                          ).length
                        }{" "}
                        high or critical AI recommendations
                      </p>
                      <Tag tone="amber">Review evidence</Tag>
                    </div>
                    <div className="s-metric">
                      <span>Keyword opportunities</span>
                      <strong>{keywords.length}</strong>
                      <p>Intent and page mapping</p>
                      <Tag tone="purple">AI strategy · no volume estimates</Tag>
                    </div>
                    <div className="s-metric">
                      <span>Action plan complete</span>
                      <strong>
                        {report.tasks.length
                          ? Math.round((done / report.tasks.length) * 100)
                          : 0}
                        <small>%</small>
                      </strong>
                      <p>
                        {done} of {report.tasks.length} actions marked done
                      </p>
                      <div className="s-mini-track teal">
                        <span
                          style={{
                            width:
                              (report.tasks.length
                                ? (done / report.tasks.length) * 100
                                : 0) + "%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="s-grid two">
                    <ChartBox
                      title="Where the HTML foundation stands"
                      sub="Homepage checklist categories, normalized to 100"
                    >
                      <div
                        className="s-chart"
                        role="img"
                        aria-label={breakdown
                          .map((x) => x.name + ": " + x.score + " percent")
                          .join(", ")}
                      >
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart
                            data={breakdown}
                            layout="vertical"
                            margin={{ left: 6, right: 30 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={false}
                            />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={92}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip />
                            <Bar
                              dataKey="score"
                              fill="#7259ed"
                              radius={[0, 5, 5, 0]}
                              barSize={19}
                            >
                              {breakdown.map((_, i) => (
                                <Cell fill={palette[i]} key={i} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </ChartBox>
                    <ChartBox
                      title="Consultant’s executive brief"
                      sub={
                        report.aiStatus === "complete"
                          ? "Muse Spark 1.3 · web-assisted research"
                          : "HTML evidence available"
                      }
                    >
                      <p className="s-summary">
                        {report.strategy?.summary ||
                          "The measured audit is saved. AI strategy was unavailable; review the warnings below."}
                      </p>
                      <button
                        className="s-text-btn"
                        onClick={() => setTab("Action plan")}
                      >
                        View the 90-day plan <ArrowUpRight size={15} />
                      </button>
                    </ChartBox>
                  </div>
                  <div className="s-grid two">
                    <ChartBox
                      title="Start with these improvements"
                      sub="Prioritized recommendations to review"
                    >
                      <div className="s-findings">
                        {issues.slice(0, 4).map((i, n) => (
                          <button key={n} onClick={() => setTab("Issues")}>
                            <span className="s-find-number">
                              {String(n + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <h4>{i.title}</h4>
                              <p>
                                {i.category} · {i.effort} effort
                              </p>
                            </div>
                            <Tag
                              tone={
                                ["Critical", "High"].includes(i.severity)
                                  ? "rose"
                                  : "amber"
                              }
                            >
                              {i.severity}
                            </Tag>
                          </button>
                        ))}
                      </div>
                    </ChartBox>
                    <ChartBox
                      title="Crawl coverage"
                      sub="A focused sample, not a full-site crawl"
                    >
                      <div className="s-page-list">
                        {report.pages.map((p) => (
                          <div key={p.url}>
                            <FileText size={17} />
                            <div>
                              <strong>{p.title || "Untitled page"}</strong>
                              <a href={p.url} target="_blank" rel="noreferrer">
                                {new URL(p.url).pathname}
                              </a>
                            </div>
                            <Tag tone="purple">{p.score}/100</Tag>
                          </div>
                        ))}
                      </div>
                      <p className="s-footnote">
                        Robots: {report.technical.robotsStatus ?? "Unavailable"}{" "}
                        · Sitemap:{" "}
                        {report.technical.sitemapStatus ?? "Unavailable"} · Core
                        Web Vitals: not measured
                      </p>
                    </ChartBox>
                  </div>
                </>
              )}
              {tab === "Issues" && (
                <>
                  <div className="s-section-line">
                    <h2>Findings that deserve attention</h2>
                    <input
                      aria-label="Filter findings"
                      className="s-search"
                      placeholder="Filter findings…"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <div className="s-grid two">
                    {issues
                      .filter((i) =>
                        (i.title + " " + i.category)
                          .toLowerCase()
                          .includes(filter.toLowerCase()),
                      )
                      .map((i, n) => (
                        <section className="s-card s-issue" key={n}>
                          <div className="s-card-head">
                            <Tag
                              tone={
                                ["Critical", "High"].includes(i.severity)
                                  ? "rose"
                                  : "amber"
                              }
                            >
                              {i.severity}
                            </Tag>
                            <span className="s-muted">
                              {i.category} · {i.effort}
                            </span>
                          </div>
                          <h3>{i.title}</h3>
                          <label>EVIDENCE / REVIEW BASIS</label>
                          <p>{i.evidence}</p>
                          <div className="s-recommendation">
                            <strong>Recommended fix</strong>
                            <p>{i.suggestion}</p>
                          </div>
                          {i.sourceUrl && (
                            <a
                              className="s-text-btn"
                              href={i.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Review source <ExternalLink size={14} />
                            </a>
                          )}
                        </section>
                      ))}
                  </div>
                  <ChartBox
                    title="Every measured HTML check"
                    sub="Expand a page to inspect pass/fail evidence"
                  >
                    {report.pages.map((p) => (
                      <details className="s-details" key={p.url}>
                        <summary>
                          {p.title} · {p.score}/100
                        </summary>
                        {p.checks.map((c) => (
                          <div className="s-check-row" key={c.id}>
                            <Tag tone={c.passed ? "teal" : "amber"}>
                              {c.passed ? "Pass" : "Review"}
                            </Tag>
                            <div>
                              <strong>{c.title}</strong>
                              <p>{c.evidence}</p>
                              <small>{c.suggestion}</small>
                            </div>
                          </div>
                        ))}
                      </details>
                    ))}
                  </ChartBox>
                </>
              )}
              {tab === "Keywords" && (
                <>
                  <div className="s-section-line">
                    <div>
                      <h2>Map intent to a useful page</h2>
                      <p>
                        Editorial opportunities. Search volume and difficulty
                        have not been measured.
                      </p>
                    </div>
                    <input
                      className="s-search"
                      aria-label="Filter keywords"
                      placeholder="Search keywords…"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <section className="s-card s-table-wrap">
                    <table className="s-table">
                      <thead>
                        <tr>
                          <th>Keyword / cluster</th>
                          <th>Intent</th>
                          <th>Priority</th>
                          <th>Target page</th>
                          <th>Next action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywords
                          .filter((k) =>
                            (k.keyword + " " + k.cluster)
                              .toLowerCase()
                              .includes(filter.toLowerCase()),
                          )
                          .map((k, n) => (
                            <tr key={n}>
                              <td>
                                <strong>{k.keyword}</strong>
                                <small>{k.cluster}</small>
                              </td>
                              <td>{k.intent}</td>
                              <td>
                                <Tag
                                  tone={
                                    k.priority === "High" ? "purple" : "neutral"
                                  }
                                >
                                  {k.priority}
                                </Tag>
                              </td>
                              <td className="s-target">{k.targetPage}</td>
                              <td>
                                <strong>{k.action}</strong>
                                <small>{k.reasoning}</small>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!keywords.length && (
                      <Empty
                        title="No keyword strategy yet"
                        detail="Create a report with AI research enabled to build a page and keyword plan."
                      />
                    )}
                  </section>
                  <ChartBox
                    title="Terms actually found on the homepage"
                    sub="Frequency in extracted body text, not search demand"
                  >
                    <div className="s-chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={report.pages[0]?.terms.slice(0, 9) || []}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis dataKey="word" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="count"
                            fill="#38b5b2"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartBox>
                </>
              )}
              {tab === "Competitors" && (
                <>
                  <div className="s-section-line">
                    <div>
                      <h2>The competitive landscape</h2>
                      <p>
                        Public-web research based on overlapping services and
                        geography. These are not measured SERP rankings.
                      </p>
                    </div>
                    <Tag tone="purple">
                      {competitors.length} research candidates
                    </Tag>
                  </div>
                  <div className="s-grid two">
                    {competitors.map((c, n) => (
                      <section className="s-card s-competitor" key={n}>
                        <div className="s-competitor-head">
                          <div className="s-site-icon">
                            {c.name.slice(0, 1)}
                          </div>
                          <div>
                            <h3>{c.name}</h3>
                            <a href={c.url} target="_blank" rel="noreferrer">
                              {new URL(c.url).hostname}{" "}
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                        <p>{c.whyRelevant}</p>
                        <div className="s-competitor-insight">
                          <label>POSITIONING TO STUDY</label>
                          <p>{c.strength}</p>
                        </div>
                        <div className="s-recommendation">
                          <strong>Your opportunity</strong>
                          <p>{c.opportunity}</p>
                        </div>
                        <a
                          className="s-text-btn"
                          href={c.sourceUrl || c.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Verify source before delivery{" "}
                          <ArrowUpRight size={14} />
                        </a>
                      </section>
                    ))}
                  </div>
                  {!competitors.length && (
                    <Empty
                      title="Competitor research is unavailable"
                      detail="Run an AI report to research relevant competitors. Candidate sources must be reviewed before client delivery."
                    />
                  )}
                  <ChartBox
                    title="Research sources"
                    sub="Inspect the underlying pages; AI-cited links may require independent verification"
                  >
                    <div className="s-sources">
                      {report.sources.map((s, n) => (
                        <a
                          key={n}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {s.title || new URL(s.url).hostname}
                          <ExternalLink size={13} />
                        </a>
                      ))}
                    </div>
                  </ChartBox>
                </>
              )}
              {tab === "Action plan" && (
                <>
                  <div className="s-roadmap">
                    {report.strategy?.roadmap.map((r, n) => (
                      <section className="s-card" key={n}>
                        <Tag tone="purple">{r.phase}</Tag>
                        <h3>{r.title}</h3>
                        <ul>
                          {r.actions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                        <div className="s-recommendation">
                          <strong>Success measure</strong>
                          <p>{r.successMetric}</p>
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="s-section-line">
                    <h2>Content briefs ready for planning</h2>
                    <Tag>
                      {report.strategy?.contentPlan.length || 0} proposed pages
                      / articles
                    </Tag>
                  </div>
                  <div className="s-grid two">
                    {report.strategy?.contentPlan.map((c, n) => (
                      <section className="s-card" key={n}>
                        <Tag tone="teal">{c.pageType}</Tag>
                        <h3>{c.title}</h3>
                        <p className="s-muted">
                          Primary keyword: <strong>{c.primaryKeyword}</strong>
                        </p>
                        <ol>
                          {c.outline.map((o, i) => (
                            <li key={i}>{o}</li>
                          ))}
                        </ol>
                        <div className="s-recommendation">
                          <strong>Call to action</strong>
                          <p>{c.cta}</p>
                        </div>
                      </section>
                    ))}
                  </div>
                  <ChartBox
                    title="Suggested homepage copy"
                    sub="Review brand voice and factual claims before publishing"
                  >
                    <dl className="s-copy">
                      <dt>Page title</dt>
                      <dd>
                        {report.strategy?.optimized.title || "Not generated"}
                      </dd>
                      <dt>Meta description</dt>
                      <dd>
                        {report.strategy?.optimized.metaDescription ||
                          "Not generated"}
                      </dd>
                      <dt>Main heading</dt>
                      <dd>
                        {report.strategy?.optimized.h1 || "Not generated"}
                      </dd>
                    </dl>
                  </ChartBox>
                </>
              )}
              {tab === "Progress" && (
                <>
                  <div className="s-grid two">
                    <ChartBox
                      title="Checklist history"
                      sub="Saved reports for the same hostname"
                    >
                      {history.length > 1 ? (
                        <div className="s-chart">
                          <ResponsiveContainer width="100%" height={230}>
                            <AreaChart data={history}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Area
                                dataKey="score"
                                stroke="#7259ed"
                                fill="#eeeaff"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Empty
                          title="Baseline established"
                          detail={`Current checklist: ${average}/100. Create another report later to compare actual audit snapshots.`}
                        />
                      )}
                    </ChartBox>
                    <ChartBox
                      title="Delivery progress"
                      sub="Tasks marked complete by your team"
                    >
                      <div className="s-progress-ring">
                        <div>
                          <strong>
                            {done}
                            <small> / {report.tasks.length}</small>
                          </strong>
                          <p>actions completed</p>
                        </div>
                        <div className="s-chart">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Done", value: done },
                                  {
                                    name: "Remaining",
                                    value: report.tasks.length - done,
                                  },
                                ]}
                                dataKey="value"
                                innerRadius={65}
                                outerRadius={85}
                                startAngle={90}
                                endAngle={-270}
                              >
                                <Cell fill="#38b5b2" />
                                <Cell fill="#eceef5" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </ChartBox>
                  </div>
                  <section className="s-card s-table-wrap">
                    <div className="s-card-head">
                      <h3>Implementation tracker</h3>
                      <span className="s-muted">Saved across sessions</span>
                    </div>
                    <table className="s-table">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Priority</th>
                          <th>Due date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.tasks.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <strong>{t.title}</strong>
                              <small>{t.notes}</small>
                            </td>
                            <td>
                              <Tag
                                tone={
                                  t.priority === "High" ? "rose" : "neutral"
                                }
                              >
                                {t.priority}
                              </Tag>
                            </td>
                            <td>
                              <input
                                aria-label={"Due date for " + t.title}
                                type="date"
                                value={t.dueDate}
                                disabled={busy}
                                onChange={(e) =>
                                  void patch({
                                    task: { id: t.id, dueDate: e.target.value },
                                  })
                                }
                              />
                            </td>
                            <td>
                              <select
                                aria-label={"Status for " + t.title}
                                value={t.status}
                                disabled={busy}
                                onChange={(e) =>
                                  void patch({
                                    task: { id: t.id, status: e.target.value },
                                  })
                                }
                              >
                                <option value="todo">To do</option>
                                <option value="in_progress">In progress</option>
                                <option value="done">Done</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                  <ChartBox
                    title="Record observed keyword positions"
                    sub="Enter observations from Search Console, a SERP tool, or a manual check. No rankings are generated by AI."
                  >
                    <form
                      className="s-rank-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void patch({
                          ranking: { ...rank, position: Number(rank.position) },
                        });
                      }}
                    >
                      <label>
                        Keyword
                        <input
                          required
                          value={rank.keyword}
                          onChange={(e) =>
                            setRank({ ...rank, keyword: e.target.value })
                          }
                          placeholder="solar installers long island"
                          list="rank-keywords"
                        />
                        <datalist id="rank-keywords">
                          {[
                            ...new Set(report.rankings.map((k) => k.keyword)),
                          ].map((k) => (
                            <option key={k} value={k} />
                          ))}
                        </datalist>
                      </label>
                      <label>
                        Date
                        <input
                          type="date"
                          required
                          value={rank.date}
                          onChange={(e) =>
                            setRank({ ...rank, date: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Position
                        <input
                          required
                          type="number"
                          min="1"
                          max="1000"
                          step="0.1"
                          value={rank.position}
                          onChange={(e) =>
                            setRank({ ...rank, position: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Source
                        <select
                          value={rank.source}
                          onChange={(e) =>
                            setRank({ ...rank, source: e.target.value })
                          }
                        >
                          <option>Search Console</option>
                          <option>SERP tool</option>
                          <option>Manual observation</option>
                        </select>
                      </label>
                      <button className="s-btn primary" disabled={busy}>
                        <Plus size={15} /> Save observation
                      </button>
                    </form>
                    {observations.length > 1 ? (
                      <div className="s-chart">
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={observations}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis
                              reversed
                              domain={["dataMin", "dataMax"]}
                              label={{
                                value: "Position (lower is better)",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip />
                            <Line
                              dataKey="position"
                              stroke="#7259ed"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="s-footnote">
                        At least two observations for the same keyword are
                        needed for a trend.
                      </p>
                    )}
                    {report.rankings.length > 0 && (
                      <div className="s-table-wrap">
                        <table className="s-table">
                          <thead>
                            <tr>
                              <th>Keyword</th>
                              <th>Date</th>
                              <th>Position</th>
                              <th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.rankings
                              .slice(-12)
                              .reverse()
                              .map((k) => (
                                <tr key={k.id}>
                                  <td>{k.keyword}</td>
                                  <td>{k.date}</td>
                                  <td>{k.position}</td>
                                  <td>{k.source}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </ChartBox>
                </>
              )}
              {tab === "Reports" && (
                <>
                  <div className="s-grid two">
                    <ChartBox
                      title="Make the report yours"
                      sub="Brand the deliverable and record your fee"
                    >
                      <form
                        className="s-brand-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void patch({
                            ...branding,
                            fee:
                              branding.fee === "" ? null : Number(branding.fee),
                          });
                        }}
                      >
                        <label>
                          Agency / business name
                          <input
                            value={branding.agency}
                            onChange={(e) =>
                              setBranding({
                                ...branding,
                                agency: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          Prepared by
                          <input
                            value={branding.preparedBy}
                            onChange={(e) =>
                              setBranding({
                                ...branding,
                                preparedBy: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          Report fee (USD)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={branding.fee}
                            onChange={(e) =>
                              setBranding({ ...branding, fee: e.target.value })
                            }
                            placeholder="Set your price"
                          />
                        </label>
                        <button className="s-btn primary" disabled={busy}>
                          <Save size={16} /> Save branding
                        </button>
                      </form>
                      <p className="s-footnote">
                        Fee is recorded for your workflow. Invoice and collect
                        payment separately; online checkout is not connected.
                      </p>
                    </ChartBox>
                    <ChartBox
                      title="Client delivery"
                      sub="Review the findings, then export your branded PDF"
                    >
                      <div className="s-delivery">
                        <FileText size={50} />
                        <h3>{report.client}</h3>
                        <p>
                          {report.pages.length} pages · {keywords.length}{" "}
                          keyword opportunities · {issues.length}{" "}
                          recommendations
                        </p>
                        <div className="s-actions">
                          <button
                            className="s-btn primary"
                            onClick={() => exportPDF(report)}
                          >
                            <Download size={16} /> Download PDF
                          </button>
                          <button
                            className="s-btn"
                            onClick={() => exportJSON(report)}
                          >
                            Export JSON
                          </button>
                        </div>
                        <label>
                          Delivery status
                          <select
                            value={report.state}
                            onChange={(e) =>
                              void patch({ state: e.target.value })
                            }
                            disabled={busy}
                          >
                            <option value="draft">
                              Draft — review required
                            </option>
                            <option value="reviewed">Reviewed</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </label>
                      </div>
                    </ChartBox>
                  </div>
                  <ChartBox
                    title="Consultant notes"
                    sub="Included in the client report"
                  >
                    <textarea
                      aria-label="Consultant notes"
                      className="s-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add client-specific context, scope, limitations and agreed next steps."
                    />
                    <button
                      className="s-btn primary"
                      disabled={busy}
                      onClick={() => void patch({ notes })}
                    >
                      <Save size={15} /> Save notes
                    </button>
                  </ChartBox>
                  <section className="s-card s-table-wrap">
                    <div className="s-card-head">
                      <h3>Saved report library</h3>
                    </div>
                    <table className="s-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Audited</th>
                          <th>Pages</th>
                          <th>Status</th>
                          <th>Fee</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.client}</strong>
                              <small>{new URL(r.url).hostname}</small>
                            </td>
                            <td>{date(r.createdAt)}</td>
                            <td>{r.pages.length}</td>
                            <td>
                              <Tag>{r.state}</Tag>
                            </td>
                            <td>
                              {r.fee === null
                                ? "Not set"
                                : "$" + r.fee.toFixed(2)}
                            </td>
                            <td>
                              <button
                                className="s-btn"
                                onClick={() => setSelected(r.id)}
                              >
                                Open
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </>
              )}
              <details className="s-method">
                <summary>
                  Scope, sources &amp; measurement limits{" "}
                  <ChevronRight size={14} />
                </summary>
                <p>
                  This report samples public HTML. It does not measure Core Web
                  Vitals, backlink authority, search volume, real traffic or
                  Google indexing. AI research is advisory and requires
                  verification. Keyword rankings appear only when observations
                  are recorded. No ranking improvement is guaranteed.
                </p>
                {report.warnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
                {report.technical.robotsNotes.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
                <p>
                  AI status: {report.aiStatus} · Model:{" "}
                  {report.model || "Not used"}{" "}
                  {report.aiCost !== null &&
                    `· Report API cost: $${report.aiCost.toFixed(4)}`}
                </p>
              </details>
            </>
          )}
          <footer className="s-footer">
            <span>SEO Analytic Studio</span>
            <span>Evidence first. Judgment clearly labeled.</span>
          </footer>
        </main>
      </div>
      {newOpen && (
        <div className="s-overlay" role="presentation">
          <section
            className="s-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
          >
            <div className="s-card-head">
              <div>
                <div className="s-eyebrow">NEW CLIENT REPORT</div>
                <h2 id="new-title">Turn a website into an action plan.</h2>
              </div>
              <button
                className="s-icon-btn"
                onClick={() => !busy && setNewOpen(false)}
                disabled={busy}
                aria-label="Close new report"
              >
                <X />
              </button>
            </div>
            <form onSubmit={create}>
              <div className="s-form-grid">
                <label>
                  Client name
                  <input
                    required
                    value={form.client}
                    onChange={(e) =>
                      setForm({ ...form, client: e.target.value })
                    }
                    placeholder="Patriot Energy Solutions"
                  />
                </label>
                <label>
                  Website URL
                  <input
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </label>
                <label>
                  Service area
                  <input
                    required
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </label>
                <label>
                  Pages to sample
                  <select
                    value={form.maxPages}
                    onChange={(e) =>
                      setForm({ ...form, maxPages: Number(e.target.value) })
                    }
                  >
                    <option value={1}>Homepage only</option>
                    <option value={3}>Up to 3 pages</option>
                    <option value={5}>Up to 5 pages</option>
                  </select>
                </label>
                <label className="wide">
                  Business focus &amp; target customers
                  <textarea
                    required
                    rows={3}
                    value={form.focus}
                    onChange={(e) =>
                      setForm({ ...form, focus: e.target.value })
                    }
                    placeholder="Solar, insulation and weatherization for homeowners in Long Island…"
                  />
                </label>
                <label>
                  Agency / business name
                  <input
                    value={form.agency}
                    onChange={(e) =>
                      setForm({ ...form, agency: e.target.value })
                    }
                  />
                </label>
                <label>
                  Report fee (USD, optional)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="Your price"
                  />
                </label>
              </div>
              {isVercelRuntime && <SessionKeyPanel />}
              <label className="s-checkbox">
                <input
                  type="checkbox"
                  checked={form.useAI}
                  onChange={(e) =>
                    setForm({ ...form, useAI: e.target.checked })
                  }
                />{" "}
                Include Muse Spark 1.3 strategy and public-web competitor
                research
              </label>
              <p className="s-footnote">
                Uses your connected OpenRouter account. Public page content is
                sent to the model and search provider. A report can take a few
                minutes.
              </p>
              <details className="s-details">
                <summary>Website blocks automated access?</summary>
                <label>
                  Import saved homepage HTML
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size <= 2000000)
                        setForm({ ...form, html: await f.text() });
                      else if (f) setError("HTML must be under 2 MB.");
                    }}
                  />
                </label>
                {form.html && (
                  <p>
                    HTML attached. Only this page will be analyzed.{" "}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, html: "" })}
                    >
                      Remove
                    </button>
                  </p>
                )}
              </details>
              {error && (
                <p role="alert" className="s-input-error">
                  {error}
                </p>
              )}
              <button className="s-btn primary full" disabled={busy}>
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} /> Collecting
                    evidence and preparing your report…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Create report
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
