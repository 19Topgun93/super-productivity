import {IssueProviderKey} from '../issue/issue.model';
import {Reminder} from '../reminder/reminder.model';
import {EntityState} from '@ngrx/entity';

export enum ShowSubTasksMode {
  HideAll = 0,
  HideDone = 1,
  Show = 2,
}

export enum TaskAdditionalInfoTargetPanel {
  Default = 'Default',
  Attachments = 'Attachments',
}

export type DropListModelSource = 'UNDONE' | 'DONE' | 'BACKLOG';

export interface TimeSpentOnDayCopy {
  [key: string]: number;
}

export type TaskArchive = EntityState<Task>;

export type TimeSpentOnDay = Readonly<TimeSpentOnDayCopy>;

export interface TaskCopy {
  id: string;
  projectId: string;
  title: string;

  subTaskIds: string[];
  timeSpentOnDay: TimeSpentOnDay;
  timeSpent: number;
  timeEstimate: number;

  created: number;
  isDone: boolean;

  notes: string;

  parentId: string;
  attachmentIds: string[];
  reminderId: string;
  repeatCfgId: string;

  // issue stuff
  issueId: string;
  issueType: IssueProviderKey;
  issueWasUpdated: boolean;
  issueLastUpdated: number;
  issueAttachmentNr: number;
  issuePoints: number;

  // ui model
  // 0: show, 1: hide-done tasks, 2: hide all sub tasks
  _showSubTasksMode: ShowSubTasksMode;
}

export type Task = Readonly<TaskCopy>;

export interface TaskWithReminderData extends Task {
  readonly reminderData: Reminder;
}

export interface TaskWithSubTasks extends Task {
  readonly subTasks?: Task[];
}


export const DEFAULT_TASK: Task = {
  id: null,
  projectId: null,
  subTaskIds: [],
  attachmentIds: [],
  timeSpentOnDay: {},
  timeSpent: 0,
  timeEstimate: 0,
  isDone: false,
  title: '',
  notes: '',
  parentId: null,
  reminderId: null,
  created: Date.now(),
  repeatCfgId: null,

  _showSubTasksMode: ShowSubTasksMode.Show,

  issueId: null,
  issuePoints: null,
  issueType: null,
  issueAttachmentNr: null,
  issueLastUpdated: null,
  issueWasUpdated: null,
};

export const SHORT_SYNTAX_REG_EX = / t?(([0-9]+(m|h|d)+)? *\/ *)?([0-9]+(m|h|d)+) *$/i;

export interface TaskState extends EntityState<Task> {
  // overwrite entity model to avoid problems with typing
  ids: string[];

  // additional entities state properties
  currentTaskId: string | null;
  selectedTaskId: string | null;
  taskAdditionalInfoTargetPanel: TaskAdditionalInfoTargetPanel;
  lastCurrentTaskId: string | null;

  todaysTaskIds: string[];
  backlogTaskIds: string[];
  stateBefore: TaskState;
  isDataLoaded: boolean;
}
