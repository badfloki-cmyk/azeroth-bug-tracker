import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../src/index.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Bungee × Astro | Azeroth Bug Tracker",
    description: "Classic / TBC AIO Bug Report & Class Tracker",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
