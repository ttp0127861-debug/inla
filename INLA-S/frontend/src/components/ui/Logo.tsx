import { LAPRINT_WEBSITE } from "../../lib/brand";

type LogoProps = {
  className?: string;
  href?: string;
  linked?: boolean;
};

export function Logo({
  className = "h-[70px] w-[157px]",
  href = LAPRINT_WEBSITE,
  linked = true,
}: LogoProps) {
  const image = (
    <img
      src="/images/logo-laprint.png"
      alt="La Print — giải pháp bao bì"
      width={157}
      height={70}
      className={`object-contain ${className}`}
    />
  );

  if (!linked) {
    return image;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="La Print — mở website laprint.com.vn"
      className="inline-flex rounded-[var(--radius-md)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(99,53,23,0.25)]"
    >
      {image}
    </a>
  );
}
