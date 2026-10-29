import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface LikeButtonProps {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const STORAGE_KEY = "websiteIsLiked";
const ROW_ID = "portfolio_likes";

// localStorage can throw (Safari private mode, blocked storage)
const readLiked = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeLiked = (liked: boolean) => {
  try {
    if (liked) localStorage.setItem(STORAGE_KEY, "true");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

const LikeButton = ({ supabaseUrl, supabaseAnonKey }: LikeButtonProps) => {
  const url = supabaseUrl || import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = supabaseAnonKey || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  const [likes, setLikes] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(
    () => (url && anonKey ? createClient(url, anonKey) : null),
    [url, anonKey]
  );

  useEffect(() => {
    setIsLiked(readLiked());

    if (!supabase) {
      console.warn("LikeButton: missing Supabase credentials, using local demo mode.");
      setLikes(148);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("count")
        .eq("id", ROW_ID)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Error fetching likes:", error);
        setLikes(148);
        return;
      }
      if (data) setLikes(data.count);
      else setLikes(148);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const triggerHeartBurst = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10,
    }));
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1200);
  };

  const handleLike = async () => {
    if (isProcessing || isLiked) return;

    setIsProcessing(true);
    setIsLiked(true);
    setLikes((current) => (current ?? 148) + 1);
    writeLiked(true);
    triggerHeartBurst();

    if (supabase) {
      const { data, error } = await supabase.rpc("increment_likes", {
        row_id: ROW_ID,
      });

      if (error) {
        console.error("Error updating likes:", error);
        setIsLiked(false);
        setLikes((current) => (current === null ? current : Math.max(0, current - 1)));
        writeLiked(false);
      } else if (typeof data === "number") {
        setLikes(data);
      }
    }

    setIsProcessing(false);
  };

  const label = likes === null ? "Loading..." : `${likes} ${likes === 1 ? "Like" : "Likes"}`;

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center py-4">
      {/* Floating Particle Hearts */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="pointer-events-none absolute text-lg animate-heart-float"
          style={{
            left: `${h.left}%`,
            top: "20%",
          }}
        >
          💜
        </span>
      ))}

      <button
        type="button"
        onClick={handleLike}
        disabled={isProcessing || isLiked}
        aria-pressed={isLiked}
        aria-label={isLiked ? `Liked. ${label}` : `Like this portfolio. ${label}`}
        className={`group relative w-36 h-12 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl border-2 cursor-pointer ${
          isLiked
            ? "bg-purple-950/60 border-[#a476ff] scale-105 shadow-[#a476ff]/20 cursor-default"
            : "bg-gradient-to-r from-purple-950/40 to-[#181a24] border-[#a476ff]/30 hover:border-[#a476ff] hover:scale-105 active:scale-95 shadow-[#a476ff]/10"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          className={`w-5 h-5 transition-all duration-300 ${
            isLiked ? "text-[#a476ff] scale-110" : "text-slate-400 group-hover:text-[#a476ff]"
          }`}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="font-bold text-sm text-white font-mono">{label}</span>
      </button>

      <span className={`text-[11px] mt-2 font-mono transition-colors ${
        isLiked ? "text-emerald-400" : "text-slate-400"
      }`}>
        {isLiked ? "🎉 Thank you for your support!" : "Click to send a like"}
      </span>
    </div>
  );
};

export default LikeButton;
