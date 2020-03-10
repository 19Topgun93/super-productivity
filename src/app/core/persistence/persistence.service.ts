import {Injectable} from '@angular/core';
import {
  LS_BACKUP,
  LS_BOOKMARK_STATE,
  LS_CONTEXT,
  LS_GLOBAL_CFG,
  LS_IMPROVEMENT_STATE,
  LS_ISSUE_STATE,
  LS_LAST_ACTIVE,
  LS_METRIC_STATE,
  LS_NOTE_STATE,
  LS_OBSTRUCTION_STATE,
  LS_PROJECT_ARCHIVE,
  LS_PROJECT_META_LIST,
  LS_PROJECT_PREFIX,
  LS_REMINDER,
  LS_TASK_ARCHIVE,
  LS_TASK_ATTACHMENT_STATE,
  LS_TASK_REPEAT_CFG_STATE,
  LS_TASK_STATE
} from './ls-keys.const';
import {GlobalConfigState} from '../../features/config/global-config.model';
import {IssueProviderKey} from '../../features/issue/issue.model';
import {ProjectState} from '../../features/project/store/project.reducer';
import {TaskArchive, TaskState, TaskWithSubTasks} from '../../features/tasks/task.model';
import {AppBaseData, AppDataComplete, AppDataForProjects} from '../../imex/sync/sync.model';
import {bookmarkReducer, BookmarkState} from '../../features/bookmark/store/bookmark.reducer';
import {AttachmentState} from '../../features/attachment/store/attachment.reducer';
import {noteReducer, NoteState} from '../../features/note/store/note.reducer';
import {Reminder} from '../../features/reminder/reminder.model';
import {SnackService} from '../snack/snack.service';
import {DatabaseService} from './database.service';
import {issueProviderKeys} from '../../features/issue/issue.const';
import {DEFAULT_PROJECT_ID} from '../../features/project/project.const';
import {ExportedProject, ProjectArchive, ProjectArchivedRelatedData} from '../../features/project/project.model';
import {CompressionService} from '../compression/compression.service';
import {PersistenceBaseModel, PersistenceForProjectModel} from './persistence';
import {Metric, MetricState} from '../../features/metric/metric.model';
import {Improvement, ImprovementState} from '../../features/metric/improvement/improvement.model';
import {Obstruction, ObstructionState} from '../../features/metric/obstruction/obstruction.model';
import {TaskRepeatCfg, TaskRepeatCfgState} from '../../features/task-repeat-cfg/task-repeat-cfg.model';
import {Bookmark} from '../../features/bookmark/bookmark.model';
import {Note} from '../../features/note/note.model';
import {Action} from '@ngrx/store';
import {taskRepeatCfgReducer} from '../../features/task-repeat-cfg/store/task-repeat-cfg.reducer';
import {metricReducer} from '../../features/metric/store/metric.reducer';
import {improvementReducer} from '../../features/metric/improvement/store/improvement.reducer';
import {obstructionReducer} from '../../features/metric/obstruction/store/obstruction.reducer';
import {migrateProjectState} from '../../features/project/migrate-projects-state.util';
import {migrateTaskArchiveState, migrateTaskState} from '../../features/tasks/migrate-task-state.util';
import {migrateGlobalConfigState} from '../../features/config/migrate-global-config.util';
import {ContextState} from '../../context/context.model';


@Injectable({
  providedIn: 'root',
})
export class PersistenceService {

  // handled as private but needs to be assigned before the creations
  _baseModels = [];
  _projectModels = [];

  // TODO auto generate ls keys from appDataKey where possible
  project = this._cmBase<ProjectState>(LS_PROJECT_META_LIST, 'project', migrateProjectState);
  globalConfig = this._cmBase<GlobalConfigState>(LS_GLOBAL_CFG, 'globalConfig', migrateGlobalConfigState);
  context = this._cmBase<ContextState>(LS_CONTEXT, 'context');

  reminders = this._cmBase<Reminder[]>(LS_REMINDER, 'reminders');

