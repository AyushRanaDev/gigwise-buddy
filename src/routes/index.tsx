import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";
import {
  MessageSquare, Wallet, ShieldCheck, Landmark, FileText, Phone, Trash2, Plus, RotateCcw,
} from "lucide-react";
import logo from "@/assets/saathi-logo.png";
import { LANGUAGES } from "@/lib/saathi-prompt";
import { summarize, inr, type EarningEntry } from "@/lib/earnings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Conversation, ConversationContent, ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit, type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saathi — AI Companion for Gig Workers" },
      { name: "description", content: "Track earnings, stay safe, know your rights and draft complaints in Hindi, Tamil, Telugu, Bengali, Marathi or English." },
      { property: "og:title", content: "Saathi — AI Companion for Gig Workers" },
      { property: "og:description", content: "Multilingual GenAI help for delivery partners, drivers and daily-wage workers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "chat" | "earnings" | "rights" | "drafts" | "safety";
const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "chat", label: "Ask Saathi", icon: MessageSquare },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "rights", label: "Rights & Schemes", icon: Landmark },
  { id: "drafts", label: "Complaints & Docs", icon: FileText },
  { id: "safety", label: "Safety", icon: ShieldCheck },
];

const CHAT_KEY = "saathi.chat";
const EARN_KEY = "saathi.earnings";
const PREF_KEY = "saathi.prefs";

function Index() {
  const [tab, setTab] = useState<Tab>("chat");
  const [language, setLanguage] = useState("Hindi");
  const [work, setWork] = useState("Delivery partner");
  const [entries, setEntries] = useState<EarningEntry[]>([]);
  const loaded = useRef(false);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => {
      const m = e.message || "";
      if (m.includes("429")) toast.error("Too many requests. Please wait a moment.");
      else if (m.includes("402")) toast.error("AI credits are used up for this workspace.");
      else toast.error("Couldn't reach Saathi. Check your internet and try again.");
    },
  });

  useEffect(() => {
    try {
      const c = localStorage.getItem(CHAT_KEY);
      if (c) setMessages(JSON.parse(c) as UIMessage[]);
      const e = localStorage.getItem(EARN_KEY);
      if (e) setEntries(JSON.parse(e));
      const p = localStorage.getItem(PREF_KEY);
      if (p) {
        const pr = JSON.parse(p);
        if (pr.language) setLanguage(pr.language);
        if (pr.work) setWork(pr.work);
      }
    } catch { /* ignore */ }
    loaded.current = true;
  }, [setMessages]);

  useEffect(() => {
    if (loaded.current && status === "ready") localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  }, [messages, status]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(EARN_KEY, JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(PREF_KEY, JSON.stringify({ language, work }));
  }, [language, work]);

  const ask = (text: string) => {
    if (status === "submitted" || status === "streaming") return;
    setTab("chat");
    sendMessage({ text }, { body: { language, profile: work } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 mr-auto">
            <div className="rounded-2xl bg-card p-1"><img src={logo} alt="Saathi" width={44} height={44} className="size-11" /></div>
            <div>
              <h1 className="text-2xl font-extrabold leading-none">Saathi</h1>
              <p className="text-xs opacity-80">Your work companion · आपका साथी</p>
            </div>
          </div>
          <select
            aria-label="I work as"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            className="rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 px-2 py-1.5 text-sm"
          >
            {["Delivery partner", "Cab / auto driver", "Bike taxi rider", "Construction worker", "Domestic worker", "Daily-wage worker"].map((w) => (
              <option key={w} className="text-foreground">{w}</option>
            ))}
          </select>
          <select
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg bg-accent text-accent-foreground px-2 py-1.5 text-sm font-semibold"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <nav className="mx-auto max-w-5xl px-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-background text-foreground" : "text-primary-foreground/80 hover:bg-primary-foreground/10"
              }`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 flex flex-col">
        {tab === "chat" && (
          <ChatPanel messages={messages} status={status} stop={stop} ask={ask}
            onClear={() => { setMessages([]); localStorage.removeItem(CHAT_KEY); }} />
        )}
        {tab === "earnings" && <EarningsPanel entries={entries} setEntries={setEntries} ask={ask} />}
        {tab === "rights" && <RightsPanel ask={ask} />}
        {tab === "drafts" && <DraftsPanel ask={ask} />}
        {tab === "safety" && <SafetyPanel ask={ask} />}
      </main>
    </div>
  );
}

const STARTERS = [
  "How do I register for the e-Shram card?",
  "Platform deducted ₹500 penalty wrongly. What can I do?",
  "Which insurance can I get for ₹20 a year?",
  "How can I save money with irregular income?",
];

function ChatPanel({ messages, status, stop, ask, onClear }: {
  messages: UIMessage[]; status: string; stop: () => void; ask: (t: string) => void; onClear: () => void;
}) {
  const busy = status === "submitted" || status === "streaming";
  const handleSubmit = (m: PromptInputMessage) => {
    if (!m.text?.trim()) return;
    ask(m.text);
  };
  return (
    <div className="flex flex-1 flex-col rounded-3xl bg-card shadow-card border min-h-[70vh]">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center py-10 gap-4">
              <img src={logo} alt="" width={96} height={96} className="size-24" />
              <h2 className="text-2xl font-bold">Namaste! How can I help today?</h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Ask about pay, safety, government schemes, documents or a complaint — in your language.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-xl">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => ask(s)}
                    className="rounded-2xl border bg-secondary px-4 py-3 text-left text-sm hover:border-primary transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i}>{p.text}</span>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer>Saathi is thinking...</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3 border-t flex flex-col gap-2">
        {messages.length > 0 && (
          <button onClick={onClear} className="self-end text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <RotateCcw className="size-3" /> New conversation
          </button>
        )}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea autoFocus placeholder="Type your question… / अपना सवाल लिखें…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status as never} onStop={stop} disabled={false && busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-card border shadow-card p-5 ${className}`}>{children}</div>;
}

