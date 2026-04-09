type SiteBackdropProps = {
  isDark: boolean;
};

export function SiteBackdrop({ isDark }: SiteBackdropProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? `radial-gradient(circle at top left, rgba(44,232,143,0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(44,232,143,0.08), transparent 34%), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 22px)`
            : `radial-gradient(circle at top left, rgba(10,138,91,0.10), transparent 28%), radial-gradient(circle at bottom right, rgba(10,138,91,0.06), transparent 34%), repeating-linear-gradient(90deg, rgba(16,19,26,0.04) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, rgba(16,19,26,0.03) 0 1px, transparent 1px 22px)`,
        }}
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${isDark ? "opacity-30" : "opacity-35"}`}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0.00) 100%)",
        }}
      />
    </>
  );
}