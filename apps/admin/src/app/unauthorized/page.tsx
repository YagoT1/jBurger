import { Card, CardHeader, CardTitle, PageShell } from '@jburger/ui';
export default function UnauthorizedPage() { return <PageShell><Card role="alert"><CardHeader><CardTitle>Acceso no autorizado</CardTitle></CardHeader><p>No tienes permisos suficientes para ver esta sección.</p></Card></PageShell>; }
