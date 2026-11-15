export const metadata = {
  title: 'NGX Stocks',
  description: 'Clean iOS-style Nigerian Exchange Watchlist',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NGX Stocks',
  },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#000000',
          color: '#FFFFFF',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {children}
      </body>
    </html>
  );
}
