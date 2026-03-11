import { useEffect } from "react";

/**
 * Prevents copy, cut, paste, context menu, text selection,
 * and common keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+U, F12, etc.)
 */
export function useCopyProtection() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl/Cmd + C, V, X, A, U, S, P
      if (e.ctrlKey || e.metaKey) {
        const blocked = ["c", "v", "x", "a", "u", "s", "p"];
        if (blocked.includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
      // Block F12, Ctrl+Shift+I/J/C
      if (e.key === "F12") e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const blocked = ["i", "j", "c"];
        if (blocked.includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", handleKeyDown);

    // Disable text selection via CSS
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, []);
}
