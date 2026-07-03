import { Badge, Card, CardHeader, CardTitle, PageShell, Stack } from '@jburger/ui';
export default function Page() {
  return (
    <PageShell>
      <Stack>
        <Badge>Ordering Foundation</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <p>
            Responsive accessible customer ordering foundation with loading, empty, error, and
            telemetry hooks ready.
          </p>
        </Card>
      </Stack>
    </PageShell>
  );
}
