import './globals.css';
import { AppProviders } from '../providers/app-providers.js';
export const metadata = { title: 'jBurger Admin', description: 'Foundation application shell' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body><AppProviders>{children}</AppProviders></body></html>; }
