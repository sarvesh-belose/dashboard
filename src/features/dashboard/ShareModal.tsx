import { useState, useMemo, useRef } from 'react'
import {
  Modal, Tabs, Stack, Text, Select, Switch, Button, Group, Textarea,
  Alert, NumberInput, Badge, CopyButton, Tooltip, ActionIcon, Box,
} from '@mantine/core'
import {
  IconLink, IconDownload, IconCode, IconCheck, IconCopy,
  IconAlertTriangle, IconUpload,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDashboardStore } from '@/store/dashboard.store'
import { useFilterStore } from '@/store/filter.store'
import {
  buildShareUrl, exportDashboardJson, importDashboardJson, SHARE_URL_WARN_LENGTH,
} from '@/services/share.service'
import type { ShareOptions } from '@/services/share.service'
import type { Filter } from '@/types'

interface Props {
  opened: boolean
  onClose: () => void
}

const ROLE_OPTIONS = [
  { value: 'viewer',  label: 'Viewer — read-only, sees public widgets' },
  { value: 'user',    label: 'User — standard access' },
  { value: 'manager', label: 'Manager — elevated access' },
  { value: 'all',     label: 'All roles — same as dashboard owner' },
]

export function ShareModal({ opened, onClose }: Props) {
  const { dashboard, widgets } = useDashboardStore()
  const filters = useFilterStore((s) => s.filters)

  const [viewRole, setViewRole] = useState<ShareOptions['viewRole']>('viewer')
  const [includeCredentials, setIncludeCredentials] = useState(false)
  const [embedHeight, setEmbedHeight] = useState<number>(600)

  const data = useMemo(() => {
    if (!dashboard) return null
    return { dashboard, widgets: Object.values(widgets), filters: filters as Filter[] }
  }, [dashboard, widgets, filters])

  const shareUrl = useMemo(() => {
    if (!data) return ''
    return buildShareUrl(data, { includeCredentials, viewRole })
  }, [data, includeCredentials, viewRole])

  const embedCode = useMemo(() => {
    if (!shareUrl) return ''
    const src = shareUrl + (shareUrl.includes('?') ? '&' : '?').replace('?', '&') + 'embed=1'
    // shareUrl already has # fragment — append embed param to the query string part
    const url = new URL(shareUrl)
    url.searchParams.set('embed', '1')
    const finalSrc = url.origin + url.pathname + url.search + url.hash
    return `<iframe\n  src="${finalSrc}"\n  width="100%"\n  height="${embedHeight}px"\n  frameborder="0"\n  allowfullscreen\n></iframe>`
  }, [shareUrl, embedHeight])

  // Import JSON
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (file: File) => {
    try {
      const imported = await importDashboardJson(file)
      useDashboardStore.getState().setDashboard(imported.dashboard, imported.widgets)
      notifications.show({
        title: 'Dashboard imported',
        message: `"${imported.dashboard.name}" loaded successfully.`,
        color: 'green',
      })
      onClose()
    } catch (e) {
      notifications.show({
        title: 'Import failed',
        message: (e as Error).message,
        color: 'red',
      })
    }
  }

  if (!data) return null

  return (
    <Modal opened={opened} onClose={onClose} title="Share Dashboard" size="lg" centered>
      <Tabs defaultValue="link">
        <Tabs.List mb="md">
          <Tabs.Tab value="link"    leftSection={<IconLink    size={14} />}>Copy Link</Tabs.Tab>
          <Tabs.Tab value="export"  leftSection={<IconDownload size={14} />}>Export JSON</Tabs.Tab>
          <Tabs.Tab value="embed"   leftSection={<IconCode    size={14} />}>Embed Code</Tabs.Tab>
        </Tabs.List>

        {/* ── Copy Link ───────────────────────────────────────────────────── */}
        <Tabs.Panel value="link">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Generate a shareable URL that opens this dashboard in read-only mode.
              Recipients cannot edit widgets or save changes.
            </Text>

            <Select
              label="Recipient can view as"
              description="Controls which role-restricted widgets are visible to the recipient"
              value={viewRole}
              onChange={(v) => setViewRole((v ?? 'viewer') as ShareOptions['viewRole'])}
              data={ROLE_OPTIONS}
            />

            <Switch
              label="Include API credentials"
              description="Include auth tokens and API keys in the link (only share with trusted parties)"
              checked={includeCredentials}
              onChange={(e) => setIncludeCredentials(e.currentTarget.checked)}
              color="orange"
            />

            {includeCredentials && (
              <Alert icon={<IconAlertTriangle size={14} />} color="orange" p="xs">
                <Text size="xs">
                  This link will contain your API auth tokens and headers.
                  Only share with people you fully trust.
                </Text>
              </Alert>
            )}

            {!includeCredentials && (
              <Alert color="blue" p="xs">
                <Text size="xs">
                  API credentials are <strong>excluded</strong> from this link.
                  Widgets that require authentication may show errors for the recipient.
                </Text>
              </Alert>
            )}

            <Box>
              <Text size="xs" fw={500} mb={4}>Link preview</Text>
              <Group gap="xs" align="flex-start">
                <Textarea
                  value={shareUrl}
                  readOnly
                  autosize
                  minRows={2}
                  maxRows={4}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }}
                />
                <CopyButton value={shareUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy link'} withArrow>
                      <ActionIcon
                        color={copied ? 'teal' : 'blue'}
                        variant="light"
                        size="lg"
                        onClick={copy}
                        mt={2}
                      >
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                {shareUrl.length.toLocaleString()} characters
              </Text>
              {shareUrl.length > SHARE_URL_WARN_LENGTH && (
                <Alert icon={<IconAlertTriangle size={14} />} color="yellow" p="xs" mt={4}>
                  <Text size="xs">
                    This dashboard is very large ({shareUrl.length.toLocaleString()} characters).
                    Some browsers or tools may truncate long URLs.
                    Consider using <strong>Export JSON</strong> instead.
                  </Text>
                </Alert>
              )}
            </Box>
          </Stack>
        </Tabs.Panel>

        {/* ── Export JSON ─────────────────────────────────────────────────── */}
        <Tabs.Panel value="export">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Download the full dashboard configuration as a JSON file.
              Use this to back up your dashboard, migrate to another instance, or
              integrate with external systems.
            </Text>

            <Alert icon={<IconAlertTriangle size={14} />} color="orange" p="xs">
              <Text size="xs">
                The exported file <strong>includes all API credentials</strong> (auth tokens,
                API keys, headers). Store it securely and do not share publicly.
              </Text>
            </Alert>

            <Group>
              <Button
                leftSection={<IconDownload size={14} />}
                onClick={() => exportDashboardJson(data, dashboard!.name)}
              >
                Download JSON
              </Button>

              <CopyButton value={JSON.stringify(data, null, 2)} timeout={2000}>
                {({ copied, copy }) => (
                  <Button
                    variant="light"
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    color={copied ? 'teal' : 'blue'}
                    onClick={copy}
                  >
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </Button>
                )}
              </CopyButton>
            </Group>

            <Text size="xs" c="dimmed">
              Exported file will contain {Object.keys(widgets).length} widget{Object.keys(widgets).length !== 1 ? 's' : ''} and {filters.length} filter{filters.length !== 1 ? 's' : ''}.
            </Text>
          </Stack>
        </Tabs.Panel>

        {/* ── Embed Code ──────────────────────────────────────────────────── */}
        <Tabs.Panel value="embed">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Paste this code into Confluence, Notion, or any HTML page to embed
              this dashboard. The embed loads in read-only mode without the toolbar.
            </Text>

            <Group align="flex-end">
              <NumberInput
                label="Height (px)"
                value={embedHeight}
                onChange={(v) => setEmbedHeight(Number(v) || 600)}
                min={200}
                max={2000}
                step={50}
                style={{ width: 140 }}
              />
              <Badge variant="dot" color="blue">Role: {viewRole}</Badge>
              <Text size="xs" c="dimmed">Uses the same role set in Copy Link tab</Text>
            </Group>

            <Box>
              <Text size="xs" fw={500} mb={4}>Embed snippet</Text>
              <Group gap="xs" align="flex-start">
                <Textarea
                  value={embedCode}
                  readOnly
                  autosize
                  minRows={5}
                  maxRows={8}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }}
                />
                <CopyButton value={embedCode} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy code'} withArrow>
                      <ActionIcon
                        color={copied ? 'teal' : 'blue'}
                        variant="light"
                        size="lg"
                        onClick={copy}
                        mt={2}
                      >
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>

            <Alert color="blue" p="xs">
              <Text size="xs">
                The embedded view hides the toolbar and filter bar for a clean display.
                Widgets still respect RBAC visibility rules for the <strong>{viewRole}</strong> role.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Import section at bottom of modal */}
      <Box mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text size="sm" fw={500}>Import Dashboard</Text>
            <Text size="xs" c="dimmed">Load a previously exported JSON file</Text>
          </Stack>
          <Button
            variant="light"
            leftSection={<IconUpload size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImport(file)
              e.target.value = ''
            }}
          />
        </Group>
      </Box>
    </Modal>
  )
}
