"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Calendar,
  Code2,
  Edit3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import adminApi from "@/lib/api";
import { cn } from "@/lib/utils";

type AdminSection = "projects" | "resources" | "experience" | "blogs" | "updates";
type FieldType = "text" | "textarea" | "tags" | "links" | "attachments" | "blocks" | "select" | "date";

type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  fileUpload?: {
    formKey: string;
    label: string;
    accept?: string;
    multiple?: boolean;
    helpText?: string;
  };
};

type CollectionConfig = {
  key: AdminSection;
  title: string;
  singular: string;
  endpoint: string;
  description: string;
  accent: string;
  icon: typeof Code2;
  primaryField: string;
  secondaryField: string;
  fields: FieldConfig[];
};

type AdminItem = {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const collections: CollectionConfig[] = [
  {
    key: "projects",
    title: "Projects",
    singular: "Project",
    endpoint: "/api/admin/project",
    description: "Portfolio builds, links, thumbnails, tags, and stack.",
    accent: "bg-[oklch(0.646_0.222_41.116)]",
    icon: Code2,
    primaryField: "name",
    secondaryField: "description",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      {
        key: "thumbnail",
        label: "Thumbnail URL",
        type: "text",
        required: true,
        helpText: "Keep an existing URL here, or choose a raw image file below to upload through the backend.",
        fileUpload: { formKey: "thumbnail", label: "Upload thumbnail", accept: "image/*" },
      },
      { key: "github_link", label: "GitHub URL", type: "text", required: true },
      { key: "live_link", label: "Live URL", type: "text" },
      { key: "tags", label: "Tags", type: "tags", placeholder: "frontend, nextjs, portfolio", helpText: "Add comma-separated values." },
      { key: "technology", label: "Technology", type: "tags", placeholder: "React, MongoDB, Tailwind", helpText: "Add comma-separated values." },
    ],
  },
  {
    key: "resources",
    title: "Resources",
    singular: "Resource",
    endpoint: "/api/admin/resources",
    description: "Reference material, downloads, tags, and attachments.",
    accent: "bg-[oklch(0.828_0.189_84.429)]",
    icon: BookOpen,
    primaryField: "title",
    secondaryField: "description",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "tags", label: "Tags", type: "tags", placeholder: "pdf, docs, notes", helpText: "Add comma-separated values." },
      {
        key: "attachments",
        label: "Attachments",
        type: "attachments",
        placeholder: "Resume | https://example.com/resume.pdf",
        helpText: "Existing URLs can stay here. New raw files selected below are uploaded by the backend and appended.",
        fileUpload: { formKey: "attachments", label: "Upload attachment files", multiple: true },
      },
    ],
  },
  {
    key: "experience",
    title: "Experience",
    singular: "Experience",
    endpoint: "/api/admin/experience",
    description: "Roles, companies, contributions, dates, and proof links.",
    accent: "bg-[oklch(0.6_0.118_184.704)]",
    icon: Briefcase,
    primaryField: "title",
    secondaryField: "company",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "company", label: "Company", type: "text", required: true },
      {
        key: "company_icon",
        label: "Company Icon URL",
        type: "text",
        required: true,
        helpText: "Keep an existing URL here, or choose a raw image file below to upload through the backend.",
        fileUpload: { formKey: "company_icon", label: "Upload company icon", accept: "image/*" },
      },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "status", label: "Status", type: "select", required: true, options: ["ongoing", "completed"] },
      { key: "job_type", label: "Job Type", type: "select", required: true, options: ["remote", "inplace"] },
      { key: "job_classification", label: "Classification", type: "select", required: true, options: ["internship", "others", "open-source"] },
      { key: "start_date", label: "Start Date", type: "date", required: true },
      { key: "end_date", label: "End Date", type: "date" },
      { key: "job_contributions", label: "Contributions", type: "links", placeholder: "One contribution per line" },
      {
        key: "attachments",
        label: "Attachments",
        type: "attachments",
        placeholder: "Offer letter | https://example.com/file.pdf",
        helpText: "Existing URLs can stay here. New raw files selected below are uploaded by the backend and appended.",
        fileUpload: { formKey: "attachments", label: "Upload proof files", multiple: true },
      },
    ],
  },
  {
    key: "blogs",
    title: "Blogs",
    singular: "Blog",
    endpoint: "/api/admin/blogs",
    description: "Post metadata and structured content blocks.",
    accent: "bg-[oklch(0.627_0.265_303.9)]",
    icon: Edit3,
    primaryField: "name",
    secondaryField: "description",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      {
        key: "blocks",
        label: "Blocks JSON",
        type: "blocks",
        placeholder: '[{"blog_type":"paragraph","text":"Write here"}]',
        helpText: 'For image blocks, add {"blog_type":"image","caption":"..."} without a URL, then attach image files below in the same order.',
        fileUpload: { formKey: "blockImages", label: "Upload image block files", accept: "image/*", multiple: true },
      },
    ],
  },
  {
    key: "updates",
    title: "Updates",
    singular: "Update",
    endpoint: "/api/admin/updates",
    description: "Announcements, progress notes, and linked media.",
    accent: "bg-[oklch(0.645_0.246_16.439)]",
    icon: Megaphone,
    primaryField: "name",
    secondaryField: "description",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      {
        key: "attachments",
        label: "Attachment URLs",
        type: "links",
        placeholder: "One URL per line",
        helpText: "Existing URLs can stay here. New raw files selected below are uploaded by the backend and appended.",
        fileUpload: { formKey: "attachments", label: "Upload media files", multiple: true },
      },
    ],
  },
];

