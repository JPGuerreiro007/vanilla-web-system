import { createFileRoute, redirect } from "@tanstack/react-router";

// O sistema é feito em HTML/CSS/JS puros em public/rotina/.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/rotina/app.html" });
  },
  head: () => ({
    meta: [
      { title: "Rotina Visual TEA" },
      { name: "description", content: "Rotinas visuais e acompanhamento do PEI para alunos com TEA." },
      { property: "og:title", content: "Rotina Visual TEA" },
      { property: "og:description", content: "Rotinas visuais e acompanhamento do PEI para alunos com TEA." },
    ],
  }),
});
