import './globals.css';
export const metadata = { title: 'jBurger Admin', description: 'Foundation application shell' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
