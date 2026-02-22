import "./globals.css";

export const metadata = {
  title: "LocalRoots - Black Business Support",
  description: "Shop, earn, and invest in Black-owned businesses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
