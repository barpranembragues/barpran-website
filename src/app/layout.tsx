import type { Metadata, Viewport } from "next";
import { Saira, Saira_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/content";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const sans = Saira({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const display = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.slogan}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.descripcion,
  keywords: [
    "embragues",
    "embragues de competición",
    "transmisión alto rendimiento",
    "ingeniería de embragues",
    "fabricación de embragues",
    "reconstrucción de embragues",
    "multidisco",
    "twin disc",
    "automovilismo",
    "BARPRAN",
    "Argentina",
  ],
  authors: [{ name: "BARPRAN" }],
  creator: "BARPRAN",
  applicationName: "BARPRAN",
  alternates: { canonical: SITE.url },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.slogan}`,
    description: SITE.descripcion,
    images: [{ url: "/logo-barpran.png", width: 1784, height: 882, alt: "BARPRAN" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.slogan}`,
    description: SITE.descripcion,
    images: ["/logo-barpran.png"],
  },
  icons: {
    icon: "/logo-barpran.png",
    apple: "/logo-barpran.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  slogan: SITE.slogan,
  foundingDate: String(SITE.anioFundacion),
  description: SITE.descripcion,
  email: SITE.email,
  telephone: SITE.telefono,
  address: {
    "@type": "PostalAddress",
    addressCountry: "AR",
    addressLocality: "Buenos Aires",
  },
  areaServed: "AR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SmoothScroll>
          <Header />
          <main>{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
