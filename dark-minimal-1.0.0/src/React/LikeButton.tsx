import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface LikeButtonProps {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const STORAGE_KEY = "websiteIsLiked";
const ROW_ID = "portfolio_likes";

// localStorage can throw (Safari private mode, blocked storage), so never call it bare.
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
  // Props win; otherwise use the env vars (.env locally, Cloudflare Pages > Variables in production).
  const url = supabaseUrl || import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = supabaseAnonKey || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  // null = not loaded yet (or failed to load)
  const [likes, setLikes] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const animationTimer = useRef<number | undefined>(undefined);

  // Create the client once, not on every render.
  const supabase = useMemo(
    () => (url && anonKey ? createClient(url, anonKey) : null),
    [url, anonKey]
  );

  useEffect(() => {
    // Read localStorage after mount so server and client render the same markup.
    setIsLiked(readLiked());

    if (!supabase) {
      console.error("LikeButton: missing Supabase URL or anon key.");
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
        return;
      }
      if (data) setLikes(data.count);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  const handleLike = async () => {
    if (!supabase || isProcessing || isLiked) return;

    // Optimistic update
    setIsProcessing(true);
    setIsLiked(true);
    setLikes((current) => (current ?? 0) + 1);
    writeLiked(true);
    setIsAnimating(true);
    animationTimer.current = window.setTimeout(() => setIsAnimating(false), 600);

    // The increment happens inside Postgres (see likes-setup.sql), so two
    // visitors liking at once can't overwrite each other's count.
    const { data, error } = await supabase.rpc("increment_likes", {
      row_id: ROW_ID,
    });

    if (error) {
      console.error("Error updating likes:", error);
      setIsLiked(false);
      setLikes((current) => (current === null ? current : Math.max(0, current - 1)));
      writeLiked(false);
    } else if (typeof data === "number") {
      setLikes(data); // use the real count from the database
    }

    setIsProcessing(false);
  };

  const label =
    likes === null ? "Like" : `${likes} ${likes === 1 ? "Like" : "Likes"}`;

  const borderColorClass = isLiked
    ? "border-[var(--sec)]"
    : "border-[var(--white-icon)]";

  const iconColorClass = isLiked
    ? "text-[var(--sec)] scale-110"
    : "text-[var(--white-icon)] group-hover:text-[var(--white)] group-hover:scale-105";

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleLike}
        disabled={!supabase || isProcessing || isLiked}
        aria-pressed={isLiked}
        aria-label={isLiked ? `Liked. ${label}` : `Like this website. ${label}`}
        className={`group relative w-40 h-10 flex items-center justify-center p-3 rounded-full transition-all duration-300 ease-in-out transform border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sec)] ${borderColorClass} ${
          !isLiked ? "hover:scale-105 hover:border-[var(--white)]" : "cursor-default"
        } ${isAnimating ? "animate-heart-pulse" : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          aria-hidden="true"
          className={`w-6 h-6 transition-all duration-300 ease-in-out ${iconColorClass}`}
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-sm pl-3 font-medium text-[var(--white)]">{label}</span>
      </button>
    </div>
  );
};

export default LikeButton;
