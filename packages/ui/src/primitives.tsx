import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "info" | "success" | "warning" | "error";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-line bg-panel text-ink-soft",
  info: "border-sky/40 bg-sky/10 text-sky",
  success: "border-sage/40 bg-sage/10 text-sage",
  warning: "border-brass/50 bg-brass/10 text-brass",
  error: "border-blush/50 bg-blush/10 text-blush",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-window)] border border-line bg-panel/90 p-5 shadow-[var(--shadow-window)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Window({
  title,
  meta,
  children,
  tone = "paper",
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  tone?: "paper" | "plum";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--radius-window)] border border-line shadow-[var(--shadow-window)]",
        tone === "plum" ? "bg-plum text-paper" : "bg-panel text-ink",
        className,
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-2 font-mono text-xs uppercase tracking-[0.14em]",
          tone === "plum"
            ? "border-white/15 bg-black/20 text-paper/80"
            : "border-line bg-paper/70 text-ink-soft",
        )}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-flex gap-1">
            <span className="h-2 w-2 rounded-full border border-current opacity-60" />
            <span className="h-2 w-2 rounded-full border border-current opacity-40" />
            <span className="h-2 w-2 rounded-full border border-current opacity-20" />
          </span>
          {title}
        </span>
        {meta ? <span className="truncate normal-case tracking-normal">{meta}</span> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

const BUTTON_VARIANTS = {
  primary:
    "border-plum-strong bg-plum-strong text-paper hover:bg-plum focus-visible:outline-plum",
  secondary:
    "border-ink/25 bg-panel text-ink hover:border-ink/50 hover:bg-paper focus-visible:outline-plum",
  ghost: "border-transparent bg-transparent text-ink-soft hover:bg-paper hover:text-ink",
  danger: "border-blush bg-blush text-white hover:bg-blush/90 focus-visible:outline-blush",
} as const;

const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"a"> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return (
    <a
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span aria-hidden className="ml-1 text-blush">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-blush">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL_CLASS =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-plum focus:outline-2 focus:outline-offset-1 focus:outline-plum/40";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(CONTROL_CLASS, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(CONTROL_CLASS, "min-h-24", className)} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={cn(CONTROL_CLASS, "pr-8", className)}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  const id = props.id ?? props.name;
  return (
    <div className="flex items-start gap-3">
      <input
        {...props}
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-line text-plum focus:outline-2 focus:outline-offset-2 focus:outline-plum"
      />
      <label htmlFor={id} className="text-sm text-ink">
        {label}
        {description ? <span className="mt-0.5 block text-xs text-ink-soft">{description}</span> : null}
      </label>
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn("rounded-md border px-4 py-3 text-sm", TONE_CLASS[tone], className)}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-ink-soft [&_a]:underline [&_a]:underline-offset-2">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-window)] border border-dashed border-line bg-paper/60 px-6 py-10 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-prose text-sm text-ink-soft">{children}</div> : null}
      {action ? <div className="mt-4 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  tone = "plum",
}: {
  value: number;
  label: string;
  tone?: "plum" | "sage" | "brass";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const bar = { plum: "bg-plum", sage: "bg-sage", brass: "bg-brass" }[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-ink-soft">
        <span>{label}</span>
        <span className="font-mono">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="mt-1 h-2 overflow-hidden rounded-full border border-line bg-paper"
      >
        <div className={cn("h-full", bar)} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-soft">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h1>
        {children ? <div className="mt-2 text-sm text-ink-soft">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-paper/70 px-3 py-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-xl text-ink">{value}</p>
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}
