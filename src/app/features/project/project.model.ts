import {IssueIntegrationCfgs, IssueProviderKey} from '../issue/issue.model';
import {NoteState} from '../note/store/note.reducer';
import {BookmarkState} from '../bookmark/store/bookmark.reducer';
import {EntityState} from '@ngrx/entity';
import {Task, TaskState} from '../tasks/task.model';
import {Attachment} from '../attachment/attachment.model';
import {MetricState} from '../metric/metric.model';
import {ImprovementState} from '../metric/improvement/improvement.model';
import {ObstructionState} from '../metric/obstruction/obstruction.model';
import {WorklogExportSettings} from '../worklog/worklog.model';
import {HueValue} from 'angular-material-css-vars';
import {Tag} from '../tag/tag.model';


export type RoundTimeOption = '5M' | 'QUARTER' | 'HALF' | 'HOUR';

export interface BreakTimeCopy {
  [key: string]: number;
}

export type BreakTime = Readonly<BreakTimeCopy>;

export interface BreakNrCopy {
  [key: string]: number;
}

export type BreakNr = Readonly<BreakNrCopy>;

export interface WorkStartEndCopy {
  [key: string]: number;
}

export type WorkStartEnd = Readonly<WorkStartEndCopy>;

export type ProjectAdvancedCfg = Readonly<{
  worklogExportSettings: WorklogExportSettings;
}>;

export type ProjectThemeCfg = Readonly<{
  isAutoContrast: boolean;
  isDisableBackgroundGradient: boolean;
  primary: string;
  huePrimary: HueValue;
  accent: string;
  hueAccent: HueValue;
  warn: string;
  hueWarn: HueValue;
}>;

export interface ProjectBasicCfg {
  title: string;
  /** @deprecated use new theme model instead. */
  themeColor?: string;
  /** @deprecated use new theme model instead. */
  isDarkTheme?: boolean;
  /** @deprecated use new theme model instead. */
  isReducedTheme?: boolean;
  isArchived: boolean;
  timeWorkedWithoutBreak: number;

  todaysTaskIds: string[];
  backlogTaskIds: string[];
}

export type ProjectAdvancedCfgKey = keyof ProjectAdvancedCfg;

export interface ProjectCopy extends ProjectBasicCfg {
  id: string;
  issueIntegrationCfgs: IssueIntegrationCfgs;
  advancedCfg: ProjectAdvancedCfg;
  workStart: WorkStartEnd;
  workEnd: WorkStartEnd;
  lastCompletedDay: string;
  breakTime: BreakTime;
  breakNr: BreakNr;
  theme: ProjectThemeCfg;
}

export type Project = Readonly<ProjectCopy>;

export interface ProjectArchivedRelatedData {
  note?: NoteState;
  bookmark?: BookmarkState;
  task?: TaskState;
  taskArchive?: EntityState<Task>;
  taskAttachment?: EntityState<Attachment>;
  taskTag?: EntityState<Tag>;
  metric?: MetricState;
  improvement?: ImprovementState;
  obstruction?: ObstructionState;
}

export interface ExportedProject extends Project {
  relatedModels: ProjectArchivedRelatedData;
}

export interface ProjectArchive {
  [key: string]: string;
}

export type ProjectCfgFormKey = ProjectAdvancedCfgKey | IssueProviderKey | 'basic' | 'theme';


