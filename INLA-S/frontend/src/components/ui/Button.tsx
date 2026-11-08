import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "error" | "error-outline" | "text" | "ghost";

const base = [
  "inline-flex h-[44.788px] min-w-[124px] cursor-pointer items-center justify-center gap-2 rounded-[8px] px-4",
  "text-sm leading-[14px] font-semibold tracking-[0.35px] uppercase",
  "transition-[background-color,box-shadow,opacity,color] duration-150",
  "focus-visible:outline-none",
  "disabled:cursor-not-allowed aria-disabled:cursor-wait",
].join(" ");

const primary = [
  "border border-transparent bg-[var(--color-action-primary)] text-white",
  "hover:bg-[var(--color-action-primary-hover)] hover:shadow-[0px_1px_1px_rgba(17,24,39,0.12),0px_1px_1.5px_rgba(17,24,39,0.08)]",
  "focus-visible:bg-[var(--color-action-primary)] focus-visible:shadow-[0px_0px_0px_3px_rgba(29,78,216,0.35)]",
  "active:bg-[var(--color-action-primary-hover)] active:shadow-[0px_1px_1px_rgba(17,24,39,0.12),0px_1px_1.5px_rgba(17,24,39,0.08)]",
  "disabled:bg-[var(--color-action-primary)] disabled:opacity-60 disabled:shadow-none",
  "disabled:hover:bg-[var(--color-action-primary)] disabled:hover:shadow-none",
  "disabled:active:bg-[var(--color-action-primary)] disabled:active:shadow-none",
  "aria-disabled:bg-[var(--color-action-primary)] aria-disabled:opacity-60 aria-disabled:shadow-none",
  "aria-disabled:hover:bg-[var(--color-action-primary)] aria-disabled:hover:shadow-none",
].join(" ");

const secondary = [
  "border-[1.05px] border-[var(--color-brand-title)] bg-white text-[var(--color-brand-title)]",
  "hover:bg-[var(--color-secondary-hover)]",
  "focus-visible:bg-white focus-visible:shadow-[0px_0px_0px_3px_rgba(99,53,23,0.25)]",
  "active:bg-[var(--color-secondary-hover)]",
  "disabled:bg-white disabled:opacity-50 disabled:shadow-none",
  "disabled:hover:bg-white disabled:active:bg-white",
  "aria-disabled:bg-white aria-disabled:opacity-50 aria-disabled:shadow-none",
  "aria-disabled:hover:bg-white",
].join(" ");

const error = [
  "border border-transparent bg-[var(--color-semantic-error)] text-white",
  "hover:bg-[var(--color-semantic-error-hover)] hover:shadow-[0px_1px_1px_rgba(17,24,39,0.12),0px_1px_1.5px_rgba(17,24,39,0.08)]",
  "focus-visible:bg-[var(--color-semantic-error)] focus-visible:shadow-[0px_0px_0px_3px_rgba(239,68,68,0.35)]",
  "active:bg-[var(--color-semantic-error-hover)] active:shadow-[0px_1px_1px_rgba(17,24,39,0.12),0px_1px_1.5px_rgba(17,24,39,0.08)]",
  "disabled:bg-[var(--color-semantic-error)] disabled:opacity-60 disabled:shadow-none",
  "disabled:hover:bg-[var(--color-semantic-error)] disabled:hover:shadow-none",
  "disabled:active:bg-[var(--color-semantic-error)] disabled:active:shadow-none",
  "aria-disabled:bg-[var(--color-semantic-error)] aria-disabled:opacity-60 aria-disabled:shadow-none",
  "aria-disabled:hover:bg-[var(--color-semantic-error)] aria-disabled:hover:shadow-none",
].join(" ");

const errorOutline = [
  "border-[1.05px] border-[var(--color-semantic-error)] bg-white text-[var(--color-semantic-error)]",
  "hover:bg-[var(--color-semantic-error-soft)]",
  "focus-visible:bg-white focus-visible:shadow-[0px_0px_0px_3px_rgba(239,68,68,0.25)]",
  "active:bg-[var(--color-semantic-error-soft)]",
  "disabled:bg-white disabled:opacity-50 disabled:shadow-none",
  "disabled:hover:bg-white disabled:active:bg-white",
  "aria-disabled:bg-white aria-disabled:opacity-50 aria-disabled:shadow-none",
  "aria-disabled:hover:bg-white",
].join(" ");

const text = [
  "border border-transparent bg-transparent text-[var(--color-text-body)]",
  "hover:bg-[var(--color-text-button-hover)] hover:text-[#111827]",
  "focus-visible:bg-[var(--color-text-button-focus)] focus-visible:text-[var(--color-text-body)] focus-visible:shadow-[0px_0px_0px_3px_rgba(107,114,128,0.22)]",
  "active:bg-[var(--color-text-button-hover)] active:text-[#111827]",
  "disabled:bg-transparent disabled:text-[#6b7280] disabled:opacity-50 disabled:shadow-none",
  "disabled:hover:bg-transparent disabled:hover:text-[#6b7280] disabled:active:bg-transparent",
  "aria-disabled:bg-transparent aria-disabled:text-[#6b7280] aria-disabled:opacity-50 aria-disabled:shadow-none",
  "aria-disabled:hover:bg-transparent aria-disabled:hover:text-[#6b7280]",
].join(" ");

const styles: Record<Variant, string> = {
  primary,
  secondary,
  error,
  "error-outline": errorOutline,
  text,
  ghost: secondary,
};

const spinners: Record<Variant, string> = {
  primary: "/icons/button-spinner-fill.svg",
  secondary: "/icons/button-spinner-secondary.svg",
  error: "/icons/button-spinner-fill.svg",
  "error-outline": "/icons/button-spinner-error.svg",
  text: "/icons/button-spinner-text.svg",
  ghost: "/icons/button-spinner-secondary.svg",
};

type Common = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  block?: boolean;
  loading?: boolean;
};

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };

type LinkProps = Common & { to: string };

function buttonClassName(variant: Variant = "primary", options?: { block?: boolean; loading?: boolean; className?: string }) {
  return [base, options?.block ? "w-full" : "", styles[variant], options?.loading ? "cursor-wait" : "", options?.className ?? ""].join(" ");
}

function Spinner({ variant }: { variant: Variant }) {
  return (
    <span className="ui-spin" aria-hidden="true">
      <img src={spinners[variant]} alt="" />
    </span>
  );
}

export function Button(props: ButtonProps | LinkProps) {
  const variant = props.variant ?? "primary";
  const loading = Boolean(props.loading);
  const className = buttonClassName(variant, { block: props.block, loading, className: props.className });
  const content = (
    <>
      {loading ? <Spinner variant={variant} /> : null}
      {props.children}
    </>
  );

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={className} aria-disabled={loading || undefined}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonProps;
  return (
    <button
      type={buttonProps.type ?? "button"}
      onClick={buttonProps.onClick}
      disabled={buttonProps.disabled || loading}
      aria-busy={loading || undefined}
      className={className}
    >
      {content}
    </button>
  );
}
