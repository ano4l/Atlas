import type { ReactNode } from "react";

export const metadata = {
  title: "Venue & Advertising Dashboard",
  description: "Map management, advertising, and analytics operator console (techspec.md §9).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
