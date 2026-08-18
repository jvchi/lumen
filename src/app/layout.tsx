import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Lumen Pipeline Lab", description: "Metadata to playback pipeline proof of concept" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
