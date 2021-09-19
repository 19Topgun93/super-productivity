import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TaskService } from '../../../../tasks/task.service';
import { ProjectService } from '../../../../project/project.service';
import { concatMap, filter, first, map } from 'rxjs/operators';
import { IssueService } from '../../../issue.service';
import { Observable } from 'rxjs';
import { Task } from 'src/app/features/tasks/task.model';
import { CALDAV_TYPE } from '../../../issue.const';
import { isCaldavEnabled } from '../is-caldav-enabled.util';
import { CaldavClientService } from '../caldav-client.service';
import { CaldavCfg } from '../caldav.model';
import { updateTask } from '../../../../tasks/store/task.actions';

@Injectable()
export class CaldavIssueEffects {
  // TODO only check if there are active issue tasks for current list
  checkForDoneTransition$: Observable<any> = createEffect(
    () =>
      this._actions$.pipe(
        ofType(updateTask),
        filter(({ task }): boolean => 'isDone' in task.changes),
        concatMap(({ task }) => this._taskService.getByIdOnce$(task.id as string)),
        filter((task: Task) => task && task.issueType === CALDAV_TYPE),
        concatMap((task: Task) => {
          if (!task.projectId) {
            throw new Error('No projectId for task');
          }
          return this._getCfgOnce$(task.projectId).pipe(
            map((caldavCfg) => ({ caldavCfg, task })),
          );
        }),
        filter(
          ({ caldavCfg: caldavCfg, task }) =>
            isCaldavEnabled(caldavCfg) && caldavCfg.isTransitionIssuesEnabled,
        ),
        concatMap(({ caldavCfg: caldavCfg, task }) => {
          return this._handleTransitionForIssue$(caldavCfg, task);
        }),
      ),
    { dispatch: false },
  );

  constructor(
    private readonly _actions$: Actions,
    private readonly _projectService: ProjectService,
    private readonly _caldavClientService: CaldavClientService,
    private readonly _issueService: IssueService,
    private readonly _taskService: TaskService,
  ) {}

  private _handleTransitionForIssue$(caldavCfg: CaldavCfg, task: Task): Observable<any> {
    return this._caldavClientService
      .updateCompletedState$(caldavCfg, task.issueId as string, task.isDone)
      .pipe(concatMap(() => this._issueService.refreshIssueTask(task, true)));
  }

  private _getCfgOnce$(projectId: string): Observable<CaldavCfg> {
    return this._projectService.getCaldavCfgForProject$(projectId).pipe(first());
  }
}
