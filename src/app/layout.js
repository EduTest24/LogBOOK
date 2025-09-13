import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "LogBook",
  description: "Daily thoughts logging app",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <Toaster richColors position="top-right" />{" "}
        </body>
      </html>
    </ClerkProvider>
  );
}
