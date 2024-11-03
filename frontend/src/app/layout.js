import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import { Navbar } from "@/components/navbar";

export const metadata = {
  title: "AgentTrace",
  description: "View telemetry from your LLM Agents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen bg-primary-bg text-primary-fg">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}