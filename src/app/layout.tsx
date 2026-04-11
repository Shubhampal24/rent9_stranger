import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

import { Toaster } from 'react-hot-toast';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-gray-950 text-white dark:bg-gray-950`}>
        <ThemeProvider>
          <SidebarProvider>
            {children}
            <Toaster 
              position="top-center"
              containerStyle={{ zIndex: 100001 }}
            />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
