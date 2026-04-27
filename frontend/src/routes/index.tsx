import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Curator Pro — Dashboard" },
      { name: "description", content: "Sales intelligence console for L'Étudiant lead management." },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  return <Navigate to="/dashboard" />;
}