  // MAIN TASK MODELS
  task = this._cmBase<TaskState>(
    LS_TASK_STATE,
    'task',
    migrateTaskState,
  );
  taskArchive = this._cmBase<TaskArchive>(
    LS_TASK_ARCHIVE,
    'taskArchive',
    migrateTaskArchiveState,
  );

  // TASK_RELATED_MODELS
  taskAttachment = this._cmBase<AttachmentState>(
    LS_TASK_ATTACHMENT_STATE,
    'taskAttachment',
  );
  taskRepeatCfg = this._cmProject<TaskRepeatCfgState, TaskRepeatCfg>(
    LS_TASK_REPEAT_CFG_STATE,
    'taskRepeatCfg',
    taskRepeatCfgReducer,
  );


  // PROJECT MODELS
  bookmark = this._cmProject<BookmarkState, Bookmark>(
    LS_BOOKMARK_STATE,
    'bookmark',
    bookmarkReducer,
  );
  note = this._cmProject<NoteState, Note>(
    LS_NOTE_STATE,
    'note',
    noteReducer,
  );
  metric = this._cmProject<MetricState, Metric>(
    LS_METRIC_STATE,
    'metric',
    metricReducer,
  );
  improvement = this._cmProject<ImprovementState, Improvement>(
    LS_IMPROVEMENT_STATE,
    'improvement',
    improvementReducer,
  );
  obstruction = this._cmProject<ObstructionState, Obstruction>(
    LS_OBSTRUCTION_STATE,
    'obstruction',
    obstructionReducer,
  );
  private _isBlockSaving = false;

  constructor(
    private _snackService: SnackService,
    private _databaseService: DatabaseService,
    private _compressionService: CompressionService,
  ) {
    // this.loadComplete().then(d => console.log('XXXXXXXXX', d, JSON.stringify(d).length));
    // this.loadAllRelatedModelDataForProject('DEFAULT').then(d => console.log(d));
  }

  async saveTasksToProject(projectId, tasksToSave: TaskWithSubTasks[], isForce = false) {
    console.log('NOT IMPLEMENT');
    // TODO fix
    return null;

    // let currentTaskState: TaskState = await this.task.load(projectId);
    // const mainTaskIds = tasksToSave.map(task => task.id);
    // if (!currentTaskState) {
    //   console.warn('No valid task state found for project');
    //   currentTaskState = initialTaskState;
    // }
    //
    // const entities = {
    //   ...currentTaskState.entities,
    //   ...tasksToSave.reduce((acc, task) => {
    //     const newAcc = {
    //       ...acc,
    //       [task.id]: {
    //         ...task,
    //         projectId,
    //         subTasks: null,
    //       },
    //     };
    //     if (task.subTasks) {
    //       task.subTasks.forEach((subTask) => {
    //         newAcc[subTask.id] = {
    //           ...subTask,
    //           projectId,
    //         };
    //       });
    //     }
    //
    //     return newAcc;
    //   }, {})
    // };
    //
    // const mergedEntities: TaskState = {
    //   ...currentTaskState,
    //   ids: Object.keys(entities),
    //   todaysTaskIds: [...currentTaskState.todaysTaskIds, ...mainTaskIds],
    //   entities,
    // };
    // return this.task.save(projectId, mergedEntities, isForce);
  }

  // TASK ARCHIVE
  async addTasksToArchive(tasksToArchive: TaskArchive, isForce = false) {
    const currentArchive: TaskArchive = await this.taskArchive.loadState();

    if (currentArchive) {
      const entities = {
        ...currentArchive.entities,
        ...tasksToArchive.entities
      };
      const mergedEntities = {
        ids: Object.keys(entities),
        entities,
      };
      return this.taskArchive.saveState(mergedEntities, isForce);
    } else {
      return this.taskArchive.saveState(tasksToArchive, isForce);
    }
  }

