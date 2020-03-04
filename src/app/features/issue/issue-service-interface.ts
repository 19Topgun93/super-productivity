import {Observable} from 'rxjs';
import {IssueData, IssueDataReduced, SearchResultItem} from './issue.model';
import {Task} from '../tasks/task.model';
import {Attachment} from '../attachment/attachment.model';

export interface IssueServiceInterface {
  issueLink?(issueId: string | number): string;

  getById$?(id: string | number): Observable<IssueData>;

  searchIssues$?(searchTerm: string): Observable<SearchResultItem[]>;

  refreshIssue?(task: Task, isNotifySuccess: boolean, isNotifyNoUpdateRequired: boolean): Promise<{ taskChanges: Partial<Task>, issue: IssueData }>;

  getAddTaskData?(issueData: IssueDataReduced): { title: string; additionalFields: Partial<Task> };

  getMappedAttachments?(issueDataIN: IssueData): Attachment[];
}
