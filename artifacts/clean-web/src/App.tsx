import { useEffect, useMemo, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AdminStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success"; isAdmin: boolean; userId: string; email: string | null };

type Coach = {
  id: number;
  name: string;
  sportsCategory: string;
  location: string;
  isApproved: boolean;
  isRejected?: boolean;
};

type PendingReview = {
  id: number;
  coachName: string | null;
  userName: string | null;
  rating: number;
  comment: string;
};

type PendingPhoto = {
  id: number;
  coachName: string | null;
  imageUrl: string;
};

type ReportItem = {
  id: number;
  coachName: string | null;
  reason: string;
  description: string | null;
  status: string;
  adminNote: string | null;
};

type AdminMetrics = {
  totalCoaches: number;
  pendingCoaches: number;
  pendingReviews: number;
  pendingPhotos: number;
  openReports: number;
};

type CoachDetail = Coach & {
  bio: string;
  trialPrice: string;
  regularPrice: string;
  packageDetails: string | null;
  experienceLevel: string;
  whatsappNumber?: string | null;
  profileImageUrl?: string | null;
  coverPhotoUrl?: string | null;
  youtubeUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
};

export function App() {
  const [path, setPath] = useState<string>(window.location.pathname || "/");
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [status, setStatus] = useState<AdminStatus>({ state: "idle" });
  const [adminSection, setAdminSection] = useState<"coaches" | "reviews" | "photos" | "reports">("coaches");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [pendingCoaches, setPendingCoaches] = useState<Coach[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [coachSearch, setCoachSearch] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [photoSearch, setPhotoSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "resolved" | "rejected">("all");
  const [editingCoach, setEditingCoach] = useState<CoachDetail | null>(null);
  const [originalEditingCoach, setOriginalEditingCoach] = useState<CoachDetail | null>(null);
  const [isSavingCoach, setIsSavingCoach] = useState(false);
  const [coachSort, setCoachSort] = useState<"newest" | "name">("newest");
  const [coachPage, setCoachPage] = useState(1);
  const coachPageSize = 8;

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setIsLoadingAuth(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsLoadingAuth(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!path.startsWith("/admin")) return;
    if (isLoadingAuth) return;
    if (!session) {
      setMessage("Please sign in before accessing admin routes.");
      navigate("/");
    }
  }, [path, session, isLoadingAuth]);

  function navigate(nextPath: string) {
    if (nextPath === path) return;
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }

  const email = session?.user?.email ?? "";

  const summary = useMemo(
    () => ({
      isLoadingAuth,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      email: email || "(not signed in)",
    }),
    [isLoadingAuth, session, email],
  );

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStatus({ state: "idle" });
  }

  async function checkAdmin() {
    const token = session?.access_token;
    if (!token) {
      setStatus({ state: "error", message: "No access token found. Please sign in again." });
      return;
    }

    try {
      setStatus({ state: "loading" });
      const res = await fetch(`${apiBase}/api/admin/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus({ state: "error", message: `HTTP ${res.status}: ${text}` });
        return;
      }

      const data = await res.json();
      setStatus({
        state: "success",
        isAdmin: !!data.isAdmin,
        userId: data.userId,
        email: data.email ?? null,
      });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "網絡錯誤，暫時未能檢查管理員權限",
      });
    }
  }

  async function fetchPublicCoaches() {
    setIsLoadingCoaches(true);
    try {
      const res = await fetch(`${apiBase}/api/coaches?limit=20`);
      if (!res.ok) {
        setMessage(`載入教練失敗：${await res.text()}`);
        return;
      }
      const data = await res.json();
      setCoaches(data.coaches || []);
      setMessage(`已載入 ${data.coaches?.length || 0} 位教練`);
    } finally {
      setIsLoadingCoaches(false);
    }
  }

  async function fetchPendingCoaches() {
    const token = session?.access_token;
    if (!token) return;
    navigate("/admin");
    setAdminSection("coaches");
    setIsLoadingPending(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/coaches/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        setMessage(`載入待審教練失敗：${text}`);
        return;
      }
      const data = await res.json();
      setPendingCoaches(data.coaches || []);
      setMessage(`已載入 ${data.coaches?.length || 0} 位待審教練`);
    } finally {
      setIsLoadingPending(false);
    }
  }

  async function moderateCoach(id: number, action: "approve" | "reject") {
    if (!window.confirm(`${action} coach #${id}?`)) return;
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`${apiBase}/api/admin/coaches/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      setMessage(`${action === "approve" ? "通過" : "拒絕"}失敗：${text}`);
      return;
    }
    setMessage(`${action} success for coach #${id}`);
    await fetchPendingCoaches();
    await fetchPublicCoaches();
    await fetchMetrics();
  }

  async function fetchPendingReviews() {
    const token = session?.access_token;
    if (!token) return;
    navigate("/admin");
    setAdminSection("reviews");
    setIsLoadingPending(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/reviews/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
      setMessage(`載入待審評價失敗：${await res.text()}`);
        return;
      }
      const data = await res.json();
      setPendingReviews(data.reviews || []);
      setMessage(`已載入 ${data.reviews?.length || 0} 則待審評價`);
    } finally {
      setIsLoadingPending(false);
    }
  }

  async function moderateReview(id: number, action: "approve" | "reject") {
    if (!window.confirm(`${action} review #${id}?`)) return;
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`${apiBase}/api/admin/reviews/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setMessage(`${action === "approve" ? "通過評價" : "拒絕評價"}失敗：${await res.text()}`);
      return;
    }
    setMessage(`${action} review #${id} success`);
    await fetchPendingReviews();
    await fetchMetrics();
  }

  async function fetchPendingPhotos() {
    const token = session?.access_token;
    if (!token) return;
    navigate("/admin");
    setAdminSection("photos");
    setIsLoadingPending(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/photos/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
      setMessage(`載入待審相片失敗：${await res.text()}`);
        return;
      }
      const data = await res.json();
      setPendingPhotos(data.photos || []);
      setMessage(`已載入 ${data.photos?.length || 0} 張待審相片`);
    } finally {
      setIsLoadingPending(false);
    }
  }

  async function moderatePhoto(id: number, action: "approve" | "reject") {
    if (!window.confirm(`${action} photo #${id}?`)) return;
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`${apiBase}/api/admin/photos/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setMessage(`${action === "approve" ? "通過相片" : "拒絕相片"}失敗：${await res.text()}`);
      return;
    }
    setMessage(`${action} photo #${id} success`);
    await fetchPendingPhotos();
    await fetchMetrics();
  }

  async function fetchReports() {
    const token = session?.access_token;
    if (!token) return;
    navigate("/admin");
    setAdminSection("reports");
    setIsLoadingPending(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
      setMessage(`載入舉報清單失敗：${await res.text()}`);
        return;
      }
      const data = await res.json();
      setReports(data.reports || []);
      setMessage(`已載入 ${data.reports?.length || 0} 筆舉報`);
    } finally {
      setIsLoadingPending(false);
    }
  }

  async function fetchMetrics() {
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`${apiBase}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setMessage(`載入後台指標失敗：${await res.text()}`);
      return;
    }
    const data = await res.json();
    setMetrics(data);
    setMessage("已載入後台指標");
  }

  async function loadCoachForEdit(id: number) {
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`${apiBase}/api/admin/coaches/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setMessage(`載入教練資料失敗：${await res.text()}`);
      return;
    }
    const data = await res.json();
    setEditingCoach(data.coach);
    setOriginalEditingCoach(data.coach);
    navigate(`/admin/coaches/${id}`);
  }

  const isCoachDirty =
    editingCoach && originalEditingCoach
      ? JSON.stringify(editingCoach) !== JSON.stringify(originalEditingCoach)
      : false;

  function coachValidationErrors(coach: CoachDetail | null): string[] {
    if (!coach) return [];
    const errors: string[] = [];
    if (!coach.name?.trim()) errors.push("請填寫姓名");
    if (!coach.sportsCategory?.trim()) errors.push("請填寫運動分類");
    if (!coach.location?.trim()) errors.push("請填寫地區");
    if (!coach.bio?.trim()) errors.push("請填寫教練簡介");
    if (!coach.experienceLevel?.trim()) errors.push("請填寫經驗程度");
    if (Number.isNaN(Number(coach.trialPrice))) errors.push("試堂收費必須是數字");
    if (Number.isNaN(Number(coach.regularPrice))) errors.push("正價收費必須是數字");
    return errors;
  }

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isCoachDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isCoachDirty]);

  async function saveCoachEdits() {
    const token = session?.access_token;
    if (!token || !editingCoach) return;
    const errors = coachValidationErrors(editingCoach);
    if (errors.length > 0) {
      setMessage(`未能儲存：${errors[0]}`);
      return;
    }
    setIsSavingCoach(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/coaches/${editingCoach.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingCoach),
      });
      if (!res.ok) {
        setMessage(`儲存教練資料失敗：${await res.text()}`);
        return;
      }
      setMessage(`已更新教練 #${editingCoach.id}`);
      setOriginalEditingCoach(editingCoach);
      await fetchPendingCoaches();
      await fetchPublicCoaches();
      await fetchMetrics();
    } finally {
      setIsSavingCoach(false);
    }
  }

  async function updateReport(id: number, nextStatus: string) {
    if (!window.confirm(`Update report #${id} to "${nextStatus}"?`)) return;
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`${apiBase}/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      setMessage(`更新舉報狀態失敗：${await res.text()}`);
      return;
    }
    setMessage(`舉報 #${id} 狀態已更新為：${nextStatus}`);
    await fetchReports();
    await fetchMetrics();
  }

  const filteredPendingCoaches = pendingCoaches.filter((coach) => {
    const keyword = coachSearch.trim().toLowerCase();
    if (!keyword) return true;
    return (
      coach.name.toLowerCase().includes(keyword) ||
      coach.sportsCategory.toLowerCase().includes(keyword) ||
      coach.location.toLowerCase().includes(keyword)
    );
  });

  const sortedPendingCoaches = [...filteredPendingCoaches].sort((a, b) => {
    if (coachSort === "name") return a.name.localeCompare(b.name, "zh-HK");
    return b.id - a.id;
  });
  const coachTotalPages = Math.max(1, Math.ceil(sortedPendingCoaches.length / coachPageSize));
  const pagedPendingCoaches = sortedPendingCoaches.slice(
    (coachPage - 1) * coachPageSize,
    coachPage * coachPageSize,
  );

  useEffect(() => {
    if (coachPage > coachTotalPages) {
      setCoachPage(coachTotalPages);
    }
  }, [coachPage, coachTotalPages]);

  const filteredPendingReviews = pendingReviews.filter((review) => {
    const keyword = reviewSearch.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (review.coachName || "").toLowerCase().includes(keyword) ||
      (review.userName || "").toLowerCase().includes(keyword) ||
      review.comment.toLowerCase().includes(keyword)
    );
  });

  const filteredPendingPhotos = pendingPhotos.filter((photo) => {
    const keyword = photoSearch.trim().toLowerCase();
    if (!keyword) return true;
    return (photo.coachName || "").toLowerCase().includes(keyword);
  });

  const filteredReports = reports.filter((report) => {
    if (reportFilter === "all") return true;
    return report.status === reportFilter;
  });

  useEffect(() => {
    fetchPublicCoaches();
  }, []);

  const coachEditMatch = path.match(/^\/admin\/coaches\/(\d+)$/);
  const coachEditId = coachEditMatch ? Number(coachEditMatch[1]) : null;

  const isAdminRoute = path.startsWith("/admin");
  const isAdminOk = status.state === "success" && status.isAdmin;

  return (
    <main className="app-shell">
      <div className="topbar">
        <div className="brand">
          <img src="/logo-transparent.png" alt="SportsMatch HK" className="brand-logo" />
          <div>
            <h1 className="title">SportsMatch HK 管理平台</h1>
            <p className="subtitle">教練資料、審核流程與內容管理</p>
          </div>
        </div>
        <div className="route-switch">
          <button onClick={() => navigate("/")}>首頁</button>
          <button onClick={() => navigate("/admin")}>管理後台</button>
        </div>
      </div>

      <section className="hero-banner">
        <h2 className="hero-title">香港運動教練配對後台</h2>
        <p className="hero-subtitle">以清晰、安全、可追蹤的流程處理教練審核與內容管理。</p>
      </section>

      <section className="panel">
        <h3>帳戶與權限</h3>
        <div className="toolbar">
          {!session ? (
            <button onClick={signInWithGoogle}>Google 登入</button>
          ) : (
            <>
              <button onClick={checkAdmin}>檢查管理員權限</button>
              <button onClick={fetchMetrics}>載入後台指標</button>
              <button onClick={signOut}>登出</button>
            </>
          )}
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          {status.state === "idle" && "尚未檢查權限"}
          {status.state === "loading" && "檢查權限中..."}
          {status.state === "error" && status.message}
          {status.state === "success" && `已登入：${status.email ?? status.userId} / 管理員：${status.isAdmin ? "是" : "否"}`}
        </div>
      </section>

      {!isAdminRoute ? (
        <section className="panel">
          <h3>公開教練列表</h3>
          <div className="toolbar" style={{ marginBottom: 8 }}>
            <button onClick={fetchPublicCoaches}>重新載入教練</button>
            {session ? <button onClick={() => navigate("/admin")}>前往管理後台</button> : null}
          </div>
          {isLoadingCoaches ? <p>載入中...</p> : null}
          {!isLoadingCoaches && coaches.length === 0 ? <p>暫時未有教練資料。</p> : null}
          {coaches.map((coach) => (
            <div key={coach.id} className="list-item">
              <strong>{coach.name}</strong>
              <div className="muted">{coach.sportsCategory} | {coach.location}</div>
            </div>
          ))}
        </section>
      ) : null}

      {message ? <p className={`message${message.includes("失敗") ? " error" : ""}`}>{message}</p> : null}

      {coachEditId ? (
        <section className="panel">
          <h3>編輯教練 #{coachEditId}</h3>
          {!editingCoach ? (
            <p>載入教練資料中...</p>
          ) : (
            <>
              <div style={{ display: "grid", gap: 8 }}>
                <input value={editingCoach.name || ""} onChange={(e) => setEditingCoach({ ...editingCoach, name: e.target.value })} placeholder="姓名" />
                <input value={editingCoach.sportsCategory || ""} onChange={(e) => setEditingCoach({ ...editingCoach, sportsCategory: e.target.value })} placeholder="運動分類" />
                <input value={editingCoach.location || ""} onChange={(e) => setEditingCoach({ ...editingCoach, location: e.target.value })} placeholder="地區" />
                <textarea value={editingCoach.bio || ""} onChange={(e) => setEditingCoach({ ...editingCoach, bio: e.target.value })} placeholder="教練簡介" rows={4} />
                <input value={editingCoach.trialPrice || ""} onChange={(e) => setEditingCoach({ ...editingCoach, trialPrice: e.target.value })} placeholder="試堂收費" />
                <input value={editingCoach.regularPrice || ""} onChange={(e) => setEditingCoach({ ...editingCoach, regularPrice: e.target.value })} placeholder="正價收費" />
                <input value={editingCoach.experienceLevel || ""} onChange={(e) => setEditingCoach({ ...editingCoach, experienceLevel: e.target.value })} placeholder="經驗程度" />
                <input value={editingCoach.whatsappNumber || ""} onChange={(e) => setEditingCoach({ ...editingCoach, whatsappNumber: e.target.value })} placeholder="WhatsApp" />
                <input value={editingCoach.profileImageUrl || ""} onChange={(e) => setEditingCoach({ ...editingCoach, profileImageUrl: e.target.value })} placeholder="頭像 URL" />
                <input value={editingCoach.coverPhotoUrl || ""} onChange={(e) => setEditingCoach({ ...editingCoach, coverPhotoUrl: e.target.value })} placeholder="封面 URL" />
                <input value={editingCoach.youtubeUrl || ""} onChange={(e) => setEditingCoach({ ...editingCoach, youtubeUrl: e.target.value })} placeholder="YouTube URL" />
                <input value={editingCoach.facebookUrl || ""} onChange={(e) => setEditingCoach({ ...editingCoach, facebookUrl: e.target.value })} placeholder="Facebook URL" />
                <input value={editingCoach.instagramUrl || ""} onChange={(e) => setEditingCoach({ ...editingCoach, instagramUrl: e.target.value })} placeholder="Instagram URL" />
                <input value={editingCoach.websiteUrl || ""} onChange={(e) => setEditingCoach({ ...editingCoach, websiteUrl: e.target.value })} placeholder="網站 URL" />
              </div>
              {coachValidationErrors(editingCoach).length > 0 ? (
                <p className="message error">{coachValidationErrors(editingCoach)[0]}</p>
              ) : null}
              <div className="row-actions" style={{ marginTop: 10 }}>
                <button disabled={isSavingCoach} onClick={saveCoachEdits}>{isSavingCoach ? "儲存中..." : "儲存修改"}</button>
                <button
                  onClick={() => {
                    if (isCoachDirty && !window.confirm("尚有未儲存修改，確定離開？")) return;
                    navigate("/admin");
                  }}
                >
                  返回後台
                </button>
              </div>
            </>
          )}
        </section>
      ) : isAdminRoute ? (
        <section className="panel">
          <h3>管理後台</h3>
          {!isAdminOk ? (
            <p>請先點擊「檢查管理員權限」，並確認你是管理員帳戶。</p>
          ) : (
            <>
              <div className="toolbar" style={{ marginBottom: 10 }}>
                <button onClick={fetchPendingCoaches}>載入待審教練</button>
                <button onClick={fetchPendingReviews}>載入待審評價</button>
                <button onClick={fetchPendingPhotos}>載入待審相片</button>
                <button onClick={fetchReports}>載入舉報清單</button>
              </div>
              <div className="section-switch" style={{ marginBottom: 10 }}>
                <button onClick={() => setAdminSection("coaches")}>教練</button>
                <button onClick={() => setAdminSection("reviews")}>評價</button>
                <button onClick={() => setAdminSection("photos")}>相片</button>
                <button onClick={() => setAdminSection("reports")}>舉報</button>
              </div>
              {metrics ? (
                <div className="metrics-grid" style={{ marginBottom: 12 }}>
                  <div className="metric-card">已上架教練: <strong>{metrics.totalCoaches}</strong></div>
                  <div className="metric-card">待審教練: <strong>{metrics.pendingCoaches}</strong></div>
                  <div className="metric-card">待審評價: <strong>{metrics.pendingReviews}</strong></div>
                  <div className="metric-card">待審相片: <strong>{metrics.pendingPhotos}</strong></div>
                  <div className="metric-card">待處理舉報: <strong>{metrics.openReports}</strong></div>
                </div>
              ) : null}
              {isLoadingPending ? <p>資料載入中...</p> : null}
              {adminSection === "coaches" && (
                <>
                  <div className="filter-bar" style={{ marginBottom: 8 }}>
                    <select value={coachSort} onChange={(e) => setCoachSort(e.target.value as "newest" | "name")}>
                      <option value="newest">排序：最新</option>
                      <option value="name">排序：名稱</option>
                    </select>
                    <button onClick={() => setCoachPage((p) => Math.max(1, p - 1))}>上一頁</button>
                    <span>第 {coachPage}/{coachTotalPages} 頁</span>
                    <button onClick={() => setCoachPage((p) => Math.min(coachTotalPages, p + 1))}>下一頁</button>
                  </div>
                  <input
                    placeholder="搜尋教練（姓名／運動／地區）"
                    value={coachSearch}
                    onChange={(e) => {
                      setCoachSearch(e.target.value);
                      setCoachPage(1);
                    }}
                  />
                  {!isLoadingPending && sortedPendingCoaches.length === 0 ? <p>暫無待審教練。</p> : null}
                  {pagedPendingCoaches.map((coach) => (
                    <div key={coach.id} className="list-item">
                      <div>
                        <strong>{coach.name}</strong>
                        <div className="muted">{coach.sportsCategory} | {coach.location}</div>
                      </div>
                      <div className="row-actions" style={{ marginTop: 6 }}>
                        <button onClick={() => moderateCoach(coach.id, "approve")}>通過</button>
                        <button onClick={() => moderateCoach(coach.id, "reject")}>拒絕</button>
                        <button onClick={() => loadCoachForEdit(coach.id)}>編輯</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {adminSection === "reviews" && (
                <>
                  <input placeholder="搜尋評價（教練／用戶／內容）" value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} />
                  {!isLoadingPending && filteredPendingReviews.length === 0 ? <p>暫無待審評價。</p> : null}
                  {filteredPendingReviews.map((review) => (
                    <div key={review.id} className="list-item">
                      <div>
                        <strong>#{review.id}</strong> {review.coachName || "(教練)"} | {review.userName || "匿名"} | {review.rating}/5
                      </div>
                      <div className="muted">{review.comment}</div>
                      <div className="row-actions" style={{ marginTop: 6 }}>
                        <button onClick={() => moderateReview(review.id, "approve")}>通過</button>
                        <button onClick={() => moderateReview(review.id, "reject")}>拒絕</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {adminSection === "photos" && (
                <>
                  <input placeholder="搜尋相片（教練）" value={photoSearch} onChange={(e) => setPhotoSearch(e.target.value)} />
                  {!isLoadingPending && filteredPendingPhotos.length === 0 ? <p>暫無待審相片。</p> : null}
                  {filteredPendingPhotos.map((photo) => (
                    <div key={photo.id} className="list-item">
                      <div><strong>#{photo.id}</strong> {photo.coachName || "(教練)"}</div>
                      <div style={{ margin: "6px 0" }}>
                        <img src={photo.imageUrl} alt="pending" style={{ width: 180, borderRadius: 6 }} />
                      </div>
                      <div className="row-actions" style={{ marginTop: 6 }}>
                        <button onClick={() => moderatePhoto(photo.id, "approve")}>通過</button>
                        <button onClick={() => moderatePhoto(photo.id, "reject")}>拒絕</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {adminSection === "reports" && (
                <>
                  <div className="filter-bar" style={{ marginBottom: 10 }}>
                    <button onClick={() => setReportFilter("all")}>全部</button>
                    <button onClick={() => setReportFilter("pending")}>待處理</button>
                    <button onClick={() => setReportFilter("resolved")}>已解決</button>
                    <button onClick={() => setReportFilter("rejected")}>已駁回</button>
                  </div>
                  {!isLoadingPending && filteredReports.length === 0 ? <p>暫無舉報資料。</p> : null}
                  {filteredReports.map((report) => (
                    <div key={report.id} className="list-item">
                      <div><strong>#{report.id}</strong> {report.coachName || "(教練)"} | {report.reason}</div>
                      <div className="muted">狀態：{report.status}</div>
                      {report.description ? <div className="muted">{report.description}</div> : null}
                      <div className="row-actions" style={{ marginTop: 6 }}>
                        <button onClick={() => updateReport(report.id, "resolved")}>標記解決</button>
                        <button onClick={() => updateReport(report.id, "rejected")}>駁回舉報</button>
                        <button onClick={() => updateReport(report.id, "pending")}>改回待處理</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </section>
      ) : null}

      <section className="panel">
        <h3>系統狀態（技術資訊）</h3>
        <pre className="auth-json">{JSON.stringify(summary, null, 2)}</pre>
      </section>

      <footer className="footer">
        <div className="footer-row">
          <div>
            <img src="/logo-footer.png" alt="SportsMatch HK" className="footer-logo" />
            <div className="muted">香港最透明、最值得信賴的運動教練審核與搜尋平台。</div>
          </div>
          <div className="muted">© {new Date().getFullYear()} SportsMatch HK. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