function EarningsPanel({ entries, setEntries, ask }: {
  entries: EarningEntry[]; setEntries: (f: (e: EarningEntry[]) => EarningEntry[]) => void; ask: (t: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ date: today, platform: "Swiggy", earned: "", expenses: "", hours: "" });
  const s = summarize(entries);
  const max = Math.max(1, ...entries.map((e) => e.earned));

  const add = () => {
    const earned = Number(f.earned);
    if (!earned) return toast.error("Enter how much you earned");
    setEntries((prev) => [{ id: crypto.randomUUID(), date: f.date, platform: f.platform, earned,
      expenses: Number(f.expenses) || 0, hours: Number(f.hours) || 0 }, ...prev]);
    setF({ ...f, earned: "", expenses: "", hours: "" });
  };

  const analyse = () => {
    if (!entries.length) return toast.error("Add at least one day first");
    const rows = entries.slice(0, 30).map((e) => `${e.date} | ${e.platform} | earned ₹${e.earned} | expenses ₹${e.expenses} | ${e.hours}h`).join("\n");
    ask(`Please analyse my earnings and give me 3-5 simple tips to earn more and save more.\nTotals: earned ${inr(s.earned)}, expenses ${inr(s.expenses)}, net ${inr(s.net)}, ${s.hours} hours, ${inr(s.perHour)}/hour net.\n${rows}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="text-xl font-bold mb-3">Add today's work</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm col-span-2">Date<Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="text-sm col-span-2">Platform / work
            <Input list="plats" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} />
            <datalist id="plats">{["Swiggy", "Zomato", "Zepto", "Blinkit", "Uber", "Ola", "Rapido", "Urban Company", "Daily wage"].map((p) => <option key={p} value={p} />)}</datalist>
          </label>
          <label className="text-sm">Earned ₹<Input inputMode="numeric" value={f.earned} onChange={(e) => setF({ ...f, earned: e.target.value })} /></label>
          <label className="text-sm">Fuel/costs ₹<Input inputMode="numeric" value={f.expenses} onChange={(e) => setF({ ...f, expenses: e.target.value })} /></label>
          <label className="text-sm col-span-2">Hours worked<Input inputMode="decimal" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></label>
        </div>
        <Button className="w-full mt-4" onClick={add}><Plus /> Save entry</Button>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[["Earned", inr(s.earned)], ["Costs", inr(s.expenses)], ["Take-home", inr(s.net)], ["Per hour", inr(s.perHour)]].map(([k, v]) => (
            <Card key={k} className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-xl font-bold font-display">{v}</p></Card>
          ))}
        </div>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">History</h2>
            <Button variant="secondary" size="sm" onClick={analyse}>Ask Saathi for tips</Button>
          </div>
          {entries.length === 0 ? <p className="text-sm text-muted-foreground">No entries yet.</p> : (
            <ul className="flex flex-col gap-2 max-h-96 overflow-auto">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <div className="w-24 shrink-0"><p className="font-semibold">{e.platform}</p><p className="text-xs text-muted-foreground">{e.date}</p></div>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${(e.earned / max) * 100}%` }} />
                  </div>
                  <span className="w-20 text-right font-semibold">{inr(e.earned - e.expenses)}</span>
                  <button aria-label="Delete" onClick={() => setEntries((p) => p.filter((x) => x.id !== e.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

const SCHEMES = [
  { name: "e-Shram Card", desc: "Free national ID for unorganised workers. Gateway to many benefits." },
  { name: "PM-SYM Pension", desc: "₹3,000/month pension after 60 with a small monthly contribution." },
  { name: "PMSBY Accident Insurance", desc: "₹2 lakh accident cover for about ₹20 a year." },
  { name: "PMJJBY Life Insurance", desc: "₹2 lakh life cover for a low yearly premium." },
  { name: "Ayushman Bharat PM-JAY", desc: "Free hospital treatment up to ₹5 lakh per family per year." },
  { name: "Gig worker laws", desc: "Social Security Code 2020 & state gig worker welfare acts." },
];

function RightsPanel({ ask }: { ask: (t: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-secondary">
        <h2 className="text-xl font-bold">Your rights & benefits</h2>
        <p className="text-sm text-muted-foreground">Tap any card — Saathi explains who can get it, documents needed and how to apply.</p>
      </Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCHEMES.map((s) => (
          <button key={s.name} onClick={() => ask(`Explain "${s.name}" for me: what I get, am I eligible, documents needed and step-by-step how to apply.`)}
            className="text-left rounded-3xl bg-card border shadow-card p-5 hover:border-primary transition">
            <Landmark className="size-5 text-primary mb-2" />
            <h3 className="font-bold">{s.name}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </button>
        ))}
      </div>
      <Button variant="outline" className="self-start" onClick={() => ask("Based on my work type, which government schemes and rights should I check first? Make a priority list.")}>
        Which schemes fit me?
      </Button>
    </div>
  );
}

const DRAFT_TYPES = [
  "Complaint to platform (unfair deduction / ID block)",
  "Unpaid wages complaint to Labour Commissioner",
  "Police complaint (harassment / theft / accident)",
  "Insurance / accident claim letter",
  "Cyber fraud complaint (1930)",
];
const DOCS = ["Aadhaar update", "PAN card", "Driving licence", "Bank account (Jan Dhan)", "e-Shram card", "Income proof"];

function DraftsPanel({ ask }: { ask: (t: string) => void }) {
  const [type, setType] = useState(DRAFT_TYPES[0]);
  const [against, setAgainst] = useState("");
  const [details, setDetails] = useState("");
  const draft = () => {
    if (!details.trim()) return toast.error("Tell what happened first");
    ask(`Draft a ready-to-send "${type}". Against: ${against || "[not given]"}. What happened: ${details}. Write the letter, then tell me in 3 bullets where and how to submit it.`);
  };
  return (
    <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
      <Card>
        <h2 className="text-xl font-bold mb-1">Write a complaint</h2>
        <p className="text-sm text-muted-foreground mb-4">Describe it in your own words — any language. Saathi writes a proper letter.</p>
        <div className="flex flex-col gap-3">
          <label className="text-sm">Type
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
              {DRAFT_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="text-sm">Against whom (company / person)<Input value={against} onChange={(e) => setAgainst(e.target.value)} placeholder="e.g. Zomato, contractor Ramesh" /></label>
          <label className="text-sm">What happened?
            <Textarea rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. 12 March ko mera ID bina wajah block kar diya, ₹2,300 payout ruka hai…" />
          </label>
          <Button onClick={draft}><FileText /> Draft my letter</Button>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-bold mb-3">Document help</h2>
        <div className="flex flex-col gap-2">
          {DOCS.map((d) => (
            <button key={d} onClick={() => ask(`How do I get or fix my ${d}? List documents needed, fees, where to go and steps.`)}
              className="rounded-xl border bg-secondary px-4 py-3 text-left text-sm font-medium hover:border-primary transition">{d}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

const SOS = [
  { n: "112", l: "All emergencies" }, { n: "108", l: "Ambulance" },
  { n: "1091", l: "Women helpline" }, { n: "1930", l: "Cyber fraud" },
];
const SAFETY_TOPICS = [
  "Riding safely in heavy rain", "Working in extreme heat", "Night shift safety",
  "What to do right after a road accident", "Dealing with an abusive customer", "Avoiding fake job / loan app scams",
];

function SafetyPanel({ ask }: { ask: (t: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SOS.map((s) => (
          <a key={s.n} href={`tel:${s.n}`} className="rounded-3xl bg-destructive text-destructive-foreground p-4 flex items-center gap-3 shadow-card">
            <Phone className="size-6" /><div><p className="text-2xl font-extrabold font-display">{s.n}</p><p className="text-xs opacity-90">{s.l}</p></div>
          </a>
        ))}
      </div>
      <Card>
        <h2 className="text-xl font-bold mb-3">Safety guides</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SAFETY_TOPICS.map((t) => (
            <button key={t} onClick={() => ask(`Give me short, practical safety tips: ${t}.`)}
              className="rounded-xl border bg-secondary px-4 py-3 text-left text-sm font-medium hover:border-primary transition flex gap-2 items-center">
              <ShieldCheck className="size-4 text-success shrink-0" />{t}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