  async removeTasksFromArchive(taskIds: string[]) {
    const currentArchive: TaskArchive = await this.taskArchive.loadState();
    const allIds = currentArchive.ids as string[] || [];
    const idsToRemove = [];
    taskIds.forEach((taskId) => {
      if (allIds.indexOf(taskId) > -1) {
        delete currentArchive.entities[taskId];
        idsToRemove.push(taskId);
      }
    });

    return this.taskArchive.saveState({
      ...currentArchive,
      ids: allIds.filter((id) => !idsToRemove.includes(id)),
    }, true);
  }

  // ISSUES
  async removeIssuesForProject(projectId, issueType: IssueProviderKey): Promise<void> {
    return this._removeFromDb(this._makeProjectKey(projectId, LS_ISSUE_STATE, issueType));
  }


  // PROJECT ARCHIVING
  // -----------------
  async loadProjectArchive(): Promise<ProjectArchive> {
    return await this._loadFromDb(LS_PROJECT_ARCHIVE);
  }

  async saveProjectArchive(data: ProjectArchive, isForce = false): Promise<any> {
    return await this._saveToDb(LS_PROJECT_ARCHIVE, data, isForce);
  }

  async loadArchivedProject(projectId): Promise<ProjectArchivedRelatedData> {
    const archive = await this._loadFromDb(LS_PROJECT_ARCHIVE);
    const projectDataCompressed = archive[projectId];
    const decompressed = await this._compressionService.decompress(projectDataCompressed);
    const parsed = JSON.parse(decompressed);
    console.log(`Decompressed project, size before: ${projectDataCompressed.length}, size after: ${decompressed.length}`, parsed);
    return parsed;
  }

  async removeArchivedProject(projectId): Promise<any> {
    const archive = await this._loadFromDb(LS_PROJECT_ARCHIVE);
    delete archive[projectId];
    await this.saveProjectArchive(archive);
  }

  async saveArchivedProject(projectId, archivedProject: ProjectArchivedRelatedData) {
    const current = await this.loadProjectArchive() || {};
    const jsonStr = JSON.stringify(archivedProject);
    const compressedData = await this._compressionService.compress(jsonStr);
    console.log(`Compressed project, size before: ${jsonStr.length}, size after: ${compressedData.length}`, archivedProject);
    return this.saveProjectArchive({
      ...current,
      [projectId]: compressedData,
    });
  }

  async loadCompleteProject(projectId: string): Promise<ExportedProject> {
    const allProjects = await this.project.loadState();
    return {
      ...allProjects.entities[projectId],
      relatedModels: await this.loadAllRelatedModelDataForProject(projectId),
    };
  }

  async loadAllRelatedModelDataForProject(projectId: string): Promise<ProjectArchivedRelatedData> {
    const forProjectsData = await Promise.all(this._projectModels.map(async (modelCfg) => {
      return {
        [modelCfg.appDataKey]: await modelCfg.load(projectId),
      };
    }));
    const projectData = Object.assign({}, ...forProjectsData);
    return {
      ...projectData,
    };
  }

  async removeCompleteRelatedDataForProject(projectId: string): Promise<any> {
    await Promise.all(this._projectModels.map((modelCfg) => {
      return modelCfg.remove(projectId);
    }));
    await issueProviderKeys.forEach(async (key) => {
      await this.removeIssuesForProject(projectId, key);
    });
  }

  async restoreCompleteRelatedDataForProject(projectId: string, data: ProjectArchivedRelatedData): Promise<any> {
    await Promise.all(this._projectModels.map((modelCfg) => {
      return modelCfg.save(projectId, data[modelCfg.appDataKey]);
    }));
  }

  async archiveProject(projectId: string): Promise<any> {
    const projectData = await this.loadAllRelatedModelDataForProject(projectId);
    await this.saveArchivedProject(projectId, projectData);
    await this.removeCompleteRelatedDataForProject(projectId);
  }

  async unarchiveProject(projectId: string): Promise<any> {
    const projectData = await this.loadArchivedProject(projectId);
    await this.restoreCompleteRelatedDataForProject(projectId, projectData);
    await this.removeArchivedProject(projectId);
  }

