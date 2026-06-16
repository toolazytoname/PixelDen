interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { icon: 20, text: 16, gap: 6, gapClass: "gap-1.5" },
  md: { icon: 28, text: 20, gap: 10, gapClass: "gap-2.5" },
  lg: { icon: 48, text: 28, gap: 14, gapClass: "gap-3.5" },
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const s = SIZES[size];

  return (
    <div className={`flex items-center ${s.gapClass} ${className}`}>
      {/* Abstract pixel den logo — a stylized "den" formed by nested squares */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Pixel Den logo"
      >
        {/* Outer frame */}
        <rect
          x="2"
          y="2"
          width="24"
          height="24"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/60"
        />
        {/* Inner pixel — represents a single tile/block */}
        <rect
          x="9"
          y="9"
          width="10"
          height="10"
          rx="2"
          fill="currentColor"
          className="text-accent"
        />
        {/* Corner accent — top-left pixel cutout */}
        <rect
          x="5"
          y="5"
          width="3"
          height="3"
          rx="0.5"
          fill="currentColor"
          className="text-foreground/30"
        />
      </svg>
      <span
        className="font-bold tracking-tight"
        style={{ fontSize: s.text + "px" }}
      >
        Pixel<span className="text-accent">Den</span>
      </span>
    </div>
  );
}
