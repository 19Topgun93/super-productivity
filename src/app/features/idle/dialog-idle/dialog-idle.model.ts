import { Task } from '../../tasks/task.model';
import { SimpleCounter } from '../../simple-counter/simple-counter.model';

export interface SimpleCounterIdleBtn {
  id: string;
  icon: string | null;
  isTrackTo: boolean;
  isWasEnabledBefore: boolean;
  title: string;
}

export interface DialogIdleReturnData {
  task: null | Task | string | undefined;
  isResetBreakTimer: boolean;
  isTrackAsBreak: boolean;
}

export interface DialogIdlePassedData {
  enabledSimpleStopWatchCounters: SimpleCounter[];
  lastCurrentTaskId: string | null;
}
