import React from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "../../pages/index.module.css";

// ── Статистик тоолуур ────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// ── Боломжийн карт ───────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, href }: {
  icon: string; title: string; description: string; href: string;
}) {
  return (
    <Link to={href} className={styles.featureCard}>
      <span className={styles.featureIcon}>{icon}</span>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
      <span className={styles.featureArrow}>→</span>
    </Link>
  );
}

// ── Кодын жишээ ──────────────────────────────────────────────────────────
const snippets = [
  {
    label: "docker-compose",
    code: `services:
  postgres:
    image: postgres:16-alpine
  redis_auth:
    image: redis:7-alpine
    ports: ["6379:6379"]
  redis_sprint:
    image: redis:7-alpine
    ports: ["6381:6379"]
  nats:
    image: nats:2.10-alpine
    command: ["-js"]`,
  },
  {
    label: "auth үйлчилгээ",
    code: `#[tokio::main]
async fn main() {
    let state = AuthState {
        db: make_pg_pool(&cfg.database).await,
        redis: make_redis_pool(&cfg.redis_url),
        jwt_secret: Arc::new(cfg.jwt_secret),
    };
    let app = Router::new()
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh))
        .with_state(state);
    axum::serve(listener, app).await?;
}`,
  },
  {
    label: "kanban ws",
    code: `async fn handle_board_socket(
    mut socket: WebSocket,
    state: SprintState,
    sprint_id: Uuid,
) {
    let key = format!("presence:{sprint_id}");
    state.redis.set_ex(&key, "active", 30).await;
    let mut pubsub = state.redis
        .subscribe(&format!("board:{sprint_id}"))
        .await;
    loop {
        tokio::select! {
            Some(Ok(msg)) = socket.recv() =>
                handle_msg(&state, msg).await,
            Some(ev) = pubsub.next() =>
                { let _ = socket.send(Message::Text(ev)).await; }
        }
    }
}`,
  },
];

