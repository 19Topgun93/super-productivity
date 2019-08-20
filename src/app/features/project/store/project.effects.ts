import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {filter, map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {
  AddProject,
  ArchiveProject,
  DeleteProject,
  LoadProjectRelatedDataSuccess,
  ProjectActionTypes,
  UpdateProject,
  UpdateProjectIssueProviderCfg,
  UpdateProjectWorkEnd,
  UpdateProjectWorkStart
} from './project.actions';
import {selectCurrentProject, selectCurrentProjectId, selectProjectFeatureState} from './project.reducer';
import {PersistenceService} from '../../../core/persistence/persistence.service';
import {TaskService} from '../../tasks/task.service';
import {BookmarkService} from '../../bookmark/bookmark.service';
import {AttachmentService} from '../../attachment/attachment.service';
import {NoteService} from '../../note/note.service';
import {IssueService} from '../../issue/issue.service';
import {SnackService} from '../../../core/snack/snack.service';
import {getWorklogStr} from '../../../util/get-work-log-str';
import {TaskActionTypes} from '../../tasks/store/task.actions';
import {ReminderService} from '../../reminder/reminder.service';
import {MetricService} from '../../metric/metric.service';
import {ObstructionService} from '../../metric/obstruction/obstruction.service';
import {ImprovementService} from '../../metric/improvement/improvement.service';
import {ProjectService} from '../project.service';
import {BannerService} from '../../../core/banner/banner.service';
import {Router} from '@angular/router';
import {BannerId} from '../../../core/banner/banner.model';
import {GlobalConfigService} from '../../config/global-config.service';
import {TaskRepeatCfgService} from '../../task-repeat-cfg/task-repeat-cfg.service';
import {T} from '../../../t.const';

@Injectable()
export class ProjectEffects {
  @Effect({dispatch: false}) syncProjectToLs$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.AddProject,
        ProjectActionTypes.DeleteProject,
        ProjectActionTypes.SetCurrentProject,
        ProjectActionTypes.UpdateProject,
        ProjectActionTypes.UpdateProjectAdvancedCfg,
        ProjectActionTypes.UpdateProjectIssueProviderCfg,
        ProjectActionTypes.UpdateProjectWorkStart,
        ProjectActionTypes.UpdateProjectWorkEnd,
        ProjectActionTypes.AddToProjectBreakTime,
        ProjectActionTypes.UpdateProjectOrder,
        ProjectActionTypes.ArchiveProject,
        ProjectActionTypes.UnarchiveProject,
        ProjectActionTypes.UpdateLastCompletedDay,
      ),
      withLatestFrom(
        this._store$.pipe(select(selectProjectFeatureState))
      ),
      tap(this._saveToLs.bind(this))
    );


  @Effect({dispatch: false}) updateLastActive$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.AddProject,
        ProjectActionTypes.DeleteProject,
        ProjectActionTypes.UpdateProject,
        ProjectActionTypes.UpdateProjectAdvancedCfg,
        ProjectActionTypes.UpdateProjectIssueProviderCfg,
        ProjectActionTypes.UpdateProjectOrder,
        ProjectActionTypes.AddToProjectBreakTime,
        ProjectActionTypes.ArchiveProject,
        ProjectActionTypes.UnarchiveProject,
        ProjectActionTypes.UpdateLastCompletedDay,
      ),
      tap(this._persistenceService.saveLastActive.bind(this))
    );

  @Effect() updateWorkStart$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.LoadProjectState,
        ProjectActionTypes.LoadProjectRelatedDataSuccess,
      ),
      withLatestFrom(
        this._store$.pipe(select(selectCurrentProject))
      ),
      filter(([a, projectData]) => !projectData.workStart[getWorklogStr()]),
      map(([a, projectData]) => {
        return new UpdateProjectWorkStart({
          id: projectData.id,
          date: getWorklogStr(),
          newVal: Date.now(),
        });
      })
    );

  @Effect({dispatch: false}) checkIfDayWasFinished$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.LoadProjectRelatedDataSuccess,
      ),
      withLatestFrom(
        this._projectService.lastWorkEnd$,
        this._projectService.lastCompletedDay$,
        this._globalConfigService.misc$,
      ),
      filter(([a, lastWorkEndStr, lastCompletedDayStr, miscCfg]) =>
        miscCfg && !miscCfg.isDisableRemindWhenForgotToFinishDay),
      filter(([a, lastWorkEndStr, lastCompletedDayStr, miscCfg]) => {
        const today = new Date();
        const lastWorkEnd = new Date(lastWorkEndStr);
        const lastCompletedDay = new Date(lastCompletedDayStr);

        today.setHours(0, 0, 0, 0);
        lastWorkEnd.setHours(0, 0, 0, 0);
        lastCompletedDay.setHours(0, 0, 0, 0);

        // console.log('lastCompletedDay', lastCompletedDay[getWorklogStr(lastWorkEnd)],
        //   lastCompletedDay, 'lastWorkEnd', lastWorkEnd, 'today', today);
        // NOTE: ignore projects without any completed day
        return !!(lastCompletedDay)
          && (lastWorkEnd < today)
          && (lastWorkEnd > lastCompletedDay);
      }),
      tap(([a, workEnd, dayCompleted]) => {
        const dayStr = getWorklogStr(workEnd);
        this._bannerService.open({
          id: BannerId.ForgotToFinishDay,
          ico: 'info',
          msg: T.F.PROJECT.BANNER.FINISH_DAY.MSG,
          translateParams: {
            dayStr
          },
          action: {
            label: T.F.PROJECT.BANNER.FINISH_DAY.FINISH_DAY,
            fn: () => {
              this._router.navigate(['/daily-summary', dayStr]);
            }
          },
        });
      }),
    );

  @Effect({dispatch: false}) dismissProjectScopeBannersOnProjectChange: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.SetCurrentProject,
      ),
      tap(() => {
        this._bannerService.dismissIfExisting(BannerId.ForgotToFinishDay);
        this._bannerService.dismissIfExisting(BannerId.JiraUnblock);
      }),
    );


  @Effect() updateWorkEnd$: any = this._actions$
    .pipe(
      ofType(
        TaskActionTypes.AddTimeSpent,
      ),
      withLatestFrom(
        this._store$.pipe(select(selectCurrentProject))
      ),
      map(([a, projectData]) => {
        return new UpdateProjectWorkEnd({
          id: projectData.id,
          date: getWorklogStr(),
          newVal: Date.now(),
        });
      })
    );


  @Effect() onProjectIdChange$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.LoadProjectState,
        ProjectActionTypes.SetCurrentProject,
      ),
      withLatestFrom(
        this._store$.pipe(select(selectCurrentProjectId))
      ),
      switchMap(([action, projectId]) => {
        return Promise.all([
          // TODO automatize
          this._noteService.loadStateForProject(projectId),
          this._bookmarkService.loadStateForProject(projectId),
          this._attachmentService.loadStateForProject(projectId),
          this._issueService.loadStatesForProject(projectId),
          this._taskService.loadStateForProject(projectId),
          this._metricService.loadStateForProject(projectId),
          this._improvementService.loadStateForProject(projectId),
          this._obstructionService.loadStateForProject(projectId),
          this._taskRepeatCfgService.loadStateForProject(projectId),
        ]);
      }),
      map(data => {
        return new LoadProjectRelatedDataSuccess();
      })
    );

  @Effect({dispatch: false}) onProjectCreated: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.AddProject,
      ),
      tap((action: AddProject) => {
        this._snackService.open({
          ico: 'add',
          type: 'SUCCESS',
          msg: T.F.PROJECT.S.CREATED,
          translateParams: {title: action.payload.project.title}
        });
      }),
    );

  @Effect({dispatch: false}) showDeletionSnack: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.DeleteProject,
      ),
      tap((action: DeleteProject) => {
        this._snackService.open({
          ico: 'delete_forever',
          msg: T.F.PROJECT.S.DELETED
        });
      }),
    );


  @Effect({dispatch: false}) deleteProjectRelatedData: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.DeleteProject,
      ),
      tap(async (action: ArchiveProject) => {
        await this._persistenceService.removeCompleteRelatedDataForProject(action.payload.id);
        this._reminderService.removeReminderByProjectId(action.payload.id);
      }),
    );


  @Effect({dispatch: false}) archiveProject: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.ArchiveProject,
      ),
      tap(async (action: ArchiveProject) => {
        await this._persistenceService.archiveProject(action.payload.id);
        this._reminderService.removeReminderByProjectId(action.payload.id);
        this._snackService.open({
          ico: 'archive',
          msg: T.F.PROJECT.S.ARCHIVED,
        });
      }),
    );

  @Effect({dispatch: false}) unarchiveProject: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.UnarchiveProject,
      ),
      tap(async (action: ArchiveProject) => {
        await this._persistenceService.unarchiveProject(action.payload.id);

        this._snackService.open({
          ico: 'unarchive',
          msg: T.F.PROJECT.S.UNARCHIVED
        });
      }),
    );

  @Effect({dispatch: false}) snackUpdateIssueProvider$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.UpdateProjectIssueProviderCfg,
      ),
      tap((action: UpdateProjectIssueProviderCfg) => {
        this._snackService.open({
          type: 'SUCCESS',
          msg: T.F.PROJECT.S.ISSUE_PROVIDER_UPDATED,
          translateParams: {
            issueProviderKey: action.payload.issueProviderKey
          }
        });
      })
    );

  @Effect({dispatch: false}) snackUpdateBaseSettings$: any = this._actions$
    .pipe(
      ofType(
        ProjectActionTypes.UpdateProject,
      ),
      tap((action: UpdateProject) => {
        this._snackService.open({
          type: 'SUCCESS',
          msg: T.F.PROJECT.S.UPDATED,
        });
      })
    );

  constructor(
    private _actions$: Actions,
    private _store$: Store<any>,
    private _snackService: SnackService,
    private _projectService: ProjectService,
    private _persistenceService: PersistenceService,
    private _taskService: TaskService,
    private _taskRepeatCfgService: TaskRepeatCfgService,
    private _issueService: IssueService,
    private _bookmarkService: BookmarkService,
    private _noteService: NoteService,
    private _bannerService: BannerService,
    private _globalConfigService: GlobalConfigService,
    private _attachmentService: AttachmentService,
    private _reminderService: ReminderService,
    private _metricService: MetricService,
    private _obstructionService: ObstructionService,
    private _improvementService: ImprovementService,
    private _router: Router,
  ) {
  }

  private _saveToLs([action, projectFeatureState]) {
    this._persistenceService.project.save(projectFeatureState);
  }
}


