import type { WidgetType } from '@/types'

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  chart: 'Chart',
  grid: 'Data Grid',
  text: 'Text / Markdown',
  custom: 'Custom Component',
}

export const WIDGET_DEFAULT_SIZES: Record<WidgetType, { w: number; h: number }> = {
  chart: { w: 6, h: 4 },
  grid: { w: 8, h: 5 },
  text: { w: 4, h: 2 },
  custom: { w: 6, h: 4 },
}

export const GRID_COLUMNS = { lg: 12, md: 10, sm: 6, xs: 4 }

export enum WizardStep {
  SelectType = 'select-type',
  BasicInfo = 'basic-info',
  ApiConfig = 'api-config',
  ApiPreview = 'api-preview',
  ResponseMapping = 'response-mapping',
  WidgetConfig = 'widget-config',
  RbacConfig = 'rbac-config',
  FilterBindings = 'filter-bindings',
  Preview = 'preview',
}

export const WIZARD_STEPS_FOR_TYPE: Record<WidgetType, WizardStep[]> = {
  chart: [
    WizardStep.SelectType,
    WizardStep.BasicInfo,
    WizardStep.ApiConfig,
    WizardStep.ApiPreview,
    WizardStep.ResponseMapping,
    WizardStep.WidgetConfig,
    WizardStep.RbacConfig,
    WizardStep.FilterBindings,
    WizardStep.Preview,
  ],
  grid: [
    WizardStep.SelectType,
    WizardStep.BasicInfo,
    WizardStep.ApiConfig,
    WizardStep.ApiPreview,
    WizardStep.ResponseMapping,
    WizardStep.WidgetConfig,
    WizardStep.RbacConfig,
    WizardStep.FilterBindings,
    WizardStep.Preview,
  ],
  text: [
    WizardStep.SelectType,
    WizardStep.BasicInfo,
    WizardStep.WidgetConfig,
    WizardStep.RbacConfig,
    WizardStep.FilterBindings,
    WizardStep.Preview,
  ],
  custom: [
    WizardStep.SelectType,
    WizardStep.BasicInfo,
    WizardStep.WidgetConfig,
    WizardStep.RbacConfig,
    WizardStep.FilterBindings,
    WizardStep.Preview,
  ],
}

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  [WizardStep.SelectType]: 'Widget Type',
  [WizardStep.BasicInfo]: 'Basic Info',
  [WizardStep.ApiConfig]: 'API Config',
  [WizardStep.ApiPreview]: 'Test API',
  [WizardStep.ResponseMapping]: 'Map Response',
  [WizardStep.WidgetConfig]: 'Configure',
  [WizardStep.RbacConfig]: 'Permissions',
  [WizardStep.FilterBindings]: 'Filter Bindings',
  [WizardStep.Preview]: 'Preview',
}
