import {Task} from '../tasks/task.model';
import {WeeksInMonth} from '../../util/get-weeks-in-month';
import {RoundTimeOption} from '../project/project.model';

export interface WorklogTask extends Task {
  dateStr?: string;
}

export interface WorklogDataForDay {
  timeSpent: number;
  task: WorklogTask;
  parentId: string;
  isNoRestore?: boolean;
}

export interface WorklogDay {
  timeSpent: number;
  logEntries: WorklogDataForDay[];
  dateStr: string;
  dayStr: string;
  workStart: number;
  workEnd: number;
}

export interface WorklogWeek extends WeeksInMonth {
  weekNr: number;
  timeSpent: number;
  daysWorked: number;
  ent: {
    [key: number]: WorklogDay;
  };
}

export interface WorklogMonth {
  timeSpent: number;
  daysWorked: number;
  ent: {
    [key: number]: WorklogDay;
  };
  weeks: WorklogWeek[];
}

export interface WorklogYear {
  timeSpent: number;
  monthWorked: number;
  daysWorked: number;

  ent: {
    [key: number]: WorklogMonth;
  };
}

export interface Worklog {
  [key: number]: WorklogYear;
}


export type WorklogColTypes =
  'EMPTY'
  | 'DATE'
  | 'START'
  | 'END'
  | 'TITLES'
  | 'TITLES_INCLUDING_SUB'
  | 'TIME_MS'
  | 'TIME_STR'
  | 'TIME_CLOCK'
  | 'ESTIMATE_MS'
  | 'ESTIMATE_STR'
  | 'ESTIMATE_CLOCK'
  ;

export enum WorklogGrouping {
  DATE = 'DATE',
  PARENT = 'PARENT',
  TASK = 'TASK',
  WORKLOG = 'WORKLOG'
}

export interface WorklogExportSettingsCopy {
  roundWorkTimeTo: RoundTimeOption;
  roundStartTimeTo: RoundTimeOption;
  roundEndTimeTo: RoundTimeOption;
  separateTasksBy: string;
  cols: WorklogColTypes[];
  groupBy: WorklogGrouping;
}

export type WorklogExportSettings = Readonly<WorklogExportSettingsCopy>;
