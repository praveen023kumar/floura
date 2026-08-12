// File Path: /src/components/FeedbackView.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageSquare, 
  Plus, 
  Upload, 
  X, 
  RefreshCw, 
  ImageIcon, 
  Clock, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";

interface FeedbackItem {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  status: "Pending" | "In Progress" | "Resolved" | "Spam";
  createdAt: string;
}

interface FeedbackViewProps {
  user: { name: string; email: string; avatar: string; token?: string } | null;
}

export default function FeedbackView({ user }: FeedbackViewProps) {
  const navigate = useNavigate();

  // Mode: "list" or "add"
  const [viewMode, setViewMode] = useState<"list" | "add">("list");
  
  // Data State
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [feedbackImage, setFeedbackImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch feedbacks for this logged-in user
  const fetchFeedbacks = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(getApiUrl("/api/feedbacks"), {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + (user.token || ""),
          "x-user-email": user.email
        }
      });

      if (!response.ok) {
        throw new Error("Failed to load feedbacks.");
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
    } catch (err: any) {
      console.error("Error fetching feedbacks:", err);
      setError(err.message || "Could not retrieve your feedback submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("Image size must be less than 2MB.");
        return;
      }
      setFormError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDescription.trim()) {
      setFormError("Title and description are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(getApiUrl("/api/feedbacks"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (user?.token || ""),
          "x-user-email": user?.email || ""
        },
        body: JSON.stringify({
          name: user?.name || "Logged-in Chef",
          email: user?.email || "",
          category: "Suggestion",
          title: feedbackTitle,
          message: feedbackDescription,
          imageUrl: feedbackImage,
          rating: 5
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback.");
      }

      setSubmitSuccess(true);
      setFeedbackTitle("");
      setFeedbackDescription("");
      setFeedbackImage("");
      
      // Reload feedbacks list
      await fetchFeedbacks();
    } catch (err: any) {
      console.error("[Feedback] Error submitting:", err);
      setFormError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { 
        year: "numeric", 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fade-in text-left">
      {/* Header section with back nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            if (viewMode === "add") {
              setViewMode("list");
              setSubmitSuccess(false);
              setFormError("");
            } else {
              navigate("/more");
            }
          }}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </button>

        {viewMode === "list" && (
          <button
            onClick={() => setViewMode("add")}
            className="flex items-center gap-1.5 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feedback</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-serif font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-primary-brand dark:text-orange-400" />
                Feedback & Bug Reports
              </h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                View your past platform suggestions, check their status, or submit a new ticket.
              </p>
            </div>

            {loading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary-brand dark:text-orange-400 animate-spin mb-3" />
                <span className="text-xs text-zinc-500 font-medium">Baking feedback list...</span>
              </div>
            ) : error ? (
              <div className="py-12 bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 text-center">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-450">{error}</p>
                <button
                  onClick={fetchFeedbacks}
                  className="mt-3 px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="py-20 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl text-center flex flex-col items-center justify-center p-6 shadow-xs">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 text-xl mb-4">
                  💬
                </div>
                <h3 className="font-serif text-lg font-bold text-zinc-750 dark:text-zinc-250">No feedback submitted yet</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
                  Your suggestions and bug reports help us improve. Click the button below to submit your first feedback ticket!
                </p>
                <button
                  onClick={() => setViewMode("add")}
                  className="mt-6 bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  Create New Feedback
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((item) => {
                  let statusBg = "bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400";
                  let StatusIcon = Clock;
                  if (item.status === "Pending") {
                    statusBg = "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/20";
                    StatusIcon = Clock;
                  } else if (item.status === "In Progress") {
                    statusBg = "bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-500/20";
                    StatusIcon = RefreshCw;
                  } else if (item.status === "Resolved") {
                    statusBg = "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20";
                    StatusIcon = CheckCircle;
                  } else if (item.status === "Spam") {
                    statusBg = "bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/20";
                    StatusIcon = AlertCircle;
                  }

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="flex-grow space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusBg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {item.status}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold ml-auto md:ml-2">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <h3 className="font-serif text-sm font-bold text-zinc-800 dark:text-zinc-150 leading-tight">
                          {item.title}
                        </h3>

                        <p className="text-zinc-650 dark:text-zinc-300 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                          {item.message}
                        </p>

                        {item.imageUrl && (
                          <div className="mt-2">
                            <a 
                              href={item.imageUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-block relative rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-800 hover:opacity-90 transition-opacity"
                            >
                              <img 
                                src={item.imageUrl} 
                                alt="Feedback screenshot preview" 
                                className="max-w-[200px] max-h-[120px] object-cover" 
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="add-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-serif font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-primary-brand dark:text-orange-400" />
                Submit Platform Feedback
              </h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
                Tell us about bugs, suggest new kitchen features, or share comments.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs max-w-xl">
              {submitSuccess ? (
                <div className="text-center py-8 flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4">
                    ✓
                  </div>
                  <h3 className="font-serif text-2xl font-black text-zinc-800 dark:text-zinc-100">Bake Successful! 🧁</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-[280px] leading-relaxed">
                    Your feedback helps us cook up a better experience. We've received your suggestion successfully.
                  </p>
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md cursor-pointer"
                    >
                      Submit Another
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("list");
                        setSubmitSuccess(false);
                      }}
                      className="bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-250 text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer border border-zinc-200/50 dark:border-zinc-800"
                    >
                      View All Feedback
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Feedback Title</label>
                    <input
                      type="text"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      placeholder="e.g. Recipe scaling error for eggless sponge cake"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Description / Details</label>
                    <textarea
                      rows={4}
                      value={feedbackDescription}
                      onChange={(e) => setFeedbackDescription(e.target.value)}
                      placeholder="Please explain the issue or your suggestion in detail..."
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Attach Screenshot (Optional)</label>
                    {!feedbackImage ? (
                      <label className="flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl p-4 cursor-pointer transition-colors duration-200">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="w-5 h-5 text-zinc-400 dark:text-zinc-600 mb-1" />
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450">Upload screenshot or photo</span>
                          <span className="text-[8px] text-zinc-400 mt-0.5">JPEG or PNG, max 2MB</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                      </label>
                    ) : (
                      <div className="relative inline-block mt-1">
                        <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <img src={feedbackImage} alt="Feedback preview" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFeedbackImage("")}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 shadow-sm transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {formError && (
                    <p className="text-[10px] text-rose-500 font-semibold">{formError}</p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-grow bg-primary-brand hover:bg-primary-brand-dark dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <RefreshCw className="w-4 h-4 text-white animate-spin shrink-0" />
                      ) : (
                        "Submit Feedback"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className="px-5 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-250 text-xs font-bold rounded-xl cursor-pointer border border-zinc-200/50 dark:border-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
