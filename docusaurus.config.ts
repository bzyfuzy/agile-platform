import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "AgilePlatform",
  tagline: "High-performance agile platform built with Rust",
  favicon: "img/favicon.ico",
  url: "https://agile.bzystudios.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  // ── Mermaid diagram support ──────────────────────────────────────────────
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/bzy-fuzy/agile-platform/tree/main/docs/",
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
          routeBasePath: "docs",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // ── Mermaid theme ──────────────────────────────────────────────────────
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
      options: {
        fontFamily: "inherit",
        fontSize: 14,
      },
    },

    // ── Algolia search (replace with your keys) ───────────────────────────
    // algolia: {
    //   appId: "YOUR_APP_ID",
    //   apiKey: "YOUR_SEARCH_API_KEY",
    //   indexName: "agile_platform_docs",
    // },

    navbar: {
      title: "",
      logo: {
        alt: "AgilePlatform",
        src: "img/logo-horizontal-light.svg",
        srcDark: "img/logo-horizontal-dark.svg",
        href: "/",
        width: 180,
        height: 36,
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          to: "/docs/architecture/overview",
          label: "Architecture",
          position: "left",
        },
        {
          to: "/docs/api/overview",
          label: "API",
          position: "left",
        },
        {
          to: "/docs/guides/local-setup",
          label: "Guides",
          position: "left",
        },
        {
          href: "https://github.com/bzy-fuzy/agile-platform",
          label: "GitHub",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting Started", to: "/docs" },
            { label: "Architecture", to: "/docs/architecture/overview" },
            { label: "API Reference", to: "/docs/api/overview" },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/bzy-fuzy/agile-platform",
            },
            { label: "Discord", href: "https://discord.gg/bzy-agile" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AgilePlatform.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["rust", "toml", "sql", "yaml", "bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
