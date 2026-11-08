export type SkeletonPreset = "bar" | "barWide" | "barNarrow" | "pill" | "avatarRow" | "link" | "actions" | "icon";

const presetSize: Record<SkeletonPreset, string> = {
  bar: "h-4 w-24 max-w-full",
  barWide: "h-4 w-40 max-w-full",
  barNarrow: "h-4 w-16 max-w-full",
  pill: "h-[26px] w-20 rounded-[4px]",
  link: "h-4 w-28 max-w-full",
  actions: "h-8 w-28 max-w-full",
  icon: "h-8 w-8 rounded-[4px]",
  avatarRow: "h-8 w-44 max-w-full",
};

export function SkeletonBar({ preset = "bar", className = "" }: { preset?: SkeletonPreset; className?: string }) {
  return <span className={`skeleton-shimmer block rounded-[4px] ${presetSize[preset]} ${className}`} aria-hidden />;
}

export function AvatarRowSkeleton() {
  return (
    <span className="flex items-center gap-2" aria-hidden>
      <span className="skeleton-shimmer h-8 w-8 shrink-0 rounded-full" />
      <span className="skeleton-shimmer h-4 w-32 max-w-full rounded-[4px]" />
    </span>
  );
}

export function ActionsSkeleton() {
  return (
    <span className="flex gap-1" aria-hidden>
      <SkeletonBar preset="icon" />
      <SkeletonBar preset="icon" />
      <SkeletonBar preset="icon" />
    </span>
  );
}

export function skeletonCell(preset: SkeletonPreset) {
  if (preset === "avatarRow") return <AvatarRowSkeleton />;
  if (preset === "actions") return <ActionsSkeleton />;
  return <SkeletonBar preset={preset} />;
}

export const FILTER_EMPTY_HINT = "Thử đổi bộ lọc hoặc đặt lại";
