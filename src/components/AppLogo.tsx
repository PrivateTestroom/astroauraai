import logo from "@/assets/logo.png";

export function AppLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="AstroAura AI"
      width={size}
      height={size}
      className="drop-shadow-[0_4px_14px_oklch(0.62_0.14_55_/_0.35)] animate-float"
    />
  );
}
