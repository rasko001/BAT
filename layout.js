import "./globals.css";
export const metadata = { title: "SellerDesk", description: "Write listings for Etsy, Shopify, eBay and Temu from one photo." };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
