import logo from "@/assets/logo.png";

export function AppLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="AstroAura AI"
      width={size}
      height={size}
      className="drop-shadow-[0_0_18px_rgba(168,85,247,0.6)] animate-float"
    />
  );
}