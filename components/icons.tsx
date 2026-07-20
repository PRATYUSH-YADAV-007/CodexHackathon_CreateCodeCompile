type IconProps = { className?: string };
export function Mark({ className = "" }: IconProps) { return <span className={`grid h-9 w-9 place-items-center rounded-xl bg-[#6957D9] text-lg font-black text-white ${className}`}>C</span>; }
export function Arrow({ className = "" }: IconProps) { return <span className={`text-xl leading-none ${className}`}>→</span>; }
export function Sparkle() { return <span aria-hidden>✦</span>; }
