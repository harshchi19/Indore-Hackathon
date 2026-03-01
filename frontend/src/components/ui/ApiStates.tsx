import { motion } from "framer-motion";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Loading Skeleton ────────────────────────────────── */

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-muted/30 rounded-xl h-24 border border-border" />
      ))}
    </div>
  );
}

/* ── Full-page spinner ───────────────────────────────── */

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 gap-4"
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </motion.div>
  );
}

/* ── Error Card ──────────────────────────────────────── */

export function ErrorCard({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </Button>
      )}
    </motion.div>
  );
}

/* ── Empty State ─────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title = "No data found",
  description,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-3"
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          {description}
        </p>
      )}
    </motion.div>
  );
}
