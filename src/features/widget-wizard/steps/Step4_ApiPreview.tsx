import { Stack, Button, Text, Group, Badge, Alert, ScrollArea } from '@mantine/core'
import { IconPlayerPlay, IconAlertCircle } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { executeWidgetRequest } from '@/services/proxy.service'
import { JsonViewer } from '@/components/JsonViewer'
import type { ApiConfig } from '@/types'

export function Step4_ApiPreview() {
  const {
    draft,
    apiPreviewResponse,
    apiPreviewStatus,
    apiPreviewLatencyMs,
    isTesting,
    testError,
    setApiPreview,
    setTesting,
    setTestError,
  } = useWidgetWizardStore()

  const apiConfig = (draft as { apiConfig?: ApiConfig }).apiConfig

  const runTest = async () => {
    if (!apiConfig?.url) return
    setTesting(true)
    try {
      const result = await executeWidgetRequest({ apiConfig })
      setApiPreview(result.data, result.status, result.latencyMs)
      setTesting(false)
    } catch (err) {
      setTestError((err as Error).message)
    }
  }

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Test your API endpoint</Text>

      {!apiConfig?.url && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          Please configure an API URL in the previous step first.
        </Alert>
      )}

      <Group>
        <Button
          leftSection={<IconPlayerPlay size={14} />}
          loading={isTesting}
          disabled={!apiConfig?.url}
          onClick={() => void runTest()}
          size="sm"
        >
          Run Test Request
        </Button>
        {apiPreviewStatus && (
          <Badge color={apiPreviewStatus < 300 ? 'green' : 'red'}>
            {apiPreviewStatus}
          </Badge>
        )}
        {apiPreviewLatencyMs !== null && apiPreviewLatencyMs !== undefined && (
          <Text size="xs" c="dimmed">{apiPreviewLatencyMs}ms</Text>
        )}
      </Group>

      {testError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Request failed">
          {testError}
        </Alert>
      )}

      {apiPreviewResponse !== null && !testError && (
        <ScrollArea h={300} style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }} p="sm">
          <JsonViewer data={apiPreviewResponse} />
        </ScrollArea>
      )}
    </Stack>
  )
}
