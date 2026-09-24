import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Images,
  Image as ImageIcon,
  HardDrive,
  Trash2,
  RotateCcw,
  Pencil,
  Upload,
  Search,
  ExternalLink,
  Copy,
  Check,
  X,
  Eye,
  RefreshCw,
  Folder,
  LayoutGrid,
  List,
  AlertTriangle,
  Download,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getMediaSummary,
  renameMediaFile,
  moveToTrash,
  restoreFromTrash,
  deleteMediaPermanently,
  emptyTrash,
  bulkMoveToTrash,
  bulkRestoreFromTrash,
  bulkDeleteMediaPermanently,
  type MediaFile,
} from "@/lib/media.functions";
import { supabase } from "@/integrations/supabase/external";
import { uploadFileToR2 } from "@/lib/r2-storage";
import { Spinner } from "@/components/site/Spinner";

export const Route = createFileRoute("/admin/media")({
  component: AdminMediaPage,
  head: () => ({
    meta: [
      { title: "Media Library — Ibn Mobarak Art Gallery Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type TabMode = "active" | "trash" | "catalog";
type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "size-desc" | "size-asc" | "name";

function AdminMediaPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [tab, setTab] = useState<TabMode>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedBucket, setSelectedBucket] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(60);
  const [catalogPage, setCatalogPage] = useState(1);

  // Modals state
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [renameTarget, setRenameTarget] = useState<MediaFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetBucket, setUploadTargetBucket] = useState<"products" | "product-images">("products");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkTrashModal, setConfirmBulkTrashModal] = useState(false);
  const [confirmBulkDeleteModal, setConfirmBulkDeleteModal] = useState(false);

  // Query: Storage files and stats
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-media-summary"],
    queryFn: () => getMediaSummary(),
  });

  // Query: Products catalog photos (linked in database)
  const { data: catalogProducts, isLoading: isCatalogLoading } = useQuery({
    queryKey: ["admin-catalog-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, image_url, images, category, price")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Flatten catalog photos
  const catalogPhotos = useMemo(() => {
    if (!catalogProducts) return [];
    const list: Array<{
      id: string;
      productId: string;
      productName: string;
      productSlug: string;
      category: string | null;
      url: string;
      price: number;
    }> = [];

    catalogProducts.forEach((p) => {
      const urls = [p.image_url, ...(p.images || [])].filter(Boolean) as string[];
      const uniqueUrls = Array.from(new Set(urls));
      uniqueUrls.forEach((u, i) => {
        list.push({
          id: `${p.id}-${i}`,
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
          category: p.category,
          url: u,
          price: Number(p.price) || 0,
        });
      });
    });
    return list;
  }, [catalogProducts]);

  // Mutations
  const renameMutation = useMutation({
    mutationFn: async (payload: { bucket: string; fullPath: string; newName: string }) => {
      return renameMediaFile({ data: payload });
    },
    onSuccess: (res) => {
      toast.success("ছবি সফলভাবে রিনেম করা হয়েছে!");
      setRenameTarget(null);
      setRenameValue("");
      if (previewFile && renameTarget && previewFile.id === renameTarget.id) {
        setPreviewFile((prev) => (prev ? { ...prev, name: res.newName, fullPath: res.newFullPath, publicUrl: res.newUrl } : null));
      }
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`রিনেম ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const trashMutation = useMutation({
    mutationFn: async (payload: { bucket: string; fullPath: string }) => {
      return moveToTrash({ data: payload });
    },
    onSuccess: () => {
      toast.success("ফাইলটি ট্র্যাশে পাঠানো হয়েছে!");
      if (previewFile) setPreviewFile(null);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`ট্র্যাশে পাঠানো ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (payload: { bucket: string; trashPath: string }) => {
      return restoreFromTrash({ data: payload });
    },
    onSuccess: () => {
      toast.success("ফাইলটি ট্র্যাশ থেকে পুনরুদ্ধার করা হয়েছে!");
      if (previewFile) setPreviewFile(null);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`পুনরুদ্ধার ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const deletePermanentMutation = useMutation({
    mutationFn: async (payload: { bucket: string; fullPath: string }) => {
      return deleteMediaPermanently({ data: payload });
    },
    onSuccess: () => {
      toast.success("ফাইলটি স্থায়ীভাবে মুছে ফেলা হয়েছে!");
      if (previewFile) setPreviewFile(null);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`মুছে ফেলা ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      return emptyTrash({ data: {} });
    },
    onSuccess: (res) => {
      toast.success(`ট্র্যাশ সম্পূর্ণ খালি করা হয়েছে (${res.deletedCount}টি ফাইল স্থায়ীভাবে মুছে ফেলা হয়েছে)!`);
      setConfirmEmptyTrash(false);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`ট্র্যাশ খালি করা ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const bulkTrashMutation = useMutation({
    mutationFn: async (items: Array<{ bucket: string; fullPath: string }>) => {
      return bulkMoveToTrash({ data: { items } });
    },
    onSuccess: (res) => {
      toast.success(`${res.count}টি ফাইল ট্র্যাশে পাঠানো হয়েছে!`);
      setSelectedIds(new Set());
      setConfirmBulkTrashModal(false);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`ট্র্যাশে পাঠানো ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (items: Array<{ bucket: string; trashPath: string }>) => {
      return bulkRestoreFromTrash({ data: { items } });
    },
    onSuccess: (res) => {
      toast.success(`${res.count}টি ফাইল ট্র্যাশ থেকে পুনরুদ্ধার করা হয়েছে!`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`পুনরুদ্ধার ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (items: Array<{ bucket: string; fullPath: string }>) => {
      return bulkDeleteMediaPermanently({ data: { items } });
    },
    onSuccess: (res) => {
      toast.success(`${res.count}টি ফাইল স্থায়ীভাবে মুছে ফেলা হয়েছে!`);
      setSelectedIds(new Set());
      setConfirmBulkDeleteModal(false);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    },
    onError: (err: any) => {
      toast.error(`মুছে ফেলা ব্যর্থ হয়েছে: ${err.message}`);
    },
  });

  // Handle direct file upload to Cloudflare R2
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    const folder = uploadTargetBucket === "product-images" ? "site-content" : "products";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await uploadFileToR2(file, folder);
        successCount++;
      } catch (err: any) {
        toast.error(`${file.name} আপলোড ব্যর্থ: ${err.message}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (successCount > 0) {
      toast.success(`${successCount}টি ছবি সফলভাবে Cloudflare R2-তে আপলোড হয়েছে!`);
      qc.invalidateQueries({ queryKey: ["admin-media-summary"] });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("লিঙ্ক কপি হয়েছে!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadMediaFile = async (url: string, filename: string, id: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    const toastId = toast.loading("ফাইলটি ডাউনলোড হচ্ছে...");
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      let safeFilename = filename || "download";
      if (!safeFilename.includes(".") && blob.type) {
        const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
        safeFilename = `${safeFilename}.${ext}`;
      }
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 500);
      toast.success("ডাউনলোড সম্পন্ন হয়েছে!", { id: toastId });
    } catch (err) {
      console.warn("Direct blob download failed, attempting window trigger:", err);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.download = filename || "download";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 500);
        toast.info("ফাইলটি নতুন ট্যাবে খোলা হয়েছে। সেভ করতে রাইট ক্লিক করে 'Save Image As' চাপুন।", { id: toastId });
      } catch (fallbackErr) {
        toast.error("ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে লিঙ্কটি কপি করে ব্রাউজারে খুলুন।", { id: toastId });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered files for storage
  const filteredStorageFiles = useMemo(() => {
    if (!summary?.files) return [];
    let list = summary.files;

    // Filter by tab
    if (tab === "active") {
      list = list.filter((f) => !f.isTrash);
    } else if (tab === "trash") {
      list = list.filter((f) => f.isTrash);
    }

    // Filter by bucket / folder
    if (selectedBucket !== "all") {
      if (selectedBucket === "landing") {
        list = list.filter((f) => f.fullPath.startsWith("landing/"));
      } else if (selectedBucket === "site-content") {
        list = list.filter((f) => f.fullPath.startsWith("site-content/"));
      } else if (selectedBucket === "products") {
        list = list.filter((f) => f.fullPath.startsWith("products/") || f.bucket.includes("products"));
      } else {
        list = list.filter((f) => f.bucket === selectedBucket || f.fullPath.startsWith(`${selectedBucket}/`));
      }
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.fullPath.toLowerCase().includes(q));
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortOption === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === "size-desc") return b.size - a.size;
      if (sortOption === "size-asc") return a.size - b.size;
      if (sortOption === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [summary, tab, selectedBucket, search, sortOption]);

  // Filtered catalog photos
  const filteredCatalogPhotos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalogPhotos;
    return catalogPhotos.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productSlug.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)),
    );
  }, [catalogPhotos, search]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search, selectedBucket, sortOption]);

  useEffect(() => {
    setCatalogPage(1);
  }, [search]);

  // Paginated storage files
  const totalPages = Math.max(1, Math.ceil(filteredStorageFiles.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStorageFiles = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStorageFiles.slice(start, start + pageSize);
  }, [filteredStorageFiles, safeCurrentPage, pageSize]);

  // Paginated catalog photos
  const totalCatalogPages = Math.max(1, Math.ceil(filteredCatalogPhotos.length / pageSize));
  const safeCatalogPage = Math.min(Math.max(1, catalogPage), totalCatalogPages);

  const paginatedCatalogPhotos = useMemo(() => {
    const start = (safeCatalogPage - 1) * pageSize;
    return filteredCatalogPhotos.slice(start, start + pageSize);
  }, [filteredCatalogPhotos, safeCatalogPage, pageSize]);

  // Clear selection whenever tab, search, or bucket filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab, search, selectedBucket]);

  const toggleSelectFile = (fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const isCurrentPageAllSelected =
    paginatedStorageFiles.length > 0 && paginatedStorageFiles.every((f) => selectedIds.has(f.id));

  const toggleSelectCurrentPage = () => {
    if (isCurrentPageAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedStorageFiles.forEach((f) => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedStorageFiles.forEach((f) => next.add(f.id));
        return next;
      });
    }
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filteredStorageFiles.map((f) => f.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedFilesList = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return filteredStorageFiles.filter((f) => selectedIds.has(f.id));
  }, [filteredStorageFiles, selectedIds]);

  const handleExecuteBulkTrash = () => {
    if (selectedFilesList.length === 0) return;
    bulkTrashMutation.mutate(
      selectedFilesList.map((f) => ({ bucket: f.bucket, fullPath: f.fullPath }))
    );
  };

  const handleExecuteBulkDelete = () => {
    if (selectedFilesList.length === 0) return;
    bulkDeleteMutation.mutate(
      selectedFilesList.map((f) => ({ bucket: f.bucket, fullPath: f.fullPath }))
    );
  };

  const handleExecuteBulkRestore = () => {
    if (selectedFilesList.length === 0) return;
    bulkRestoreMutation.mutate(
      selectedFilesList.map((f) => ({ bucket: f.bucket, trashPath: f.fullPath }))
    );
  };

  return (
    <div className="p-5 md:p-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl flex items-center gap-3">
            <Images className="w-8 h-8 text-primary" />
            Media Library
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            ওয়েবসাইটের সকল ইমেজ, স্টোরেজ সাইজ ও ফাইল ব্যবস্থাপনা
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs sm:text-sm font-medium transition cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadFiles}
            multiple
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isUploading ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            <span>ছবি আপলোড করুন</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Storage Space */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              মোট স্টোরেজ ব্যবহৃত
            </span>
            <HardDrive className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground mt-1">
            {summary ? `${summary.totalMB} MB` : isSummaryLoading ? "—" : "0 MB"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            মোট {summary?.totalFiles ?? 0}টি স্টোরেজ ফাইল
          </p>
        </div>

        {/* Active Files */}
        <div
          onClick={() => setTab("active")}
          className={`bg-card border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
            tab === "active" ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border/80 hover:border-foreground/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              সক্রিয় মিডিয়া ফাইল
            </span>
            <ImageIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
            {summary ? summary.activeCount : isSummaryLoading ? "—" : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">ব্যবহার উপযোগী ছবি</p>
        </div>

        {/* Trash Bin */}
        <div
          onClick={() => setTab("trash")}
          className={`bg-card border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
            tab === "trash" ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-border/80 hover:border-foreground/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">
              ট্র্যাশ বিন
            </span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1">
            {summary ? summary.trashCount : isSummaryLoading ? "—" : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary ? `${summary.trashMB} MB ট্র্যাশে রয়েছে` : "কোনো ট্র্যাশ ফাইল নেই"}
          </p>
        </div>

        {/* Catalog Photos */}
        <div
          onClick={() => setTab("catalog")}
          className={`bg-card border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
            tab === "catalog" ? "border-gold ring-2 ring-gold/20 bg-gold/5" : "border-border/80 hover:border-foreground/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
              প্রোডাক্ট ক্যাটালগ ফটো
            </span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-display text-amber-600 dark:text-amber-400 mt-1">
            {catalogPhotos.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">ক্যাটালগের সকল লিঙ্কড ছবি</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            tab === "active" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>আপলোডকৃত স্টোরেজ ({summary?.activeCount ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("trash")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            tab === "trash" ? "bg-rose-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>ট্র্যাশ বিন ({summary?.trashCount ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("catalog")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            tab === "catalog" ? "bg-gold text-gold-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>প্রোডাক্ট ক্যাটালগ ফটো ({catalogPhotos.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "catalog" ? "প্রোডাক্টের নাম দিয়ে খুঁজুন..." : "ফাইলের নাম দিয়ে খুঁজুন..."}
              className="w-full bg-background border border-border pl-10 pr-8 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Folder / Bucket Filter (Only for storage tabs) */}
          {tab !== "catalog" && (
            <div>
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-primary"
              >
                <option value="all">সকল ফোল্ডার (All R2 Media)</option>
                <option value="products">Products ({summary?.files.filter((f) => f.fullPath.startsWith("products/")).length ?? 0})</option>
                <option value="site-content">Site Content / Banners ({summary?.files.filter((f) => f.fullPath.startsWith("site-content/")).length ?? 0})</option>
                <option value="landing">Landing Pages ({summary?.files.filter((f) => f.fullPath.startsWith("landing/")).length ?? 0})</option>
              </select>
            </div>
          )}

          {/* Sort Option */}
          {tab !== "catalog" && (
            <div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full bg-background border border-border px-3 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-primary"
              >
                <option value="newest">নতুন আপলোড আগে</option>
                <option value="oldest">পুরোনো আপলোড আগে</option>
                <option value="size-desc">সাইজ বড় থেকে ছোট (MB)</option>
                <option value="size-asc">সাইজ ছোট থেকে বড়</option>
                <option value="name">নাম অনুসারে (A-Z)</option>
              </select>
            </div>
          )}

          {/* View Mode & Extra Action */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center border border-border rounded-xl p-1 bg-background">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="গ্রিড ভিউ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "list" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="লিস্ট ভিউ"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {tab === "trash" && (summary?.trashCount ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ট্র্যাশ খালি করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Count indicator & Selection Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {tab === "catalog" ? (
                <>
                  মোট <strong>{filteredCatalogPhotos.length.toLocaleString()}টি</strong> ক্যাটালগ প্রোডাক্ট ছবি
                  {totalCatalogPages > 1 && <> (পেজ {safeCatalogPage} / {totalCatalogPages})</>}
                </>
              ) : (
                <>
                  মোট <strong>{filteredStorageFiles.length.toLocaleString()}টি</strong> ফাইল
                  {totalPages > 1 && <> (পেজ {safeCurrentPage} / {totalPages})</>}
                  {tab === "active" && <> ({formatBytes(filteredStorageFiles.reduce((s, f) => s + f.size, 0))})</>}
                  {tab === "trash" && <> ({formatBytes(filteredStorageFiles.reduce((s, f) => s + f.size, 0))} ট্র্যাশে)</>}
                </>
              )}
            </span>

            {tab !== "catalog" && filteredStorageFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pl-3 border-l border-border/60">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-foreground hover:text-primary font-medium">
                  <input
                    type="checkbox"
                    checked={isCurrentPageAllSelected}
                    onChange={toggleSelectCurrentPage}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>
                    বর্তমান পেজ{" "}
                    {paginatedStorageFiles.length > 0 &&
                      `(${paginatedStorageFiles.filter((f) => selectedIds.has(f.id)).length}/${paginatedStorageFiles.length})`}
                  </span>
                </label>
                {selectedIds.size < filteredStorageFiles.length && (
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    সকল {filteredStorageFiles.length.toLocaleString()}টি নির্বাচন করুন
                  </button>
                )}
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[11px] text-muted-foreground hover:text-rose-500 transition cursor-pointer underline"
                  >
                    সিলেকশন বাতিল ({selectedIds.size.toLocaleString()}টি নির্বাচিত)
                  </button>
                )}
              </div>
            )}
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-primary hover:underline"
            >
              সার্চ ফিল্টার ক্লিয়ার করুন
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isSummaryLoading && tab !== "catalog" ? (
        <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Spinner className="w-7 h-7 text-primary" />
          <p className="text-sm">স্টোরেজ ফাইল ও সাইজ লোড হচ্ছে…</p>
        </div>
      ) : tab === "catalog" ? (
        /* Catalog Photos Display */
        isCatalogLoading ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Spinner className="w-7 h-7 text-primary" />
            <p className="text-sm">ক্যাটালগ ছবি লোড হচ্ছে…</p>
          </div>
        ) : filteredCatalogPhotos.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl text-muted-foreground">
            কোনো প্রোডাক্ট ছবি পাওয়া যায়নি
          </div>
        ) : (
          <div className="space-y-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {paginatedCatalogPhotos.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                      <img
                        src={item.url}
                        alt={item.productName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.url, item.id)}
                          className="p-2 rounded-lg bg-white/90 text-black hover:bg-white transition cursor-pointer shadow-md"
                          title="ছবির লিঙ্ক কপি করুন"
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadMediaFile(item.url, `${item.productSlug || "photo"}.jpg`, item.id)}
                          className="p-2 rounded-lg bg-white/90 text-black hover:bg-white transition cursor-pointer shadow-md"
                          title="ডাউনলোড করুন"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/90 text-black hover:bg-white transition shadow-md"
                          title="নতুন ট্যাবে দেখুন"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <p className="font-medium text-xs text-foreground line-clamp-2" title={item.productName}>
                        {item.productName}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[90px]">{item.category || "—"}</span>
                        <a
                          href={`/products/${item.productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead className="bg-muted/40 border-b border-border font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3 w-16">ছবি</th>
                      <th className="p-3">প্রোডাক্টের নাম</th>
                      <th className="p-3">ক্যাটাগরি</th>
                      <th className="p-3">URL</th>
                      <th className="p-3 text-right">একশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedCatalogPhotos.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition">
                        <td className="p-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="p-3 font-medium text-foreground max-w-xs truncate">{item.productName}</td>
                        <td className="p-3 text-muted-foreground">{item.category || "—"}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate font-mono text-[11px]">
                          {item.url}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.url, item.id)}
                            className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition text-[11px]"
                          >
                            {copiedId === item.id ? "কপি হয়েছে!" : "URL কপি"}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadMediaFile(item.url, `${item.productSlug || "photo"}.jpg`, item.id)}
                            className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title="ডাউনলোড করুন"
                          >
                            <Download className="w-3 h-3" /> ডাউনলোড
                          </button>
                          <a
                            href={`/products/${item.productSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            প্রোডাক্ট দেখুন <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Catalog Pagination Controls */}
            {totalCatalogPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
                <div className="text-xs text-muted-foreground">
                  দেখানো হচ্ছে <strong>{((safeCatalogPage - 1) * pageSize) + 1}</strong> থেকে{" "}
                  <strong>{Math.min(safeCatalogPage * pageSize, filteredCatalogPhotos.length)}</strong> (মোট{" "}
                  <strong>{filteredCatalogPhotos.length.toLocaleString()}টি</strong> ছবি)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCatalogPage(1)}
                    disabled={safeCatalogPage <= 1}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    প্রথম
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                    disabled={safeCatalogPage <= 1}
                    className="p-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="পূর্ববর্তী পেজ"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold text-foreground bg-muted/60 rounded-lg">
                    পেজ {safeCatalogPage} / {totalCatalogPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCatalogPage((p) => Math.min(totalCatalogPages, p + 1))}
                    disabled={safeCatalogPage >= totalCatalogPages}
                    className="p-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="পরবর্তী পেজ"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogPage(totalCatalogPages)}
                    disabled={safeCatalogPage >= totalCatalogPages}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    শেষ
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : filteredStorageFiles.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center bg-card border border-border rounded-2xl text-muted-foreground space-y-2">
          <Folder className="w-10 h-10 mx-auto text-muted-foreground/50" />
          <p className="font-semibold text-base">কোনো ফাইল পাওয়া যায়নি</p>
          <p className="text-xs">
            {tab === "trash"
              ? "ট্র্যাশ বিনে বর্তমানে কোনো ফাইল নেই।"
              : "নতুন ছবি আপলোড করতে উপরের 'ছবি আপলোড করুন' বাটনে ক্লিক করুন।"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === "grid" ? (
            /* Storage Files Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {paginatedStorageFiles.map((file) => {
            const isSelected = selectedIds.has(file.id);
            return (
              <div
                key={file.id}
                className={`group relative bg-card border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : file.isTrash
                    ? "border-rose-500/40 bg-rose-500/5"
                    : "border-border/80 hover:border-primary/50"
                }`}
              >
                {/* Checkbox Selection Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectFile(file.id);
                  }}
                  className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? "bg-primary text-primary-foreground opacity-100 ring-2 ring-primary ring-offset-1"
                      : selectedIds.size > 0
                      ? "bg-black/60 text-white/80 hover:text-white opacity-100 backdrop-blur-xs"
                      : "bg-black/50 hover:bg-black/80 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs"
                  }`}
                  title={isSelected ? "আনসিলেক্ট করুন" : "সিলেক্ট করুন"}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <div className="w-3 h-3 rounded-xs border border-white/80" />
                  )}
                </button>

                {/* Thumbnail */}
                <div
                  onClick={() => setPreviewFile(file)}
                  className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={file.publicUrl}
                    alt={file.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badge */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {file.isTrash ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                        Trash
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white backdrop-blur-xs">
                        {formatBytes(file.size)}
                      </span>
                    )}
                  </div>

                {/* Quick Overlay Action on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="p-2 rounded-lg bg-white/90 text-black hover:bg-white transition cursor-pointer shadow-md"
                    title="প্রিভিউ দেখুন"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(file.publicUrl, file.id);
                    }}
                    className="p-2 rounded-lg bg-white/90 text-black hover:bg-white transition cursor-pointer shadow-md"
                    title="URL কপি করুন"
                  >
                    {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadMediaFile(file.publicUrl, file.name, file.id);
                    }}
                    className="p-2 rounded-lg bg-white/90 text-black hover:bg-white transition cursor-pointer shadow-md"
                    title="ডাউনলোড করুন"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p
                    className="font-medium text-xs text-foreground truncate cursor-pointer hover:text-primary"
                    title={file.name}
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                    <span className="truncate max-w-[85px]">{file.fullPath}</span>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-1">
                  {file.isTrash ? (
                    <>
                      <button
                        type="button"
                        onClick={() => restoreMutation.mutate({ bucket: file.bucket, trashPath: file.fullPath })}
                        disabled={restoreMutation.isPending}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        title="রিস্টোর করুন"
                      >
                        <RotateCcw className="w-3 h-3" /> রিস্টোর
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
                            deletePermanentMutation.mutate({ bucket: file.bucket, fullPath: file.fullPath });
                          }
                        }}
                        disabled={deletePermanentMutation.isPending}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="স্থায়ীভাবে মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget(file);
                          setRenameValue(file.name);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                        title="রিনেম করুন"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => trashMutation.mutate({ bucket: file.bucket, fullPath: file.fullPath })}
                        disabled={trashMutation.isPending}
                        className="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="ট্র্যাশে পাঠান"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* Storage Files Table View */
        <div className="bg-card border border-border rounded-2xl overflow-x-auto shadow-xs">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-muted/40 border-b border-border font-semibold text-muted-foreground">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={isCurrentPageAllSelected}
                    onChange={toggleSelectCurrentPage}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    title={isCurrentPageAllSelected ? "এই পেজের সব আনসিলেক্ট করুন" : "এই পেজের সবগুলো সিলেক্ট করুন"}
                  />
                </th>
                <th className="p-3 w-14">প্রিভিউ</th>
                <th className="p-3">ফাইলের নাম</th>
                <th className="p-3">লোকেশন / পাথ</th>
                <th className="p-3">সাইজ</th>
                <th className="p-3">আপলোড তারিখ</th>
                <th className="p-3 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStorageFiles.map((file) => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <tr
                    key={file.id}
                    className={`transition ${
                      isSelected
                        ? "bg-primary/10 hover:bg-primary/15"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFile(file.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <div
                        onClick={() => setPreviewFile(file)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-muted cursor-pointer"
                      >
                        <img src={file.publicUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3">
                      <div
                        onClick={() => setPreviewFile(file)}
                        className="font-medium text-foreground hover:text-primary cursor-pointer truncate max-w-xs"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      {file.isTrash && (
                        <span className="text-[10px] text-rose-500 font-semibold">ট্র্যাশে রয়েছে</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-[11px] truncate max-w-[200px]">
                      {file.bucket}/{file.fullPath}
                    </td>
                    <td className="p-3 font-medium text-foreground">{formatBytes(file.size)}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => downloadMediaFile(file.publicUrl, file.name, file.id)}
                        disabled={downloadingId === file.id}
                        className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition text-[11px] inline-flex items-center gap-1 disabled:opacity-50"
                        title="ডাউনলোড"
                      >
                        <Download className={`w-3 h-3 ${downloadingId === file.id ? "animate-bounce text-primary" : ""}`} />
                        {downloadingId === file.id ? "ডাউনলোড…" : "ডাউনলোড"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(file.publicUrl, file.id)}
                        className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition text-[11px]"
                      >
                        {copiedId === file.id ? "কপি হয়েছে!" : "URL কপি"}
                      </button>
                      {file.isTrash ? (
                        <>
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate({ bucket: file.bucket, trashPath: file.fullPath })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-medium text-[11px] transition"
                          >
                            রিস্টোর
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।")) {
                                deletePermanentMutation.mutate({ bucket: file.bucket, fullPath: file.fullPath });
                              }
                            }}
                            className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition text-[11px]"
                          >
                            স্থায়ী মুছুন
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRenameTarget(file);
                              setRenameValue(file.name);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition text-[11px]"
                          >
                            রিনেম
                          </button>
                          <button
                            type="button"
                            onClick={() => trashMutation.mutate({ bucket: file.bucket, fullPath: file.fullPath })}
                            className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition text-[11px]"
                          >
                            ট্র্যাশে পাঠান
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Storage Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-muted-foreground">
            দেখানো হচ্ছে <strong>{((safeCurrentPage - 1) * pageSize) + 1}</strong> থেকে{" "}
            <strong>{Math.min(safeCurrentPage * pageSize, filteredStorageFiles.length)}</strong> (মোট{" "}
            <strong>{filteredStorageFiles.length.toLocaleString()}টি</strong> ফাইল)
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              প্রথম
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="পূর্ববর্তী পেজ"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-semibold text-foreground bg-muted/60 rounded-lg">
              পেজ {safeCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="পরবর্তী পেজ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              শেষ
            </button>

            <div className="ml-2 pl-2 border-l border-border flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>প্রতি পেজে:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-background border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-primary"
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={120}>120</option>
                <option value={240}>240</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* RENAME MODAL */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Pencil className="w-4 h-4 text-primary" /> ছবির নাম পরিবর্তন (Rename)
              </h3>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">নতুন ফাইলের নাম</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="ফাইলের নাম দিন..."
                className="w-full bg-background border border-border px-3.5 py-2 text-sm rounded-xl outline-none focus:border-primary"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                মূল পাথ: <code className="font-mono text-foreground">{renameTarget.fullPath}</code>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-muted"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!renameValue.trim()) return toast.error("অনুগ্রহ করে একটি নাম দিন");
                  renameMutation.mutate({
                    bucket: renameTarget.bucket,
                    fullPath: renameTarget.fullPath,
                    newName: renameValue.trim(),
                  });
                }}
                disabled={renameMutation.isPending || !renameValue.trim()}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition disabled:opacity-50"
              >
                {renameMutation.isPending ? "রিনেম হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PREVIEW LIGHTBOX MODAL */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview Box */}
            <div className="flex-1 bg-black/40 flex items-center justify-center p-6 min-h-[300px] md:min-h-[460px] relative overflow-hidden">
              <img
                src={previewFile.publicUrl}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Sidebar Details */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border bg-card space-y-4">
              <div className="space-y-4 overflow-y-auto max-h-[50vh] md:max-h-none pr-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base font-bold truncate" title={previewFile.name}>
                    {previewFile.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-muted/40 p-2.5 rounded-xl space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">সাইজ:</span>
                      <strong className="text-foreground">{formatBytes(previewFile.size)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">বাকেট:</span>
                      <span className="text-foreground font-mono">{previewFile.bucket}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">পাথ:</span>
                      <span className="text-foreground font-mono truncate max-w-[140px]" title={previewFile.fullPath}>
                        {previewFile.fullPath}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">আপলোড:</span>
                      <span className="text-foreground">{new Date(previewFile.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-1">পাবলিক লিঙ্ক (URL):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={previewFile.publicUrl}
                        className="w-full bg-background border border-border px-2 py-1 text-[11px] rounded-lg font-mono truncate"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(previewFile.publicUrl, previewFile.id)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted transition shrink-0"
                        title="কপি লিঙ্ক"
                      >
                        {copiedId === previewFile.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border space-y-2">
                <button
                  type="button"
                  onClick={() => downloadMediaFile(previewFile.publicUrl, previewFile.name, previewFile.id)}
                  disabled={downloadingId === previewFile.id}
                  className="w-full py-2.5 px-3 rounded-xl border border-border text-center text-xs font-semibold hover:bg-muted transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingId === previewFile.id ? "animate-bounce text-primary" : ""}`} />
                  {downloadingId === previewFile.id ? "ডাউনলোড হচ্ছে…" : "ডাউনলোড করুন"}
                </button>

                {previewFile.isTrash ? (
                  <button
                    type="button"
                    onClick={() => restoreMutation.mutate({ bucket: previewFile.bucket, trashPath: previewFile.fullPath })}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-center text-xs font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> ট্র্যাশ থেকে রিস্টোর
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameTarget(previewFile);
                        setRenameValue(previewFile.name);
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-primary/30 text-primary text-center text-xs font-semibold hover:bg-primary/10 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> রিনেম করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => trashMutation.mutate({ bucket: previewFile.bucket, fullPath: previewFile.fullPath })}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-center text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ট্র্যাশে পাঠান
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY TRASH CONFIRMATION MODAL */}
      {confirmEmptyTrash && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-foreground">ট্র্যাশ সম্পূর্ণ খালি করবেন?</h3>
              <p className="text-xs text-muted-foreground">
                ট্র্যাশে থাকা {summary?.trashCount ?? 0}টি ফাইল স্থায়ীভাবে ডিলিট হয়ে যাবে। এটি আর কখনো ফিরিয়ে আনা সম্ভব নয়।
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-muted cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => emptyTrashMutation.mutate()}
                disabled={emptyTrashMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {emptyTrashMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, সম্পূর্ণ খালি করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-card/95 backdrop-blur-md border border-primary/40 shadow-2xl rounded-2xl p-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs">
              {selectedIds.size}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {selectedIds.size}টি ছবি নির্বাচিত করা হয়েছে
              </p>
              <p className="text-[11px] text-muted-foreground">
                মোট সাইজ: {formatBytes(selectedFilesList.reduce((acc, f) => acc + f.size, 0))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tab === "trash" ? (
              <>
                <button
                  type="button"
                  onClick={handleExecuteBulkRestore}
                  disabled={bulkRestoreMutation.isPending}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{bulkRestoreMutation.isPending ? "রিস্টোর হচ্ছে…" : "সব রিস্টোর করুন"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBulkDeleteModal(true)}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{bulkDeleteMutation.isPending ? "মুছে ফেলা হচ্ছে…" : "স্থায়ীভাবে মুছুন"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmBulkTrashModal(true)}
                disabled={bulkTrashMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{bulkTrashMutation.isPending ? "পাঠানো হচ্ছে…" : "ট্র্যাশে পাঠান"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              title="সিলেকশন বাতিল করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM BULK TRASH MODAL */}
      {confirmBulkTrashModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-foreground">
                {selectedIds.size}টি ছবি ট্র্যাশে পাঠাবেন?
              </h3>
              <p className="text-xs text-muted-foreground">
                নির্বাচিত ছবিগুলো ({formatBytes(selectedFilesList.reduce((acc, f) => acc + f.size, 0))}) ট্র্যাশ বিনে চলে যাবে। পরবর্তীতে প্রয়োজন হলে ট্র্যাশ থেকে আবার পুনরুদ্ধার করতে পারবেন।
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBulkTrashModal(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-muted cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkTrash}
                disabled={bulkTrashMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {bulkTrashMutation.isPending ? "পাঠানো হচ্ছে..." : "হ্যাঁ, ট্র্যাশে পাঠান"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK PERMANENT DELETE MODAL */}
      {confirmBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-foreground">
                {selectedIds.size}টি ছবি চিরতরে মুছে ফেলবেন?
              </h3>
              <p className="text-xs text-muted-foreground">
                সতর্কতা: নির্বাচিত ছবিগুলো ({formatBytes(selectedFilesList.reduce((acc, f) => acc + f.size, 0))}) ক্লাউড স্টোরেজ থেকে চিরতরে মুছে যাবে। এটি আর কখনো পুনরুদ্ধার করা সম্ভব হবে না।
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-muted cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, চিরতরে মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
