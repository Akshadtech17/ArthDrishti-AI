import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BusinessInput({ onSubmit, isLoading }: { onSubmit: (q: string) => void; isLoading: boolean }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSubmit(query.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <form onSubmit={handleSubmit}>
        <div className="search-glow flex items-center gap-2 border-2 border-border rounded-2xl bg-card transition-all duration-200 px-3 py-2.5 sm:px-4 shadow-sm">
          <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-muted shrink-0">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a business name or describe an idea…"
            className="flex-1 py-2 bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none font-body text-base sm:text-xl min-w-0"
            disabled={isLoading}
            autoComplete="off"
            autoCorrect="off"
          />
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="h-11 px-6 rounded-xl text-sm font-semibold gap-2 shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-sm"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline font-bold">Analyze</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

// expose setter so parent can pre-fill query from explorer click
export { BusinessInput as default };
