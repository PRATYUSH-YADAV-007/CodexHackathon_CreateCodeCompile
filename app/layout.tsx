import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeCompile | Think before you code",
  description: "A guided learning platform for computational thinking."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
