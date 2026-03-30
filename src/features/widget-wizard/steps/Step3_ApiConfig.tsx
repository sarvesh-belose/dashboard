import { Stack, TextInput, Select, Textarea, Accordion, PasswordInput, Text } from '@mantine/core'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { KeyValueEditor } from '@/components/KeyValueEditor'
import { AUTH_TYPE_LABELS } from '@/constants/auth.constants'
import type { ApiConfig, AuthType, HttpMethod } from '@/types'

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const AUTH_TYPES = Object.entries(AUTH_TYPE_LABELS).map(([value, label]) => ({ value, label }))

const defaultApiConfig: ApiConfig = {
  url: '',
  method: 'GET',
  headers: {},
  queryParams: {},
  body: undefined,
  auth: { type: 'none' },
  timeoutMs: 10000,
}

export function Step3_ApiConfig() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const apiConfig: ApiConfig = (draft as { apiConfig?: ApiConfig }).apiConfig ?? defaultApiConfig

  const set = (partial: Partial<ApiConfig>) =>
    updateDraft({ apiConfig: { ...apiConfig, ...partial } } as never)

  return (
    <Stack gap="sm">
      <Text fw={600} size="sm">API Configuration</Text>

      <TextInput
        label="Endpoint URL"
        placeholder="https://api.example.com/data"
        required
        value={apiConfig.url}
        onChange={(e) => set({ url: e.currentTarget.value })}
        size="sm"
      />

      <Select
        label="HTTP Method"
        data={METHODS}
        value={apiConfig.method}
        onChange={(v) => set({ method: v as HttpMethod })}
        size="sm"
        w={140}
      />

      <Accordion variant="contained" radius="sm">
        <Accordion.Item value="auth">
          <Accordion.Control>Authentication</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <Select
                label="Auth Type"
                data={AUTH_TYPES}
                value={apiConfig.auth.type}
                onChange={(v) => set({ auth: { type: v as AuthType } as ApiConfig['auth'] })}
                size="xs"
              />
              {apiConfig.auth.type === 'bearer' && (
                <PasswordInput
                  label="Token"
                  placeholder="${env.REACT_APP_TOKEN} or literal value"
                  value={'token' in apiConfig.auth ? apiConfig.auth.token : ''}
                  onChange={(e) =>
                    set({ auth: { type: 'bearer', token: e.currentTarget.value } })
                  }
                  size="xs"
                />
              )}
              {apiConfig.auth.type === 'api-key' && (
                <>
                  <TextInput
                    label="Header Name"
                    placeholder="X-API-Key"
                    value={'headerName' in apiConfig.auth ? apiConfig.auth.headerName : ''}
                    onChange={(e) =>
                      set({
                        auth: {
                          ...apiConfig.auth,
                          type: 'api-key',
                          headerName: e.currentTarget.value,
                        } as ApiConfig['auth'],
                      })
                    }
                    size="xs"
                  />
                  <PasswordInput
                    label="Value"
                    value={'value' in apiConfig.auth ? (apiConfig.auth as { value: string }).value : ''}
                    onChange={(e) =>
                      set({
                        auth: {
                          ...apiConfig.auth,
                          type: 'api-key',
                          value: e.currentTarget.value,
                        } as ApiConfig['auth'],
                      })
                    }
                    size="xs"
                  />
                </>
              )}
              {apiConfig.auth.type === 'basic' && (
                <>
                  <TextInput
                    label="Username"
                    value={'username' in apiConfig.auth ? apiConfig.auth.username : ''}
                    onChange={(e) =>
                      set({
                        auth: { ...apiConfig.auth, type: 'basic', username: e.currentTarget.value } as ApiConfig['auth'],
                      })
                    }
                    size="xs"
                  />
                  <PasswordInput
                    label="Password"
                    value={'password' in apiConfig.auth ? apiConfig.auth.password : ''}
                    onChange={(e) =>
                      set({
                        auth: { ...apiConfig.auth, type: 'basic', password: e.currentTarget.value } as ApiConfig['auth'],
                      })
                    }
                    size="xs"
                  />
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="headers">
          <Accordion.Control>Headers</Accordion.Control>
          <Accordion.Panel>
            <KeyValueEditor
              value={apiConfig.headers}
              onChange={(headers) => set({ headers })}
              keyPlaceholder="Header name"
              valuePlaceholder="Header value"
            />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="params">
          <Accordion.Control>Query Params</Accordion.Control>
          <Accordion.Panel>
            <KeyValueEditor
              value={apiConfig.queryParams}
              onChange={(queryParams) => set({ queryParams })}
              keyPlaceholder="Param name"
              valuePlaceholder="Param value"
            />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="body">
          <Accordion.Control>Request Body (JSON)</Accordion.Control>
          <Accordion.Panel>
            <Textarea
              placeholder='{"key": "value"}'
              value={apiConfig.body ?? ''}
              onChange={(e) => set({ body: e.currentTarget.value || undefined })}
              rows={5}
              styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
            />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  )
}
