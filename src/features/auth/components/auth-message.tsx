import type { AuthActionState } from "@/features/auth/state";

export function AuthMessage({ state }: { state: AuthActionState }) {
  if (!state.message) {
    return null;
  }

  const tone =
    state.status === "success"
      ? "border-secondary/30 bg-secondary/10 text-secondary"
      : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <p className={`rounded-md border px-3 py-2 text-sm leading-6 ${tone}`} aria-live="polite">
      {state.message}
    </p>
  );
}
