import {ConfigFormSection, GenericConfigFormSection} from '../config/global-config.model';
import {T} from '../../t.const';
import {Project, ProjectThemeCfg} from './project.model';

const HUES = [
  {value: '50', label: '50'},
  {value: '100', label: '100'},
  {value: '200', label: '200'},
  {value: '300', label: '300'},
  {value: '400', label: '400'},
  {value: '500', label: '500'},
  {value: '600', label: '600'},
  {value: '700', label: '700'},
  {value: '800', label: '800'},
  {value: '900', label: '900'},
];

export const PROJECT_THEME_CONFIG_FORM_CONFIG: ConfigFormSection<ProjectThemeCfg> = {
  title: T.F.PROJECT.FORM_THEME.TITLE,
  key: 'basic',
  help: T.F.PROJECT.FORM_THEME.HELP,
  items: [
    {
      key: 'primary',
      type: 'input',
      templateOptions: {
        label: T.F.PROJECT.FORM_THEME.L_COLOR_PRIMARY,
        type: 'color',
      },
    },
    {
      key: 'accent',
      type: 'input',
      templateOptions: {
        label: T.F.PROJECT.FORM_THEME.L_COLOR_ACCENT,
        type: 'color',
      },
    },
    {
      key: 'warn',
      type: 'input',
      templateOptions: {
        label: T.F.PROJECT.FORM_THEME.L_COLOR_WARN,
        type: 'color',
      },
    },
    {
      key: 'isAutoContrast',
      type: 'checkbox',
      templateOptions: {
        label: T.F.PROJECT.FORM_THEME.L_IS_AUTO_CONTRAST,
      },
    },
    {
      key: 'huePrimary',
      type: 'select',
      hideExpression: 'model.isAutoContrast',
      templateOptions: {
        required: true,
        label: T.F.PROJECT.FORM_THEME.L_HUE_PRIMARY,
        options: HUES,
        valueProp: 'value',
        labelProp: 'label',
        placeholder: T.F.PROJECT.FORM_THEME.L_HUE_PRIMARY
      },
    },
    {
      key: 'hueAccent',
      type: 'select',
      hideExpression: 'model.isAutoContrast',
      templateOptions: {
        required: true,
        label: T.F.PROJECT.FORM_THEME.L_HUE_ACCENT,
        options: HUES,
        valueProp: 'value',
        labelProp: 'label',
        placeholder: T.F.PROJECT.FORM_THEME.L_HUE_ACCENT
      },
    },
    {
      key: 'hueWarn',
      type: 'select',
      hideExpression: 'model.isAutoContrast',
      templateOptions: {
        required: true,
        label: T.F.PROJECT.FORM_THEME.L_HUE_WARN,
        options: HUES,
        valueProp: 'value',
        labelProp: 'label',
        placeholder: T.F.PROJECT.FORM_THEME.L_HUE_WARN
      },
    },
  ]
};


export const BASIC_PROJECT_CONFIG_FORM_CONFIG: ConfigFormSection<Project> = {
  title: T.F.PROJECT.FORM_BASIC.TITLE,
  key: 'basic',
  items: [
    {
      key: 'title',
      type: 'input',
      templateOptions: {
        required: true,
        label: T.F.PROJECT.FORM_BASIC.L_TITLE,
      },
    },
  ]
};

export const CREATE_PROJECT_BASIC_CONFIG_FORM_CONFIG: GenericConfigFormSection = {
  title: 'Project Settings & Theme',
  key: 'basic',
  /* tslint:disable */
  help: `Very basic settings for your project.`,
  /* tslint:enable */
  items: [
    {
      key: 'title',
      type: 'input',
      templateOptions: {
        required: true,
        label: 'Title',
      },
    },
    {
      key: 'theme.primary',
      type: 'input',
      templateOptions: {
        label: T.F.PROJECT.FORM_THEME.L_THEME_COLOR,
        type: 'color',
      },
    },
  ]
};