  // BACKUP AND SYNC RELATED
  // -----------------------
  saveLastActive(date: number = Date.now()) {
    // console.log('Save LastAct', date);
    localStorage.setItem(LS_LAST_ACTIVE, date.toString());
  }

  getLastActive(): number {
    const la = localStorage.getItem(LS_LAST_ACTIVE);
    // NOTE: we need to parse because new Date('1570549698000') is "Invalid Date"
    const laParsed = Number.isNaN(Number(la))
      ? la
      : +la;
    // NOTE: to account for legacy string dates
    return new Date(laParsed).getTime();
  }

  async loadBackup(): Promise<AppDataComplete> {
    return this._loadFromDb(LS_BACKUP);
  }

  async saveBackup(backup?: AppDataComplete): Promise<any> {
    const backupData: AppDataComplete = backup || await this.loadComplete();
    return this._saveToDb(LS_BACKUP, backupData, true);
  }

  // NOTE: not including backup
  async loadComplete(): Promise<AppDataComplete> {
    const projectState = await this.project.loadState();
    const pids = projectState ? projectState.ids as string[] : [DEFAULT_PROJECT_ID];

    return {
      lastActiveTime: this.getLastActive(),
      ...(await this._loadAppDataForProjects(pids)),
      ...(await this._loadAppBaseData()),
    };
  }

  async importComplete(data: AppDataComplete) {
    console.log('IMPORT--->', data);
    this._isBlockSaving = true;

    const forBase = Promise.all(this._baseModels.map(async (modelCfg) => {
      return await modelCfg.save(data[modelCfg.appDataKey], true);
    }));
    const forProject = Promise.all(this._projectModels.map(async (modelCfg) => {
      return await this._saveForProjectIds(data[modelCfg.appDataKey], modelCfg.save, true);
    }));

    return await Promise.all([
      forBase,
      forProject
    ])
      .then(() => {
        this._isBlockSaving = false;
      })
      .catch(() => {
        this._isBlockSaving = false;
      });
  }

  async cleanDatabase() {
    const completeData: AppDataComplete = await this.loadComplete();
    await this._databaseService.clearDatabase();
    await this.importComplete(completeData);
  }

  async clearDatabaseExceptBackup() {
    const backup: AppDataComplete = await this.loadBackup();
    await this._databaseService.clearDatabase();
    if (backup) {
      await this.saveBackup(backup);
    }
  }

  async _loadAppBaseData(): Promise<AppBaseData> {
    const promises = this._baseModels.map(async (modelCfg) => {
      const modelState = await modelCfg.load();
      return {
        [modelCfg.appDataKey]: modelState,
      };
    });
    const baseDataArray: Partial<AppBaseData>[] = await Promise.all(promises);
    return Object.assign({}, ...baseDataArray);
  }

  // TODO maybe refactor to class?

  // ------------------
  private _cmBase<T>(
    lsKey: string,
    appDataKey: keyof AppBaseData,
    migrateFn: (state: T) => T = (v) => v,
  ): PersistenceBaseModel<T> {
    const model = {
      appDataKey,
      loadState: () => this._loadFromDb(lsKey).then(migrateFn),
      saveState: (data, isForce) => this._saveToDb(lsKey, data, isForce),
    };

    this._baseModels.push(model);
    return model;
  }

