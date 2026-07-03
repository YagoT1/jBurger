import { Badge, Card, CardHeader, CardTitle, PageShell, Stack } from '@jburger/ui';
export default function Page() {
  return (
    <PageShell>
      <Stack>
        <Badge>Ordering Foundation</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <p>
            Admin ordering operations foundation for list, detail, timeline, draft, cancelled, and
            validation workflows.
          </p>
        </Card>
      </Stack>
    </PageShell>
  );
}
