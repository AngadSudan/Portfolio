import { notFound } from "next/navigation";
import { AdminDashboard } from "../_components/admin-dashboard";

const sections = ["projects", "resources", "experience", "blogs", "updates"] as const;

type AdminSection = (typeof sections)[number];

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!sections.includes(section as AdminSection)) {
    notFound();
  }

  return <AdminDashboard activeSection={section as AdminSection} />;
}
