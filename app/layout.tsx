import type { Metadata } from "next";
import "./../styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import AuthListener from "@/components/custom/auth-listener";

// Font loading is disabled to avoid network dependency during build
// Using system fonts as fallback via Tailwind's font-sans
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personalized News Aggregator",
  description: "Your daily news, curated for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased">
            <ToastProvider>
                <AuthListener />
                {children}
            </ToastProvider>
        </body>
    </html>
  );
}