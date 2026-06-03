import { Button, Card, CardHeader, CardTitle, PageShell } from '@jburger/ui';
export default function SessionExpiredPage() { return <PageShell><Card role="alert"><CardHeader><CardTitle>Sesión expirada</CardTitle></CardHeader><p>Tu sesión expiró por seguridad. Vuelve a iniciar sesión.</p><Button>Volver al login</Button></Card></PageShell>; }