const emptyStats = collections.reduce<Record<AdminSection, number>>((acc, collection) => {
  acc[collection.key] = 0;
  return acc;
}, {} as Record<AdminSection, number>);

export function AdminDashboard({ activeSection }: { activeSection?: AdminSection }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("Admin");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      const token = localStorage.getItem("admin_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1])) as { email?: string };
        setEmail(payload.email || "Admin");
      } catch {
        setEmail("Admin");
      }

      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/login");
  };

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-border bg-sidebar lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <FileText size={17} />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin Portal</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          <NavItem href="/admin/home" active={pathname === "/admin/home"} icon={LayoutDashboard} label="Overview" />
          {collections.map((collection) => (
            <NavItem
              key={collection.key}
              href={`/admin/${collection.key}`}
              active={activeSection === collection.key}
              icon={collection.icon}
              label={collection.title}
            />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-muted-foreground">Portfolio CMS</p>
              <h1 className="truncate text-lg font-semibold">
                {activeSection ? collections.find((item) => item.key === activeSection)?.title : "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent sm:inline-flex"
              >
                <ExternalLink size={16} />
                Site
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-sidebar lg:hidden">
          <nav className="flex gap-2 overflow-x-auto px-4 py-3">
            <MobileNavItem href="/admin/home" active={pathname === "/admin/home"} icon={LayoutDashboard} label="Home" />
            {collections.map((collection) => (
              <MobileNavItem
                key={collection.key}
                href={`/admin/${collection.key}`}
                active={activeSection === collection.key}
                icon={collection.icon}
                label={collection.title}
              />
            ))}
          </nav>
        </div>

        <main className="px-4 py-6 sm:px-6">
          {activeSection ? <CollectionManager config={collections.find((item) => item.key === activeSection)!} /> : <Overview />}
        </main>
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const responses = await Promise.all(
          collections.map((collection) => adminApi.get<{ data: AdminItem[] }>(collection.endpoint)),
        );

        if (!mounted) return;

        setStats(
          collections.reduce<Record<AdminSection, number>>((acc, collection, index) => {
            acc[collection.key] = responses[index].data.data.length;
            return acc;
          }, {} as Record<AdminSection, number>),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-md border border-border bg-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Color read</p>
        <h2 className="mt-2 text-2xl font-semibold">Neutral-first admin UI with restrained collection accents</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Your current palette is mostly black, white, and zinc-like OKLCH tokens. The dashboard keeps the same structure for
          surfaces, borders, and text, then borrows the existing chart colors only for small visual anchors.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {collections.map((collection) => {
          const Icon = collection.icon;
          return (
            <Link
              key={collection.key}
              href={`/admin/${collection.key}`}
              className="rounded-md border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={cn("grid h-9 w-9 place-items-center rounded-md text-white", collection.accent)}>
                  <Icon size={17} />
                </span>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>
              <p className="mt-5 text-3xl font-semibold">{loading ? "-" : stats[collection.key]}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{collection.title}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function CollectionManager({ config }: { config: CollectionConfig }) {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [query, setQuery] = useState("");
  const [editingItem, setEditingItem] = useState<AdminItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) => {
      const primary = String(item[config.primaryField] || "").toLowerCase();
      const secondary = String(item[config.secondaryField] || "").toLowerCase();
      return primary.includes(normalizedQuery) || secondary.includes(normalizedQuery);
    });
  }, [config.primaryField, config.secondaryField, items, query]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.get<{ data: AdminItem[] }>(config.endpoint);
      setItems(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err, `Unable to load ${config.title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.title]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: AdminItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: AdminItem) => {
    if (!item._id || !window.confirm(`Delete this ${config.singular.toLowerCase()}?`)) return;

    try {
      await adminApi.delete(`${config.endpoint}?id=${item._id}`);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, `Unable to delete ${config.singular.toLowerCase()}.`));
    }
  };

  const handleSubmit = async (payload: Record<string, unknown> | FormData) => {
    setSaving(true);
    setError("");

    try {
      if (editingItem?._id) {
        await adminApi.patch(`${config.endpoint}?id=${editingItem._id}`, payload);
      } else {
        await adminApi.post(config.endpoint, payload);
      }

      setIsFormOpen(false);
      setEditingItem(null);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, `Unable to save ${config.singular.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0 space-y-4">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 place-items-center rounded-md text-white", config.accent)}>
                  <config.icon size={18} />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold">{config.title}</h2>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={16} />
              New {config.singular}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="rounded-md border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${config.title.toLowerCase()}`}
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>
            <button
              type="button"
              onClick={loadItems}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredItems.length ? (
              filteredItems.map((item) => (
                <article key={item._id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{String(item[config.primaryField] || "Untitled")}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {String(item[config.secondaryField] || "No description")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {item.createdAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">No {config.title.toLowerCase()} found.</div>
            )}
          </div>
        </div>
      </section>

      <aside className={cn("xl:block", isFormOpen ? "block" : "hidden")}>
        <EditorForm
          key={`${config.key}-${editingItem?._id || "new"}`}
          config={config}
          item={editingItem}
          saving={saving}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
          onSubmit={handleSubmit}
        />
      </aside>
    </div>
  );
}

function EditorForm({
  config,
  item,
  saving,
  onCancel,
  onSubmit,
}: {
  config: CollectionConfig;
  item: AdminItem | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown> | FormData) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => buildInitialValues(config, item));
  const [files, setFiles] = useState<Record<string, File[]>>({});

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(config, values);
    await onSubmit(buildSubmission(config, payload, files));
  };

  return (
    <form onSubmit={submit} className="sticky top-20 rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h3 className="text-base font-semibold">{item ? `Edit ${config.singular}` : `New ${config.singular}`}</h3>
          <p className="text-xs text-muted-foreground">Changes save directly to MongoDB through the admin API.</p>
        </div>
        <button type="button" onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent" aria-label="Close form">
          <X size={16} />
        </button>
      </div>

      <div className="max-h-[calc(100vh-210px)] space-y-4 overflow-y-auto p-4">
        {config.fields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={values[field.key] || ""}
            onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
            files={files[field.key] || []}
            onFilesChange={(selectedFiles) => setFiles((current) => ({ ...current, [field.key]: selectedFiles }))}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border p-4">
        <button type="button" onClick={onCancel} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-accent">
          <X size={16} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
      </div>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  files,
  onFilesChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const required = field.required && files.length === 0;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </span>
      {field.type === "textarea" || field.type === "tags" || field.type === "links" || field.type === "attachments" || field.type === "blocks" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={field.placeholder}
          rows={field.type === "textarea" ? 4 : 6}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-ring"
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
        >
          <option value="">Select</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={field.placeholder}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring"
        />
      )}
      {field.helpText ? <span className="mt-2 block text-xs leading-5 text-muted-foreground">{field.helpText}</span> : null}
      {field.fileUpload ? (
        <span className="mt-3 block rounded-md border border-dashed border-border bg-background p-3">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">{field.fileUpload.label}</span>
          <input
            type="file"
            accept={field.fileUpload.accept}
            multiple={field.fileUpload.multiple}
            onChange={(event) => onFilesChange(Array.from(event.target.files || []))}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-medium file:text-primary-foreground"
          />
          {files.length ? (
            <span className="mt-2 block text-xs text-muted-foreground">
              {files.length} file{files.length === 1 ? "" : "s"} selected: {files.map((file) => file.name).join(", ")}
            </span>
          ) : null}
          {field.fileUpload.helpText ? <span className="mt-2 block text-xs leading-5 text-muted-foreground">{field.fileUpload.helpText}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

function NavItem({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof Code2;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function MobileNavItem({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof Code2;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium",
        active ? "bg-primary text-primary-foreground" : "bg-background",
      )}
    >
      <Icon size={15} />
      {label}
    </Link>
  );
}

function buildInitialValues(config: CollectionConfig, item: AdminItem | null) {
  return config.fields.reduce<Record<string, string>>((acc, field) => {
    const value = item?.[field.key];
    acc[field.key] = formatValueForInput(field, value);
    return acc;
  }, {});
}

function formatValueForInput(field: FieldConfig, value: unknown) {
  if (value == null) return "";

  if (field.type === "date") {
    return String(value).slice(0, 10);
  }

  if (field.type === "tags" || field.type === "links") {
    return Array.isArray(value) ? value.join("\n") : String(value);
  }

  if (field.type === "attachments") {
    if (!Array.isArray(value)) return "";

    return value
      .map((attachment) => {
        if (!isRecord(attachment)) return "";
        return `${String(attachment.attachment_name || "")} | ${String(attachment.url || "")}`.trim();
      })
      .filter(Boolean)
      .join("\n");
  }

  if (field.type === "blocks") {
    return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
  }

  return String(value);
}

function buildPayload(config: CollectionConfig, values: Record<string, string>) {
  return config.fields.reduce<Record<string, unknown>>((payload, field) => {
    const value = values[field.key]?.trim() || "";

    if (!value && !field.required) {
      if (field.type === "tags" || field.type === "links" || field.type === "attachments" || field.type === "blocks") {
        payload[field.key] = [];
      }
      return payload;
    }

    if (field.type === "tags" || field.type === "links") {
      payload[field.key] = splitLines(value);
    } else if (field.type === "attachments") {
      payload[field.key] = parseAttachments(value);
    } else if (field.type === "blocks") {
      payload[field.key] = value ? JSON.parse(value) : [];
    } else {
      payload[field.key] = value;
    }

    return payload;
  }, {});
}

function buildSubmission(config: CollectionConfig, payload: Record<string, unknown>, files: Record<string, File[]>) {
  const formData = new FormData();
  let hasFiles = false;

  config.fields.forEach((field) => {
    if (!field.fileUpload) return;

    const selectedFiles = files[field.key] || [];
    selectedFiles.forEach((file) => {
      formData.append(field.fileUpload!.formKey, file);
      hasFiles = true;
    });
  });

  if (!hasFiles) {
    return payload;
  }

  formData.append("payload", JSON.stringify(payload));
  return formData;
}

function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAttachments(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...urlParts] = line.split("|").map((part) => part.trim());
      const url = urlParts.join("|").trim();

      if (!url) {
        return {
          attachment_name: "Attachment",
          url: name,
        };
      }

      return {
        attachment_name: name,
        url,
      };
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
