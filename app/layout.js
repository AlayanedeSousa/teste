import "./globals.css";
import { content } from "./content";

export const metadata = {
  title: content.siteTitle,
  description: content.siteDescription,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
