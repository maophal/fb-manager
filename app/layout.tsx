import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LoadingProvider } from '@/context/LoadingContext';
import { AuthProvider } from '@/context/AuthContext'; // Removed useAuth
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react'; // Import Suspense
import MainContent from '../components/MainContent';
import ProgressBar from '../components/ProgressBar';
import ProgressLoader from '../components/ProgressLoader'; // Import the new ProgressLoader component

const geistSans = GeistSans;

const geistMono = GeistMono;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <LoadingProvider>
              <ProgressLoader />
              <Navbar />
                            <MainContent>
                <Suspense fallback={<div>Loading...</div>}> {/* Added fallback prop */}
                  <ProgressBar />
                  {children}
                </Suspense>
              </MainContent>
              <Footer />
              <Toaster />
            </LoadingProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}