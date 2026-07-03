import { Badge, Card, CardHeader, CardTitle, PageShell, Stack } from '@jburger/ui';
export default function Page() {
  return (
    <PageShell>
      <Stack>
        <Badge>Commerce Foundation</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Modifiers</CardTitle>
          </CardHeader>
          <p>
            List, detail, create, edit, archive, and delete confirmation foundation for modifiers.
          </p>
        </Card>
      </Stack>
    </PageShell>
  );
}
