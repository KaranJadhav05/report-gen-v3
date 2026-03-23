import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  TrendingUp,
  Users,
  Clock,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { Report } from "../lib/utils";

function StatCard({ icon: Icon, label, value, delay = 0, gradient }: any) {
  return (
    <div
      className="card p-5 fade-in-up hover:scale-[1.02] transition-all duration-300 cursor-default group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: gradient || "rgba(99,102,241,0.15)" }}
        >
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
      <p
        className="text-xs font-medium mt-1"
        style={{ color: "var(--foreground-3)" }}
      >
        {label}
      </p>
    </div>
  );
}

export default function UserDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");

  const loadHistory = useCallback(() => {
    if (!token) return;
    setFetching(true);
    setFetchErr("");
    fetch("/api/attendance/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) =>
        r.ok
          ? r.json()
          : r.json().then((d: any) => Promise.reject(d.message || "Failed")),
      )
      .then((d) => setHistory(d.reports || []))
      .catch((e: any) => setFetchErr(String(e)))
      .finally(() => setFetching(false));
  }, [token]);

  useEffect(() => {
    if (!authLoading && token) loadHistory();
  }, [authLoading, token, loadHistory]);

  const totalStudents = history.reduce((a, r) => a + r.totalStudents, 0);
  const avgAtt = history.length
    ? (
        history.reduce((a, r) => a + r.averageAttendance, 0) / history.length
      ).toFixed(1)
    : "—";

  const gradients = [
    "linear-gradient(135deg,#6366f1,#4f46e5)",
    "linear-gradient(135deg,#06b6d4,#0891b2)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#f59e0b,#d97706)",
  ];

  const downloadExcelFile = async (url: string, filename = "file.xlsx") => {
    try {
      // Fetch the file from URL
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(
        new Blob([blob], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );

      // Create temporary link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 fade-in-up">
        <div>
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--foreground)" }}
          >
            Welcome back,{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0]}</span>{" "}
            👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--foreground-3)" }}>
            Here's an overview of your attendance reports.
          </p>
        </div>
        <button
          onClick={loadHistory}
          disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--foreground-2)",
          }}
        >
          <RefreshCw size={13} className={fetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: FileText,
            label: "Total Uploads",
            value: history.length,
            gradient: gradients[0],
          },
          {
            icon: Users,
            label: "Students Tracked",
            value: totalStudents,
            gradient: gradients[1],
          },
          {
            icon: TrendingUp,
            label: "Avg. Attendance",
            value: avgAtt + "%",
            gradient: gradients[2],
          },
          {
            icon: Clock,
            label: "Last Upload",
            value: history[0]
              ? new Date(history[0].uploadedAt).toLocaleDateString("en-IN")
              : "—",
            gradient: gradients[3],
          },
        ].map((c, i) => (
          <StatCard key={c.label} {...c} delay={i * 60} />
        ))}
      </div>

      {/* Upload CTA */}
      <div
        className="rounded-2xl p-6 mb-8 fade-in-up relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(6,182,212,0.15) 100%)",
          border: "1px solid rgba(99,102,241,0.3)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Upload New Attendance Sheet
            </h2>
            <p className="text-sm" style={{ color: "var(--foreground-2)" }}>
              Process Excel sheets, visualize data, and generate defaulter
              letters.
            </p>
          </div>
          <button
            onClick={() => navigate("/attendance")}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: "0 8px 25px rgba(99,102,241,0.4)",
            }}
          >
            <Upload size={15} /> Upload Sheet
          </button>
        </div>
      </div>

      {/* History */}
      <div className="card overflow-x-auto fade-in-up">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-bold" style={{ color: "var(--foreground)" }}>
            Recent Uploads
          </h2>
          {history.length > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: "rgba(99,102,241,0.12)",
                color: "#818cf8",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              {history.length} reports
            </span>
          )}
        </div>

        {(fetching || authLoading) && (
          <div
            className="p-10 flex flex-col items-center gap-3"
            style={{ color: "var(--foreground-3)" }}
          >
            <div
              className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--primary)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm">Loading reports…</p>
          </div>
        )}
        {!fetching && !authLoading && fetchErr && (
          <div className="p-8 text-center">
            <p
              className="text-sm font-medium mb-3"
              style={{ color: "#fb7185" }}
            >
              Error: {fetchErr}
            </p>
            <button
              onClick={loadHistory}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: "var(--primary)" }}
            >
              Retry
            </button>
          </div>
        )}
        {!fetching && !authLoading && !fetchErr && history.length === 0 && (
          <div className="p-14 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--surface-2)" }}
            >
              <FileText size={24} style={{ color: "var(--foreground-3)" }} />
            </div>
            <p
              className="font-semibold"
              style={{ color: "var(--foreground-2)" }}
            >
              No reports yet
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--foreground-3)" }}
            >
              Upload your first sheet to get started.
            </p>
          </div>
        )}
        {!fetching && !authLoading && !fetchErr && history.length > 0 && (
          <table className="w-full text-sm whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr
                style={{
                  background: "var(--surface)",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--foreground-3)",
                }}
              >
                {[
                  "File Name",
                  "Students",
                  "Avg. Att.",
                  "Uploaded On",
                  "Cloud URL",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr
                  key={r._id}
                  className="transition-all duration-200 group"
                  style={{ borderTop: "1px solid var(--border)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--surface)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <td
                    className="px-6 py-3.5 font-medium max-w-xs truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {r.sheetName}
                  </td>
                  <td
                    className="px-6 py-3.5"
                    style={{ color: "var(--foreground-2)" }}
                  >
                    {r.totalStudents}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className="font-bold text-sm"
                      style={{
                        color: r.averageAttendance < 75 ? "#fb7185" : "#34d399",
                      }}
                    >
                      {r.averageAttendance.toFixed(1)}%
                    </span>
                  </td>
                  <td
                    className="px-6 py-3.5 text-xs"
                    style={{ color: "var(--foreground-3)" }}
                  >
                    {new Date(r.uploadedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td
                    className="px-6 py-3.5 text-xs"
                    style={{ color: "var(--foreground-2)" }}
                  >
                    {r.fileUrl ? (
                      <button
                        onClick={() =>
                          downloadExcelFile((r.fileUrl as string), "report.xlsx")
                        }
                        className="font-medium text-primary hover:underline"
                      >
                        Download Excel
                      </button>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => navigate(`/attendance?id=${r._id}`)}
                      className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 hover:gap-2"
                      style={{ color: "var(--primary)" }}
                    >
                      Open <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
