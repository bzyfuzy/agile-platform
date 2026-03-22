import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "category",
      label: "Architecture",
      collapsed: false,
      items: [
        "architecture/overview",
        "architecture/microservices",
        "architecture/database",
        "architecture/redis",
        "architecture/cicd-pipeline",
      ],
    },
    {
      type: "category",
      label: "Services",
      items: [
        "services/auth",
        "services/project",
        "services/sprint",
        "services/pipeline",
        "services/analytics",
      ],
    },
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/overview",
        "api/auth",
        "api/projects",
        "api/sprints",
        "api/pipelines",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/local-setup",
        "guides/deployment",
        "guides/contributing",
      ],
    },
  ],
};

export default sidebars;
