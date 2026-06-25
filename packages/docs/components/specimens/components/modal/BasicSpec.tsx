import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
  Button,
} from '@dreamlake/uikit'

export const BasicSpec = () => (
  <Modal>
    <ModalTrigger asChild>
      <Button size="sm">Invite teammates</Button>
    </ModalTrigger>
    <ModalContent>
      <ModalHeader>
        <ModalTitle>Invite teammates</ModalTitle>
        <ModalDescription>Send an invite link to your workspace.</ModalDescription>
      </ModalHeader>
      <ModalFooter>
        <ModalClose asChild>
          <Button size="sm" variant="secondary">
            Cancel
          </Button>
        </ModalClose>
        <ModalClose asChild>
          <Button size="sm">Send invite</Button>
        </ModalClose>
      </ModalFooter>
    </ModalContent>
  </Modal>
)
