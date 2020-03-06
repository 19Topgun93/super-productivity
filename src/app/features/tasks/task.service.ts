import shortid from 'shortid';
import {distinctUntilChanged, filter, first, map, shareReplay, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {
  DEFAULT_TASK,
  DropListModelSource,
  SHORT_SYNTAX_REG_EX,
  ShowSubTasksMode,
  Task,
  TaskAdditionalInfoTargetPanel,
  TaskArchive,
  TaskWithSubTasks
} from './task.model';
import {select, Store} from '@ngrx/store';
import {
  AddSubTask,
  AddTask,
  AddTaskReminder,
  AddTimeSpent,
  DeleteTask,
  LoadTaskState,
  Move,
  MoveDown,
  MoveToArchive,
  MoveToBacklog,
  MoveToOtherProject,
  MoveToToday,
  MoveUp,
  RemoveTaskReminder,
  RemoveTimeSpent,
  RestoreTask,
  RoundTimeSpentForDay,
  SetCurrentTask,
  SetSelectedTask,
  StartFirstStartable,
  TaskActionTypes,
  ToggleStart,
  ToggleTaskShowSubTasks,
  UnsetCurrentTask,
  UpdateTask,
  UpdateTaskListIds,
  UpdateTaskReminder,
  UpdateTaskUi
} from './store/task.actions';
import {initialTaskState} from './store/task.reducer';
import {PersistenceService} from '../../core/persistence/persistence.service';
import {IssueProviderKey} from '../issue/issue.model';
import {TimeTrackingService} from '../time-tracking/time-tracking.service';
import {
  selectAllRepeatableTaskWithSubTasks,
  selectAllRepeatableTaskWithSubTasksFlat,
  selectAllTasks,
  selectBacklogTaskCount,
  selectBacklogTasksWithSubTasks,
  selectCurrentTask,
  selectCurrentTaskId,
  selectCurrentTaskOrParentWithData,
  selectEstimateRemainingForBacklog,
  selectEstimateRemainingForToday,
  selectHasTasksToWorkOn,
  selectIsTaskForTodayPlanned,
  selectScheduledTasks,
  selectSelectedTask,
  selectSelectedTaskId,
  selectStartableTaskIds,
  selectStartableTasks,
  selectTaskAdditionalInfoTargetPanel,
  selectTaskById,
  selectTaskByIdWithSubTaskData,
  selectTaskByIssueId,
  selectTaskEntities,
  selectTasksByRepeatConfigId,
  selectTasksWorkedOnOrDoneFlat,
  selectTaskWithSubTasksByRepeatConfigId,
  selectTodaysDoneTasksWithSubTasks,
  selectTodaysTasksWithSubTasks,
  selectTodaysUnDoneTasksWithSubTasks,
  selectTotalTimeWorkedOnTodaysTasks
} from './store/task.selectors';
import {stringToMs} from '../../ui/duration/string-to-ms.pipe';
import {getWorklogStr} from '../../util/get-work-log-str';
import {Actions, ofType} from '@ngrx/effects';
import {ProjectService} from '../project/project.service';
import {RoundTimeOption} from '../project/project.model';
import {Dictionary} from '@ngrx/entity';


@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // Currently used in idle service
  currentTaskId: string;
  currentTaskId$: Observable<string> = this._store.pipe(
    select(selectCurrentTaskId),
    // NOTE: we can't use share here, as we need the last emitted value
  );

  currentTask$: Observable<Task> = this._store.pipe(
    select(selectCurrentTask),
    // NOTE: we can't use share here, as we need the last emitted value
  );

  selectedTaskId$: Observable<string> = this._store.pipe(
    select(selectSelectedTaskId),
    // NOTE: we can't use share here, as we need the last emitted value
  );

  selectedTask$: Observable<TaskWithSubTasks> = this._store.pipe(
    select(selectSelectedTask),
    // NOTE: we can't use share here, as we need the last emitted value
  );

  taskAdditionalInfoTargetPanel$: Observable<TaskAdditionalInfoTargetPanel> = this._store.pipe(
    select(selectTaskAdditionalInfoTargetPanel),
    // NOTE: we can't use share here, as we need the last emitted value
  );

  currentTaskOrCurrentParent$: Observable<TaskWithSubTasks> = this._store.pipe(
    select(selectCurrentTaskOrParentWithData),
    // NOTE: we can't use share here, as we need the last emitted value
  );


  startableTaskIds$: Observable<string[]> = this._store.pipe(
    select(selectStartableTaskIds),
  );

  startableTasks$: Observable<Task[]> = this._store.pipe(
    select(selectStartableTasks),
  );

  // todays list flat + tasks worked on today
  taskEntityState$: Observable<Dictionary<Task>> = this._store.pipe(
    select(selectTaskEntities),
  );

  // only todays list
  todaysTasks$: Observable<TaskWithSubTasks[]> = this._store.pipe(
    select(selectTodaysTasksWithSubTasks),
    shareReplay(1),
  );

  isTasksForToday$: Observable<boolean> = this._store.pipe(
    select(selectIsTaskForTodayPlanned),
  );

  backlogTasks$: Observable<TaskWithSubTasks[]> = this._store.pipe(
    select(selectBacklogTasksWithSubTasks),
    shareReplay(1),
  );
  backlogTasksCount$: Observable<number> = this._store.pipe(
    select(selectBacklogTaskCount),
  );

  undoneTasks$: Observable<TaskWithSubTasks[]> = this._store.pipe(
    select(selectTodaysUnDoneTasksWithSubTasks),
    shareReplay(1),
  );

  doneTasks$: Observable<TaskWithSubTasks[]> = this._store.pipe(
    select(selectTodaysDoneTasksWithSubTasks),
    shareReplay(1),
  );

  allRepeatableTasks$: Observable<TaskWithSubTasks[]> = this._store.pipe(
    select(selectAllRepeatableTaskWithSubTasks),
  );

  allRepeatableTasksFlat$: Observable<TaskWithSubTasks[]> = this._store.pipe(
    select(selectAllRepeatableTaskWithSubTasksFlat),
  );

  scheduledTasksWOData$ = this._store.pipe(
    select(selectScheduledTasks),
  );


  // META FIELDS
  // -----------
  estimateRemainingToday$: Observable<number> = this._store.pipe(
    select(selectEstimateRemainingForToday),
    distinctUntilChanged(),
  );
  estimateRemainingBacklog$: Observable<number> = this._store.pipe(
    select(selectEstimateRemainingForBacklog),
    distinctUntilChanged(),
  );

  totalTimeWorkedOnTodaysTasks$: Observable<number> = this._store.pipe(
    select(selectTotalTimeWorkedOnTodaysTasks),
    distinctUntilChanged(),
  );
  currentTaskProgress$: Observable<number> = this.currentTask$.pipe(
    map((task) => task && task.timeEstimate > 0 && task.timeSpent / task.timeEstimate)
  );

  // TODO could be done as a dynamic selector
  workingToday$: Observable<any> = this.getTimeWorkedForDay$(getWorklogStr());

  // TODO could be done as a dynamic selector
  estimatedOnTasksWorkedOnToday$: Observable<number> = this.todaysTasks$.pipe(
    map((tasks) => {
      const date = getWorklogStr();
      return tasks && tasks.length && tasks.reduce((acc, task) => {
          if (!task.timeSpentOnDay && !(task.timeSpentOnDay[date] > 0)) {
            return acc;
          }
          const remainingEstimate = task.timeEstimate + (task.timeSpentOnDay[date]) - task.timeSpent;
          return (remainingEstimate > 0)
            ? acc + remainingEstimate
            : acc;
        }, 0
      );
    }),
    distinctUntilChanged(),
  );

  onMoveToBacklog$: Observable<any> = this._actions$.pipe(ofType(
    TaskActionTypes.MoveToBacklog,
  ));

  isHasTasksToWorkOn$: Observable<boolean> = this._store.pipe(
    select(selectHasTasksToWorkOn),
    distinctUntilChanged(),
  );

  allTasks$: Observable<Task[]> = this._store.pipe(select(selectAllTasks));


  private _allTasksWithSubTaskData$: Observable<TaskWithSubTasks[]> = this._store.pipe(select(selectAllTasks));


  constructor(
    private readonly _store: Store<any>,
    private readonly _persistenceService: PersistenceService,
    private readonly _projectService: ProjectService,
    private readonly _timeTrackingService: TimeTrackingService,
    private readonly _actions$: Actions,
  ) {
    this.currentTaskId$.subscribe((val) => this.currentTaskId = val);

    // time tracking
    this._timeTrackingService.tick$
      .pipe(withLatestFrom(this.currentTaskId$))
      .subscribe(([tick, currentId]) => {
        if (currentId) {
          this.addTimeSpent(currentId, tick.duration, tick.date);
        }
      });
  }

  // META
  // ----
  setCurrentId(id: string) {
    if (id) {
      this._store.dispatch(new SetCurrentTask(id));
    } else {
      this._store.dispatch(new UnsetCurrentTask());
    }
  }

  setSelectedId(id: string, taskAdditionalInfoTargetPanel = TaskAdditionalInfoTargetPanel.Default) {
    this._store.dispatch(new SetSelectedTask({id, taskAdditionalInfoTargetPanel}));
  }

  startFirstStartable(isStartIfHasCurrent = false) {
    this._store.dispatch(new StartFirstStartable({isStartIfHasCurrent}));
  }

  async load() {
    const lsTaskState = await this._persistenceService.task.loadState();
    // this.loadState(lsTaskState || initialTaskState);
    console.log('LOAD TASK BASIC');

    this.loadState(
      lsTaskState
        ? {
          ...lsTaskState,
          backlogTaskIds: [],
          todaysTaskIds: []
        }
        : initialTaskState
    );
  }

  async loadStateForProject(projectId) {
    const projectData = await this._projectService.getById$(projectId).toPromise();
    console.log('LOAD TASK LIST IDS');
    this._store.dispatch(new UpdateTaskListIds({
      todaysTaskIds: projectData.todaysTaskIds || [],
      backlogTaskIds: projectData.backlogTaskIds || [],
      // todaysTaskIds: [],
      // backlogTaskIds: [],
    }));

    // for (let i = 1; i < 150; i++) {
    //   this.add(i, true, {
    //     isDone: true
    // });
    // }
  }

  loadState(state) {
    this._store.dispatch(new LoadTaskState({state}));
  }

  pauseCurrent() {
    this._store.dispatch(new UnsetCurrentTask());
  }

  // Tasks
  // -----
  add(title: string,
      isAddToBacklog = false,
      additionalFields?: Partial<Task>,
      isAddToBottom = false,
  ) {
    this._store.dispatch(new AddTask({
      task: this.createNewTaskWithDefaults(title, additionalFields),
      isAddToBacklog,
      isAddToBottom
    }));
  }

  remove(task: TaskWithSubTasks) {
    this._store.dispatch(new DeleteTask({task}));
  }


  update(id: string, changedFields: Partial<Task>) {
    this._store.dispatch(new UpdateTask({
      task: {id, changes: this._shortSyntax(changedFields) as Partial<Task>}
    }));
  }

  // NOTE: side effects are not executed!!!
  updateForProject(id: string, projectId: string, changedFields: Partial<Task>) {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;

    // if (projectId === this._projectService.currentId) {
    //   this._store.dispatch(new UpdateTask({
    //     task: {id, changes: this._shortSyntax(changedFields) as Partial<Task>}
    //   }));
    // } else {
    //   this._persistenceService.task.update(projectId, (state) => {
    //     const task = state.entities[id];
    //     state.entities[id] = {...task, ...changedFields};
    //     return state;
    //   });
    // }
  }


  updateUi(id: string, changes: Partial<Task>) {
    this._store.dispatch(new UpdateTaskUi({
      task: {id, changes}
    }));
  }

  move(taskId: string,
       sourceModelId: DropListModelSource,
       targetModelId: DropListModelSource,
       newOrderedIds: string[]) {
    this._store.dispatch(new Move({
      taskId,
      sourceModelId,
      targetModelId,
      newOrderedIds,
    }));
  }

  moveUp(id: string) {
    this._store.dispatch(new MoveUp({id}));
  }

  moveDown(id: string) {
    this._store.dispatch(new MoveDown({id}));
  }

  addSubTaskTo(parentId) {
    this._store.dispatch(new AddSubTask({
      task: this.createNewTaskWithDefaults(''),
      parentId
    }));
  }

  addTimeSpent(id: string,
               duration: number,
               date: string = getWorklogStr()) {
    this._store.dispatch(new AddTimeSpent({id, date, duration}));
  }

  removeTimeSpent(id: string,
                  duration: number,
                  date: string = getWorklogStr()) {
    this._store.dispatch(new RemoveTimeSpent({id, date, duration}));
  }

  focusTask(id: string) {
    document.getElementById('t-' + id).focus();
  }

  moveToToday(id, isMoveToTop = false) {
    this._store.dispatch(new MoveToToday({id, isMoveToTop}));
  }

  moveToBacklog(id) {
    this._store.dispatch(new MoveToBacklog({id}));
  }

  moveToArchive(tasks: TaskWithSubTasks | TaskWithSubTasks[]) {
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    this._store.dispatch(new MoveToArchive({tasks}));
  }

  moveToProject(tasks: TaskWithSubTasks | TaskWithSubTasks[], projectId: string) {
    if (!Array.isArray(tasks)) {
      tasks = [tasks];
    }
    if (tasks.find((task) => !!task.parentId || !!task.issueId)) {
      console.error('Wrong task model');
      return;
    }
    this._store.dispatch(new MoveToOtherProject({tasks, projectId}));
  }

  toggleStartTask() {
    this._store.dispatch(new ToggleStart());
  }

  restoreTask(task: Task, subTasks: Task[]) {
    this._store.dispatch(new RestoreTask({task, subTasks}));
  }

  roundTimeSpentForDay(day: string, roundTo: RoundTimeOption, isRoundUp = false) {
    this._store.dispatch(new RoundTimeSpentForDay({day, roundTo, isRoundUp}));
  }

  // TODO this should be done via action and effects
  startTaskFromOtherProject$(taskId: string, projectId: string): Observable<Task> {
    this._projectService.setCurrentId(projectId);

    const taskInOtherProject$ = this._projectService.isRelatedDataLoadedForCurrentProject$.pipe(
      filter(isLoaded => !!isLoaded),
      switchMap(() => this.getById$(taskId).pipe(
        take(1))
      ),
      take(1),
    );

    taskInOtherProject$.subscribe(task => {
      if (task.parentId) {
        this.moveToToday(task.parentId, true);
      } else {
        this.moveToToday(task.id, true);
      }
      this.setCurrentId(task.id);
    });
    return taskInOtherProject$;
  }

  // REMINDER
  // --------
  addReminder(taskId: string, remindAt: number, title: string, isMoveToBacklog = false) {
    this._store.dispatch(new AddTaskReminder({id: taskId, remindAt, title, isMoveToBacklog}));
  }

  updateReminder(taskId: string, reminderId: string, remindAt: number, title: string) {
    this._store.dispatch(new UpdateTaskReminder({id: taskId, reminderId, remindAt, title}));
  }

  removeReminder(taskId: string, reminderId: string) {
    this._store.dispatch(new RemoveTaskReminder({id: taskId, reminderId}));
  }

  // HELPER
  // ------
  getById$(id: string): Observable<Task> {
    return this._store.pipe(select(selectTaskById, {id}), take(1));
  }

  getByIdWithSubTaskData$(id: string): Observable<TaskWithSubTasks> {
    return this._store.pipe(select(selectTaskByIdWithSubTaskData, {id}), take(1));
  }

  getTasksByRepeatCfgId$(repeatCfgId: string): Observable<Task[]> {
    return this._store.pipe(select(selectTasksByRepeatConfigId, {repeatCfgId}), take(1));
  }

  getTasksWithSubTasksByRepeatCfgId$(repeatCfgId: string): Observable<TaskWithSubTasks[]> {
    return this._store.pipe(select(selectTaskWithSubTasksByRepeatConfigId, {repeatCfgId}));
  }

  getTasksWorkedOnOrDoneFlat$(day: string = getWorklogStr()): Observable<TaskWithSubTasks[]> {
    return this._store.pipe(select(selectTasksWorkedOnOrDoneFlat, {day}));
  }

  // TODO could be done better
  getTimeWorkedForDay$(day: string = getWorklogStr()): Observable<number> {
    return this.todaysTasks$.pipe(
      map((tasks) => {
        return tasks && tasks.length && tasks.reduce((acc, task) => {
            return acc + (
              (task.timeSpentOnDay && +task.timeSpentOnDay[day])
                ? +task.timeSpentOnDay[day]
                : 0
            );
          }, 0
        );
      }),
      distinctUntilChanged(),
    );
  }

  // TODO could be done better
  getTimeEstimateForDay$(day: string = getWorklogStr()): Observable<number> {
    return this.todaysTasks$.pipe(
      map((tasks) => {
        return tasks && tasks.length && tasks.reduce((acc, task) => {
            if (!task.timeSpentOnDay && !(task.timeSpentOnDay[day] > 0)) {
              return acc;
            }
            const remainingEstimate = task.timeEstimate + (task.timeSpentOnDay[day]) - task.timeSpent;
            return (remainingEstimate > 0)
              ? acc + remainingEstimate
              : acc;
          }, 0
        );
      }),
      distinctUntilChanged(),
    );
  }


  getByIssueId$(issueId: string | number, issueType: IssueProviderKey): Observable<Task> {
    return this._store.pipe(select(selectTaskByIssueId, {issueId, issueType}), take(1));
  }


  setDone(id: string) {
    this.update(id, {isDone: true});
  }

  markIssueUpdatesAsRead(id: string) {
    this.update(id, {issueWasUpdated: false});
  }

  setUnDone(id: string) {
    this.update(id, {isDone: false});
  }

  showSubTasks(id: string) {
    this.updateUi(id, {_showSubTasksMode: ShowSubTasksMode.Show});
  }

  toggleSubTaskMode(taskId: string, isShowLess = true, isEndless = false) {
    this._store.dispatch(new ToggleTaskShowSubTasks({taskId, isShowLess, isEndless}));
  }

  hideSubTasks(id: string) {
    this.updateUi(id, {_showSubTasksMode: ShowSubTasksMode.HideAll});
  }

  // GLOBAL TASK MODEL STUFF
  // -----------------------

  // BEWARE: does only work for task model updates
  async updateEverywhereForCurrentProject(id: string, changedFields: Partial<Task>) {
    const entities = await this.taskEntityState$.pipe(first()).toPromise();
    if (entities[id]) {
      this.update(id, changedFields);
    } else {
      await this.updateArchiveTaskForCurrentProject(id, changedFields);
    }
  }

  // BEWARE: does only work for task model updates, but not the meta models
  async updateArchiveTaskForCurrentProject(id: string, changedFields: Partial<Task>): Promise<any> {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;
    // const curProId = this._projectService.currentId;
    // return await this._persistenceService.taskArchive.ent.execAction(curProId, new UpdateTask({
    //   task: {id, changes: this._shortSyntax(changedFields) as Partial<Task>}
    // }));
  }

  async getByIdFromEverywhere(id: string, projectId: string = this._projectService.currentId): Promise<Task> {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;
    // return await this._persistenceService.task.ent.getById(projectId, id)
    //   || await this._persistenceService.taskArchive.ent.getById(projectId, id);
  }

  // NOTE: archived tasks not included
  async getByIdsForProject(taskIds: string[], projectId: string): Promise<Task[]> {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;
    // return await this._persistenceService.task.ent.getByIds(projectId, taskIds);
  }

  // NOTE: archived tasks not included
  // TODO think about getting data from current project directly from store
  async getByIdsFromAllProjects(projectIdTaskMap: { [key: string]: string[] }): Promise<Task[]> {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;
    const projectIds = Object.keys(projectIdTaskMap);
    const taskData = await Promise.all(projectIds.map(async (projectId) => {
      return this.getByIdsForProject(projectIdTaskMap[projectId], projectId);
    }));

    if (taskData) {
      return taskData.reduce((acc, val) => acc.concat(val), []);
    }
    return null;
  }

  // TODO check if that is what we need
  async getAllTasksForCurrentProject(): Promise<Task[]> {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;
    const allTasks = await this._allTasksWithSubTaskData$.pipe(first()).toPromise();
    const archiveTaskState: TaskArchive = await this._persistenceService.taskArchive.loadState();
    const ids = archiveTaskState && archiveTaskState.ids as string[] || [];
    const archiveTasks = ids
      .map(id => archiveTaskState.entities[id])
      .filter(task => task.projectId === this._projectService.currentId);
    return [...allTasks, ...archiveTasks];
  }

  async getAllIssueIdsForCurrentProject(issueProviderKey: IssueProviderKey): Promise<string[] | number[]> {
    const allTasks = await this.getAllTasksForCurrentProject();
    return allTasks
      .filter(task => task.issueType === issueProviderKey)
      .map(task => task.issueId);
  }

  // TODO check with new archive
  async checkForTaskWithIssue(issueId: string | number): Promise<{
    task: Task,
    subTasks: Task[],
    isFromArchive: boolean,
  }> {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;
    const allTasks = await this._allTasksWithSubTaskData$.pipe(first()).toPromise() as Task[];
    const taskWithSameIssue: Task = allTasks.find(task => task.issueId === issueId);

    if (taskWithSameIssue) {
      return {
        task: taskWithSameIssue,
        isFromArchive: false,
        subTasks: null,
      };
    } else {
      const archiveTaskState: TaskArchive = await this._persistenceService.taskArchive.loadState();
      const ids = archiveTaskState && archiveTaskState.ids as string[];
      if (ids) {
        const archiveTaskWithSameIssue = ids.map(id => archiveTaskState.entities[id]).find(task => task.issueId === issueId);
        return archiveTaskWithSameIssue && {
          task: archiveTaskWithSameIssue,
          subTasks: archiveTaskWithSameIssue.subTaskIds && archiveTaskWithSameIssue.subTaskIds.map(id => archiveTaskState.entities[id]),
          isFromArchive: true
        };
      }
    }
  }


  createNewTaskWithDefaults(title: string, additional: Partial<Task> = {}): Task {
    return this._shortSyntax({
      // NOTE needs to be created every time
      ...DEFAULT_TASK,
      created: Date.now(),
      title,
      id: shortid(),
      projectId: this._projectService.currentId,
      ...additional,
    }) as Task;
  }

  // NOTE: won't be static once we check for the settings
  private _shortSyntax(task: Task | Partial<Task>): Task | Partial<Task> {
    if (!task.title) {
      return task;
    }
    const matches = SHORT_SYNTAX_REG_EX.exec(task.title);

    if (matches && matches.length >= 3) {
      const full = matches[0];
      const timeSpent = matches[2];
      const timeEstimate = matches[4];

      return {
        ...task,
        ...(
          timeSpent
            ? {
              timeSpentOnDay: {
                ...(task.timeSpentOnDay || {}),
                [getWorklogStr()]: stringToMs(timeSpent)
              }
            }
            : {}
        ),
        timeEstimate: stringToMs(timeEstimate),
        title: task.title.replace(full, '')
      };

    } else {
      return task;
    }
  }
}
