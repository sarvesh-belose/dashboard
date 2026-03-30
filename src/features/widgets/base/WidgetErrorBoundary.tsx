import { Component, type ReactNode } from 'react'
import { Center, Stack, Text, Button } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center style={{ height: '100%' }}>
          <Stack align="center" gap="xs">
            <IconAlertCircle size={36} color="var(--mantine-color-red-6)" />
            <Text size="sm" c="red">
              {this.state.message || 'Something went wrong'}
            </Text>
            <Button
              size="xs"
              variant="light"
              color="red"
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              Retry
            </Button>
          </Stack>
        </Center>
      )
    }
    return this.props.children
  }
}
