type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
};

export default function SkewButton({
  href,
  children,
  variant = "solid",
  className = "",
}: Props) {
  const base =
    "skewed group inline-flex items-center px-7 py-3.5 transition-all duration-500 ease-race";
  const styles =
    variant === "solid"
      ? "bg-barpran hover:bg-barpran-bright"
      : "border border-white/20 hover:border-barpran";

  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      <span className="flex items-center gap-3 font-mono text-[0.74rem] uppercase tracking-mega text-bone">
        {children}
        <span className="inline-block transition-transform duration-500 ease-race group-hover:translate-x-1">
          →
        </span>
      </span>
    </a>
  );
}
