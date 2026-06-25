import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  Button,
} from '@dreamlake/uikit'

export const BasicSpec = () => (
  <Drawer direction="right">
    <DrawerTrigger asChild>
      <Button size="sm" variant="secondary">
        Open filters
      </Button>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Filters</DrawerTitle>
        <DrawerDescription>Refine the dataset list.</DrawerDescription>
      </DrawerHeader>
      <div style={{ flex: 1 }} />
      <DrawerFooter>
        <DrawerClose asChild>
          <Button size="sm">Apply</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
)
