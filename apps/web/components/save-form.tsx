import { toggleSaveAction } from "@/app/actions/workspace";

export function SaveForm({
  kind,
  targetId,
  saved,
  returnTo,
}: {
  kind: "UNIVERSITY" | "PROGRAMME" | "SCHOLARSHIP";
  targetId: string;
  saved: boolean;
  returnTo: string;
}) {
  return (
    <form action={toggleSaveAction}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        aria-pressed={saved}
        className={
          saved
            ? "rounded-md border border-sage bg-sage/10 px-3 py-2 text-sm text-sage"
            : "rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-ink/40"
        }
      >
        {saved ? "Saved — remove" : "Save to workspace"}
      </button>
    </form>
  );
}
