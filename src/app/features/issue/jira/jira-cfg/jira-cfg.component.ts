import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ConfigFormSection, GlobalConfigSectionKey} from '../../../config/global-config.model';
import {ProjectCfgFormKey} from '../../../project/project.model';
import {FormlyFieldConfig, FormlyFormOptions} from '@ngx-formly/core';
import {FormControl, FormGroup} from '@angular/forms';
import {JiraCfg} from '../jira';
import {expandAnimation} from '../../../../ui/animations/expand.ani';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {SearchResultItem} from '../../issue';
import {catchError, debounceTime, map, switchMap, tap} from 'rxjs/operators';
import {JiraApiService} from '../jira-api.service';
import {DEFAULT_JIRA_CFG} from '../jira.const';
import {JiraIssue} from '../jira-issue/jira-issue.model';
import {SnackService} from '../../../../core/snack/snack.service';
import {T} from '../../../../t.const';
import {HelperClasses} from '../../../../app.constants';

@Component({
  selector: 'jira-cfg',
  templateUrl: './jira-cfg.component.html',
  styleUrls: ['./jira-cfg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandAnimation]
})
export class JiraCfgComponent implements OnInit, OnDestroy {
  @Input() section: ConfigFormSection<JiraCfg>;

  // NOTE: this is legit because it might be that there is no issue provider cfg yet
  @Input() set cfg(cfg: JiraCfg) {
    this._cfg = cfg;
    if (!this._cfg.transitionConfig) {
      this._cfg.transitionConfig = DEFAULT_JIRA_CFG.transitionConfig;
    } else {
      // CLEANUP keys that we're not using
      Object.keys(this._cfg.transitionConfig).forEach((key) => {
        if (!(key in DEFAULT_JIRA_CFG.transitionConfig)) {
          delete this._cfg.transitionConfig[key];
        }
      });
    }

    if (!Array.isArray(this._cfg.availableTransitions)) {
      this._cfg.availableTransitions = DEFAULT_JIRA_CFG.availableTransitions;
    }
  }

  get cfg() {
    return this._cfg || DEFAULT_JIRA_CFG;
  }

  @Output() save: EventEmitter<{ sectionKey: GlobalConfigSectionKey | ProjectCfgFormKey, config: any }> = new EventEmitter();

  T = T;
  HelperClasses = HelperClasses;

  issueSuggestionsCtrl: FormControl = new FormControl();
  customFieldSuggestionsCtrl: FormControl = new FormControl();
  customFields: any [] = [];
  customFieldsPromise: Promise<any>;

  isLoading$ = new BehaviorSubject(false);

  fields: FormlyFieldConfig[];
  form = new FormGroup({});
  options: FormlyFormOptions = {};

  filteredIssueSuggestions$: Observable<SearchResultItem[]> = this.issueSuggestionsCtrl.valueChanges.pipe(
    debounceTime(300),
    tap(() => this.isLoading$.next(true)),
    switchMap((searchTerm) => {
      return (searchTerm && searchTerm.length > 1)
        ? this._jiraApiService.issuePicker$(searchTerm)
          .pipe(
            catchError(() => {
              return [];
            })
          )
        // Note: the outer array signifies the observable stream the other is the value
        : [[]];
    }),
    tap((suggestions) => {
      this.isLoading$.next(false);
    }),
  );

  filteredCustomFieldSuggestions$: Observable<any[]> = this.customFieldSuggestionsCtrl.valueChanges.pipe(
    map(value => this._filterCustomFieldSuggestions(value)),
  );

  private _subs = new Subscription();
  private _cfg: JiraCfg;

  constructor(
    private _jiraApiService: JiraApiService,
    private _snackService: SnackService,
  ) {
  }

  ngOnInit(): void {
    this.fields = this.section.items;
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  submit() {
    if (!this.cfg) {
      throw new Error('No config for ' + this.section.key);
    } else {
      this.save.emit({
        sectionKey: this.section.key,
        config: this.cfg,
      });
    }
  }

  trackByCustomFieldId(i: number, field: any) {
    return field.id;
  }

  displayIssueWith(issue: JiraIssue) {
    return issue && issue.summary;
  }

  trackByIssueId(i: number, issue: JiraIssue) {
    return issue.id;
  }

  loadCustomFields() {
    this.customFieldsPromise = this._jiraApiService.listFields$().toPromise();
    this.customFieldsPromise.then((v: any) => {
      if (v && Array.isArray(v.response)) {
        this.customFields = v.response;
      }
    });
  }

  updateTransitionOptions() {
    const searchResultItem = this.issueSuggestionsCtrl.value as SearchResultItem;
    if (!searchResultItem || typeof searchResultItem === 'string') {
      this.issueSuggestionsCtrl.setValue('');
      return;
    } else {
      const issueId = searchResultItem.issueData.id as string;
      this._subs.add(
        this._jiraApiService.getTransitionsForIssue$(issueId)
          .subscribe((val) => {
            this.cfg.availableTransitions = val;
            this._snackService.open({
              type: 'SUCCESS',
              msg: T.F.JIRA.S.TRANSITIONS_LOADED,
            });
          })
      );
    }
  }

  private _filterCustomFieldSuggestions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.customFields.filter(field => field
      && (
        field.name.toLowerCase().includes(filterValue)
        || field.id.includes(filterValue)
      ));
  }
}
