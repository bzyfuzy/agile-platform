import React from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

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
    label: "auth service",
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
        <div className={styles.archDataBlue}>PostgreSQL · 5 schemas</div>
        <div className={styles.archDataRed}>Redis × 5</div>
        <div className={styles.archDataAmber}>NATS JetStream</div>
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Docs" description="High-performance agile platform built with Rust">
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span className={styles.heroDot} />
                Built with Rust · Open Source
              </div>
              <h1 className={styles.heroTitle}>
                The agile platform<br />
                <em className={styles.heroAccent}>built for speed</em>
              </h1>
              <p className={styles.heroSub}>
                A high-performance alternative to Jira and Azure DevOps.
                Sub-millisecond APIs, 100k+ WebSocket connections, 20MB Docker image.
              </p>
              <div className={styles.heroCtas}>
                <Link to="/docs/guides/local-setup" className={styles.ctaPrimary}>Get started</Link>
                <Link to="/docs/architecture/overview" className={styles.ctaGhost}>Architecture →</Link>
              </div>
              <div className={styles.statsRow}>
                <StatCounter value="~5ms" label="median API latency" />
                <StatCounter value="100k+" label="WS conns / node" />
                <StatCounter value="20MB" label="Docker image" />
                <StatCounter value="5" label="microservices" />
              </div>
            </div>
            <div className={styles.heroRight}>
              <CodeShowcase />
            </div>
          </div>
        </section>

        {/* Comparison bar */}
        <section className={styles.compBar}>
          <div className={styles.compInner}>
            {[
              { label: "AgilePlatform", value: "~5ms", pct: 3, color: "#1D9E75" },
              { label: "Azure DevOps", value: "~300ms", pct: 38, color: "#378ADD" },
              { label: "Jira", value: "~600ms", pct: 75, color: "#888" },
            ].map((r) => (
              <div key={r.label} className={styles.compRow}>
                <span className={styles.compLabel}>{r.label}</span>
                <div className={styles.compTrack}>
                  <div className={styles.compFill} style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
                <span className={styles.compVal}>{r.value}</span>
              </div>
            ))}
            <p className={styles.compCaption}>Median API response time — typical CRUD operation</p>
          </div>
        </section>

        {/* Features */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Everything your team needs</h2>
            <p className={styles.sectionSub}>Four core modules shipped in v1</p>
          </div>
          <div className={styles.featureGrid}>
            <FeatureCard icon="▦" title="Kanban board"
              description="Real-time drag-and-drop with WIP limits, swimlanes, and live user presence via WebSockets and Redis pub/sub."
              href="/docs/services/sprint" />
            <FeatureCard icon="◈" title="Backlog & sprints"
              description="Epics, stories, story points, velocity tracking, and sprint planning with full PostgreSQL-backed change history."
              href="/docs/services/project" />
            <FeatureCard icon="⟳" title="CI/CD pipelines"
              description="YAML-defined pipelines with parallel stages, live log streaming via Redis Streams, and multi-environment deploys."
              href="/docs/services/pipeline" />
            <FeatureCard icon="∿" title="Analytics"
              description="Burndown, velocity, cycle time, lead time, and CFD charts — aggregated across all services in real time."
              href="/docs/services/analytics" />
          </div>
        </section>

        {/* Architecture */}
        <section className={styles.archSection}>
          <div className={styles.archInner}>
            <div className={styles.archText}>
              <h2 className={styles.sectionTitle}>One DB. Five schemas.<br />Five Redis instances.</h2>
              <p className={styles.archDesc}>
                Each service owns its PostgreSQL schema and Redis instance —
                complete data isolation without separate database clusters.
                Services communicate via NATS JetStream, never direct HTTP.
              </p>
              <ul className={styles.archPoints}>
                <li>Schema-per-service — no cross-service SQL access</li>
                <li>Redis eviction policies tuned per workload</li>
                <li>Async NATS events — zero synchronous coupling</li>
                <li>OpenTelemetry tracing across all services</li>
              </ul>
              <Link to="/docs/architecture/database" className={styles.ctaGhost}>Database design →</Link>
            </div>
            <ArchDiagram />
          </div>
        </section>

        {/* Quick start */}
        <section className={styles.quickstart}>
          <h2 className={styles.sectionTitle}>Up in 60 seconds</h2>
          <div className={styles.steps}>
            {[
              { n: "01", title: "Clone", code: "git clone https://github.com/your-org/agile-platform" },
              { n: "02", title: "Start infra", code: "docker compose up -d" },
              { n: "03", title: "Migrate", code: "cargo run -p migrations" },
              { n: "04", title: "Run", code: "overmind start" },
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
          <Link to="/docs/guides/local-setup" className={styles.ctaPrimary} style={{ marginTop: "2.5rem", display: "inline-flex" }}>
            Full setup guide →
          </Link>
        </section>

        {/* Footer CTA */}
        <section className={styles.footerCta}>
          <h2 className={styles.footerTitle}>Ready to build?</h2>
          <p className={styles.footerSub}>Explore the architecture or jump straight into the API.</p>
          <div className={styles.heroCtas}>
            <Link to="/docs/architecture/overview" className={styles.ctaPrimary}>Architecture</Link>
            <Link to="/docs/api/overview" className={styles.ctaGhost}>API reference →</Link>
          </div>
        </section>

      </main>
    </Layout>
  );
}
