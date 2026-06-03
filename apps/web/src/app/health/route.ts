export function GET() { return Response.json({ status: 'ok', service: process.env.NEXT_PUBLIC_APP_ENV ?? 'local' }); }
