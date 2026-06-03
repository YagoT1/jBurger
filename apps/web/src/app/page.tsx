import { Badge, Card, CardHeader, CardTitle, PageShell, Stack } from '@jburger/ui';
import { env } from '../env.js';
export default function Page() { return <PageShell><Stack><Badge>Foundation</Badge><Card><CardHeader><CardTitle>jBurger Web</CardTitle></CardHeader><p>Aplicación ejecutable lista para Wave 1.</p><p>API: {env.NEXT_PUBLIC_API_URL}</p></Card></Stack></PageShell>; }
