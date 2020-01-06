import {ChangeDetectionStrategy, Component, Inject, OnDestroy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Reminder} from '../../reminder/reminder.model';
import {Task} from '../task.model';
import {TaskService} from '../task.service';
import {Observable, Subscription} from 'rxjs';
import {ReminderService} from '../../reminder/reminder.service';
import {take} from 'rxjs/operators';
import {ProjectService} from '../../project/project.service';
import {Project} from '../../project/project.model';
import {ScheduledTaskService} from '../scheduled-task.service';
import {Router} from '@angular/router';
import {T} from '../../../t.const';
import {DialogAddTaskReminderComponent} from '../dialog-add-task-reminder/dialog-add-task-reminder.component';
import {AddTaskReminderInterface} from '../dialog-add-task-reminder/add-task-reminder-interface';

@Component({
  selector: 'dialog-view-task-reminder',
  templateUrl: './dialog-view-task-reminder.component.html',
  styleUrls: ['./dialog-view-task-reminder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogViewTaskReminderComponent implements OnDestroy {
  T = T;
  task$: Observable<Task> = this._taskService.getById$(this.data.reminder.relatedId);
  task: Task;
  reminder: Reminder = this.data.reminder;
  isForCurrentProject = (this.reminder.projectId === this._projectService.currentId);
  targetProject$: Observable<Project> = this._projectService.getById$(this.reminder.projectId);
  isDisableControls = false;
  private _subs = new Subscription();

  constructor(
    private _matDialogRef: MatDialogRef<DialogViewTaskReminderComponent>,
    private _taskService: TaskService,
    private _scheduledTaskService: ScheduledTaskService,
    private _projectService: ProjectService,
    private _router: Router,
    private _matDialog: MatDialog,
    private _reminderService: ReminderService,
    @Inject(MAT_DIALOG_DATA) public data: { reminder: Reminder },
  ) {
    this._matDialogRef.disableClose = true;
    this._subs.add(this.task$.pipe(take(1)).subscribe(task => this.task = task));
    this._subs.add(this._reminderService.onReloadModel$.subscribe(() => {
      this._close();
    }));
  }

  get isError() {
    // just for this dialog we make an exception about using getters
    return !this.task && this.isForCurrentProject;
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  play() {
    this.isDisableControls = true;
    if (this.isForCurrentProject) {
      this._startTask();
      this.dismiss();
    } else {
      this._router.navigate(['/work-view']);
      // TODO probably better handled as effect
      this._subs.add(this._taskService.startTaskFromOtherProject$(this.reminder.relatedId, this.reminder.projectId).subscribe(() => {
        this.dismiss();
      }));
    }
  }

  dismiss() {
    this.isDisableControls = true;
    this._taskService.update(this.reminder.relatedId, {
      reminderId: null,
    });
    this._reminderService.removeReminder(this.reminder.id);
    this._close();
  }

  dismissReminderOnly() {
    this.isDisableControls = true;
    this._reminderService.removeReminder(this.reminder.id);
    this._close();
  }

  snooze(snoozeInMinutes) {
    this.isDisableControls = true;
    this._reminderService.updateReminder(this.reminder.id, {
      remindAt: Date.now() + (snoozeInMinutes * 60 * 1000)
    });
    this._close();
  }

  editReminder() {
    this.isDisableControls = true;
    this._matDialog.open(DialogAddTaskReminderComponent, {
      restoreFocus: true,
      data: {
        title: this.task ? this.task.title : this.reminder.title,
        taskId: this.reminder.relatedId,
        reminderId: this.reminder.id,
        isMoveToBacklogPossible: false,
      } as AddTaskReminderInterface
    });
    this._close();
  }

  private _close() {
    this._matDialogRef.close();
  }

  private _startTask() {
    if (this.task.parentId) {
      this._taskService.moveToToday(this.task.parentId, true);
    } else {
      this._taskService.moveToToday(this.reminder.relatedId, true);
    }
    this._taskService.setCurrentId(this.reminder.relatedId);
  }
}
