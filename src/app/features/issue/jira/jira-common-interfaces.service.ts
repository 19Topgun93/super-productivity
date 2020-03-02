import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {Task} from 'src/app/features/tasks/task.model';
import {catchError, map, switchMap} from 'rxjs/operators';
import {IssueServiceInterface} from '../issue-service-interface';
import {JiraCfg} from './jira.model';
import {JiraApiService} from './jira-api.service';
import {SnackService} from '../../../core/snack/snack.service';
import {TaskService} from '../../tasks/task.service';
import {ProjectService} from '../../project/project.service';
import {SearchResultItem} from '../issue.model';
import {JiraIssue} from './jira-issue/jira-issue.model';
import {JiraIssueService} from './jira-issue/jira-issue.service';
import {Attachment} from '../../attachment/attachment.model';
import {mapJiraAttachmentToAttachment} from './jira-issue/jira-issue-map.util';
import {T} from '../../../t.const';


@Injectable({
  providedIn: 'root',
})
export class JiraCommonInterfacesService implements IssueServiceInterface {
  isJiraSearchEnabled$: Observable<boolean> = this._projectService.currentJiraCfg$.pipe(
    map(jiraCfg => jiraCfg && jiraCfg.isEnabled)
  );
  jiraCfg: JiraCfg;

  constructor(
    private readonly _store: Store<any>,
    private readonly _jiraApiService: JiraApiService,
    private readonly _jiraIssueService: JiraIssueService,
    private readonly _snackService: SnackService,
    private readonly _taskService: TaskService,
    private readonly _projectService: ProjectService,
  ) {
    this._projectService.currentJiraCfg$.subscribe((jiraCfg) => this.jiraCfg = jiraCfg);
  }

  getById$(issueId: string | number) {
    return this._jiraApiService.getIssueById$(issueId, true);
  }

  searchIssues$(searchTerm: string): Observable<SearchResultItem[]> {
    return this.isJiraSearchEnabled$.pipe(
      switchMap((isSearchJira) => isSearchJira
        ? this._jiraApiService.issuePicker$(searchTerm).pipe(catchError(() => []))
        : of([])
      )
    );
  }

  async refreshIssue(
    task: Task,
    isNotifySuccess = true,
    isNotifyNoUpdateRequired = false
  ): Promise<{ taskChanges: Partial<Task>, issue: JiraIssue }> {
    const issue = await this._jiraApiService.getIssueById$(task.issueId, false).toPromise();

    // @see https://developer.atlassian.com/cloud/jira/platform/jira-expressions-type-reference/#date
    const newUpdated = new Date(issue.updated).getTime();
    const wasUpdated = newUpdated > (task.issueLastUpdated || 0);

    // NOTIFICATIONS
    if (wasUpdated && isNotifySuccess) {
      this._snackService.open({
        msg: T.F.JIRA.S.ISSUE_UPDATE,
        translateParams: {
          issueText: `${issue.key}`
        },
        ico: 'cloud_download',
      });
    } else if (isNotifyNoUpdateRequired) {
      this._snackService.open({
        msg: T.F.JIRA.S.ISSUE_NO_UPDATE_REQUIRED,
        translateParams: {
          issueText: `${issue.key}`
        },
        ico: 'cloud_download',
      });
    }

    if (wasUpdated) {
      return {
        taskChanges: {
          title: `${issue.key} ${issue.summary}`,
          issueLastUpdated: newUpdated,
          issueWasUpdated: wasUpdated,
          issueAttachmentNr: issue.attachments.length,
          issuePoints: issue.storyPoints
        },
        issue,
      };
    }
  }

  async getAddTaskData(issueId: string | number)
    : Promise<{ title: string; additionalFields: Partial<Task> }> {
    const issue = await this._jiraApiService.getIssueById$(issueId, true).toPromise();

    return {
      title: `${issue.key} ${issue.summary}`,
      additionalFields: {
        issuePoints: issue.storyPoints,
        issueAttachmentNr: issue.attachments ? issue.attachments.length : 0,
        issueWasUpdated: false,
        issueLastUpdated: new Date(issue.updated).getTime()
      }
    };
  }

  issueLink(issueId: string | number): string {
    return this.jiraCfg.host + '/browse/' + issueId;
  }

  getMappedAttachments(issueData: JiraIssue): Attachment[] {
    return issueData && issueData.attachments && issueData.attachments.map(mapJiraAttachmentToAttachment);
  }
}
