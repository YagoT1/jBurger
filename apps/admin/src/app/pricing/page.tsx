import { Badge, Card, CardHeader, CardTitle, PageShell, Stack } from '@jburger/ui';
export default function Page() {
  return (
    <PageShell>
      <Stack>
        <Badge>Commerce Foundation</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <p>
            List, detail, create, edit, archive, and delete confirmation foundation for pricing.
          </p>
        </Card>
      </Stack>
    </PageShell>
  );
}