  // TODO maybe find a way to exec effects here as well
  private _cmProject<S, M>(
    lsKey: string,
    appDataKey: keyof AppDataForProjects,
    reducerFn: (state: S, action: Action) => S,
    migrateFn: (state: S, projectId: string) => S = (v) => v,
  ): PersistenceForProjectModel<S, M> {
    const model = {
      appDataKey,
      load: (projectId): Promise<S> => this._loadFromDb(this._makeProjectKey(projectId, lsKey)).then(v => migrateFn(v, projectId)),
      save: (projectId, data, isForce) => this._saveToDb(this._makeProjectKey(projectId, lsKey), data, isForce),
      remove: (projectId) => this._removeFromDb(this._makeProjectKey(projectId, lsKey)),

      // NOTE: side effects are not executed!!!
      update: async (projectId: string, adjustFn: (sate: S) => S): Promise<S> => {
        const state = await model.load(projectId);
        const newState = adjustFn(state);
        await model.save(projectId, newState, false);
        return newState;
      },
      ent: {
        getById: async (projectId: string, id: string): Promise<M> => {
          const state = await model.load(projectId) as any;
          return state && state.entities && state.entities[id] || null;
        },
        getByIds: async (projectId: string, ids: string[]): Promise<M[]> => {
          const state = await model.load(projectId) as any;
          if (state && state.entities) {
            return ids
              .map(id => state.entities[id])
              // filter out broken entries
              .filter((modelIN: M) => !!modelIN);
          }
          return null;
        },

        // NOTE: side effects are not executed!!!
        execAction: async (projectId: string, action: Action): Promise<S> => {
          const state = await model.load(projectId);
          const newState = reducerFn(state, action);
          await model.save(projectId, newState, false);
          return newState;
        },
        // NOTE: side effects are not executed!!!
        bulkUpdate: async (projectId: string, adjustFn: (model: M) => M): Promise<S> => {
          const state = await model.load(projectId) as any;
          const ids = state.ids as string[];
          const newState = {
            ...state,
            entities: ids.reduce((acc, key) => {
              return {
                ...acc,
                [key]: adjustFn(state.entity[key]),
              };
            }, {})
          };
          await model.save(projectId, newState, false);
          return newState;
        },
      },
      entAllProjects: {
        // NOTE: side effects are not executed!!!
        bulkUpdate: async (adjustFn: (model: M) => M): Promise<any> => {
          const projectIds = await this._getProjectIds();
          return Promise.all(projectIds.map(async (projectId) => {
            return model.ent.bulkUpdate(projectId, adjustFn);
          }));
        }
      }
    };

    this._projectModels.push(model);
    return model;
  }

  private async _getProjectIds(): Promise<string[]> {
    const projectState = await this.project.loadState();
    return projectState.ids as string[];
  }

  private async _loadAppDataForProjects(projectIds: string[]): Promise<AppDataForProjects> {
    const forProjectsData = await Promise.all(this._projectModels.map(async (modelCfg) => {
      const modelState = await this._loadForProjectIds(projectIds, modelCfg.load);
      return {
        [modelCfg.appDataKey]: modelState,
      };
    }));
    return Object.assign({}, ...forProjectsData);
  }

  // tslint:disable-next-line
  private async _loadForProjectIds(pids, getDataFn: Function): Promise<any> {
    return await pids.reduce(async (acc, projectId) => {
      const prevAcc = await acc;
      const dataForProject = await getDataFn(projectId);
      return {
        ...prevAcc,
        [projectId]: dataForProject
      };
    }, Promise.resolve({}));
  }

  // tslint:disable-next-line
  private async _saveForProjectIds(data: any, saveDataFn: Function, isForce = false) {
    const promises = [];
    Object.keys(data).forEach(projectId => {
      if (data[projectId]) {
        promises.push(saveDataFn(projectId, data[projectId], isForce));
      }
    });
    return await Promise.all(promises);
  }

  private _makeProjectKey(projectId, subKey, additional?) {
    return LS_PROJECT_PREFIX + projectId + '_' + subKey + (additional ? '_' + additional : '');
  }


  // DATA STORAGE INTERFACE
  // ---------------------
  private async _saveToDb(key: string, data: any, isForce = false): Promise<any> {
    if (!this._isBlockSaving || isForce === true) {
      return this._databaseService.save(key, data);
    } else {
      console.warn('BLOCKED SAVING for ', key);
      return Promise.reject('Data import currently in progress. Saving disabled');
    }
  }

  private async _removeFromDb(key: string, isForce = false): Promise<any> {
    if (!this._isBlockSaving || isForce === true) {
      return this._databaseService.remove(key);
    } else {
      console.warn('BLOCKED SAVING for ', key);
      return Promise.reject('Data import currently in progress. Removing disabled');
    }
  }

  private async _loadFromDb(key: string): Promise<any> {
    return this._databaseService.load(key);
  }
}
