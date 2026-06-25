import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@dreamlake/uikit'

export const BasicSpec = () => (
  <Card size="md" style={{ width: 320 }}>
    <CardHeader>
      <div>
        <CardTitle>Dataset</CardTitle>
        <CardDescription>1,204 episodes · updated 2h ago</CardDescription>
      </div>
      <Button size="sm" variant="ghost">
        ⋯
      </Button>
    </CardHeader>
    <CardContent className="pt-3 text-uikit-12 text-uikit-muted">
      A container with a panel surface, a hairline border and token-scaled padding.
    </CardContent>
    <CardFooter className="pt-3 justify-end">
      <Button size="sm" variant="secondary">
        Open
      </Button>
    </CardFooter>
  </Card>
)