function CodeShowcase() {
  const [active, setActive] = React.useState(0);
  return (
    <div className={styles.codeShowcase}>
      <div className={styles.codeTabs}>
        {snippets.map((s, i) => (
          <button
            key={s.label}
            className={`${styles.codeTab} ${i === active ? styles.codeTabActive : ""}`}
            onClick={() => setActive(i)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <pre className={styles.codePre}><code>{snippets[active].code}</code></pre>
    </div>
  );
}

// ── Архитектурын диаграм ──────────────────────────────────────────────────
function ArchDiagram() {
  const services = [
    { name: "Auth", port: "8001" },
    { name: "Project", port: "8002" },
    { name: "Sprint", port: "8003" },
    { name: "Pipeline", port: "8004" },
    { name: "Analytics", port: "8005" },
  ];
  return (
    <div className={styles.archDiagram}>
      <div className={styles.archGateway}>API Gateway · Axum · Rust</div>
      <div className={styles.archConnector} />
      <div className={styles.archServices}>
        {services.map((s) => (
          <div key={s.name} className={styles.archService}>
            <span className={styles.archServiceName}>{s.name}</span>
            <span className={styles.archServicePort}>:{s.port}</span>
          </div>
        ))}
      </div>
      <div className={styles.archConnector} />
      <div className={styles.archDataRow}>
        <div className={styles.archDataBlue}>PostgreSQL · 5 схем</div>
        <div className={styles.archDataRed}>Redis × 5</div>
        <div className={styles.archDataAmber}>NATS JetStream</div>
      </div>
    </div>
  );
}

// ── Үндсэн хуудас ────────────────────────────────────────────────────────
export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Баримт бичиг" description="Rust дээр бүтээгдсэн өндөр гүйцэтгэлтэй agile платформ">
      <main className={styles.main}>

        {/* Баатар хэсэг */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span className={styles.heroDot} />
                Rust дээр бүтээгдсэн · Нээлттэй эх
              </div>
              <h1 className={styles.heroTitle}>
                Хурдны төлөө бүтээгдсэн<br />
                <em className={styles.heroAccent}>agile платформ</em>
              </h1>
              <p className={styles.heroSub}>
                Jira болон Azure DevOps-ийн өндөр гүйцэтгэлтэй альтернатив.
                Миллисекундын доорх API, нэг зангилаанд 100k+ WebSocket холболт, 20MB Docker дүрс.
              </p>
              <div className={styles.heroCtas}>
                <Link to="/mn/docs/guides/local-setup" className={styles.ctaPrimary}>
                  Эхлэх
                </Link>
                <Link to="/mn/docs/architecture/overview" className={styles.ctaGhost}>
                  Архитектур →
                </Link>
              </div>
              <div className={styles.statsRow}>
                <Stat value="~5ms"  label="дундаж API хугацаа" />
                <Stat value="100k+" label="WS холболт / зангилаа" />
                <Stat value="20MB"  label="Docker дүрс" />
                <Stat value="5"     label="микро-үйлчилгээ" />
              </div>
            </div>
            <div className={styles.heroRight}>
              <CodeShowcase />
            </div>
          </div>
        </section>

        {/* Харьцуулалтын мөр */}
        <section className={styles.compBar}>
          <div className={styles.compInner}>
            {[
              { label: "AgilePlatform", value: "~5ms",   pct: 3,  color: "#1D9E75" },
              { label: "Azure DevOps",  value: "~300ms",  pct: 38, color: "#378ADD" },
              { label: "Jira",          value: "~600ms",  pct: 75, color: "#888"    },
            ].map((r) => (
              <div key={r.label} className={styles.compRow}>
                <span className={styles.compLabel}>{r.label}</span>
                <div className={styles.compTrack}>
                  <div className={styles.compFill} style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
                <span className={styles.compVal}>{r.value}</span>
              </div>
            ))}
            <p className={styles.compCaption}>Дундаж API хариу хугацаа — ердийн CRUD үйлдэл</p>
          </div>
        </section>

        {/* Боломжууд */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Багийн бүх хэрэгцээг хангасан</h2>
            <p className={styles.sectionSub}>v1-д хүргэсэн дөрвөн үндсэн модуль</p>
          </div>
          <div className={styles.featureGrid}>
            <FeatureCard
              icon="▦"
              title="Kanban самбар"
              description="WIP хязгаар, swimlane болон шууд хэрэглэгчийн оролцоотой бодит цагийн drag-and-drop — WebSocket болон Redis pub/sub-аар."
              href="/mn/docs/services/sprint"
            />
            <FeatureCard
              icon="◈"
              title="Backlog & sprint"
              description="Epic, story, story point, velocity хянах болон PostgreSQL-д бүрэн өөрчлөлтийн түүхтэй sprint төлөвлөлт."
              href="/mn/docs/services/project"
            />
            <FeatureCard
              icon="⟳"
              title="CI/CD дамжуулалт"
              description="Зэрэгцээ үе шаттай YAML дамжуулалт, Redis Stream-ээр шууд лог дамжуулалт, олон орчны байршуулалт."
              href="/mn/docs/services/pipeline"
            />
            <FeatureCard
              icon="∿"
              title="Аналитик"
              description="Burndown, velocity, cycle time, lead time болон CFD диаграм — бүх үйлчилгээнүүдээс бодит цагийн нэгтгэл."
              href="/mn/docs/services/analytics"
            />
          </div>
        </section>

        {/* Архитектур */}
        <section className={styles.archSection}>
          <div className={styles.archInner}>
            <div className={styles.archText}>
              <h2 className={styles.sectionTitle}>Нэг DB. Таван схем.<br />Таван Redis жишээ.</h2>
              <p className={styles.archDesc}>
                Үйлчилгээ бүр PostgreSQL схем болон Redis жишээг эзэмшдэг —
                тусдаа мэдээллийн сангийн кластергүйгээр бүрэн өгөгдлийн тусгаарлалт.
                Үйлчилгээнүүд NATS JetStream-ээр асинхрон харилцдаг, шууд HTTP дуудлагаар биш.
              </p>
              <ul className={styles.archPoints}>
                <li>Schema-per-service — үйлчилгээ хоорондын SQL хандалтгүй</li>
                <li>Ачааллын онцлогт тохируулсан Redis устгалтын бодлого</li>
                <li>Асинхрон NATS event — синхрон холболтгүй</li>
                <li>Бүх үйлчилгээнд OpenTelemetry мөрдөлт</li>
              </ul>
              <Link to="/mn/docs/architecture/database" className={styles.ctaGhost}>
                Мэдээллийн сангийн дизайн →
              </Link>
            </div>
            <ArchDiagram />
          </div>
        </section>

        {/* Хурдан эхлэл */}
        <section className={styles.quickstart}>
          <h2 className={styles.sectionTitle}>60 секундэд ажиллуулах</h2>
          <div className={styles.steps}>
            {[
              { n: "01", title: "Клон хийх",         code: "git clone https://github.com/your-org/agile-platform" },
              { n: "02", title: "Дэд бүтэц ажиллуулах", code: "docker compose up -d" },
              { n: "03", title: "Шилжилт хийх",      code: "cargo run -p migrations" },
              { n: "04", title: "Ажиллуулах",         code: "overmind start" },
            ].map((s) => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <div className={styles.stepBody}>
                  <span className={styles.stepTitle}>{s.title}</span>
                  <code className={styles.stepCode}>{s.code}</code>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/mn/docs/guides/local-setup"
            className={styles.ctaPrimary}
            style={{ marginTop: "2.5rem", display: "inline-flex" }}
          >
            Дэлгэрэнгүй тохиргооны гарын авлага →
          </Link>
        </section>

        {/* Хөлийн CTA */}
        <section className={styles.footerCta}>
          <h2 className={styles.footerTitle}>Бүтээхэд бэлэн үү?</h2>
          <p className={styles.footerSub}>
            Архитектурыг судлах эсвэл API лавлагаанаас шууд эхлэх.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/mn/docs/architecture/overview" className={styles.ctaPrimary}>
              Архитектур
            </Link>
            <Link to="/mn/docs/api/overview" className={styles.ctaGhost}>
              API лавлагаа →
            </Link>
          </div>
        </section>

      </main>
    </Layout>
  );
}
