import "./globals.css";

export const metadata = {
  title: "Frontend CRUD Next.js",
  description: "Antarmuka Next.js untuk backend Express CRUD",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
