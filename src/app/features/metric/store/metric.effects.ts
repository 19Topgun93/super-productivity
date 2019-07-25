import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {tap, withLatestFrom} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {MetricActionTypes} from './metric.actions';
import {selectCurrentProjectId} from '../../project/store/project.reducer';
import {PersistenceService} from '../../../core/persistence/persistence.service';
import {selectMetricFeatureState} from './metric.selectors';
import {T} from '../../../t.const';
import {SnackService} from '../../../core/snack/snack.service';

@Injectable()
export class MetricEffects {

  @Effect({dispatch: false}) updateMetrics$: any = this._actions$
    .pipe(
      ofType(
        MetricActionTypes.AddMetric,
        MetricActionTypes.UpdateMetric,
        MetricActionTypes.DeleteMetric,
        MetricActionTypes.UpsertMetric,
      ),
      withLatestFrom(
        this._store$.pipe(select(selectCurrentProjectId)),
        this._store$.pipe(select(selectMetricFeatureState)),
      ),
      tap(this._saveToLs.bind(this))
    );

  @Effect({dispatch: false}) saveMetrics$: any = this._actions$
    .pipe(
      ofType(
        MetricActionTypes.AddMetric,
        MetricActionTypes.UpsertMetric,
        MetricActionTypes.UpdateMetric,
      ),
      tap(() => this._snackService.open({
        type: 'SUCCESS',
        msg: T.F.METRIC.S.SAVE_METRIC
      })),
    );

  constructor(
    private _actions$: Actions,
    private _store$: Store<any>,
    private _persistenceService: PersistenceService,
    private _snackService: SnackService,
  ) {
  }

  private _saveToLs([action, currentProjectId, metricState]) {
    if (currentProjectId) {
      this._persistenceService.saveLastActive();
      this._persistenceService.metric.save(currentProjectId, metricState);
    } else {
      throw new Error('No current project id');
    }
  }

}
