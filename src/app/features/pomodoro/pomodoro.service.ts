import { Injectable } from '@angular/core';
import { combineLatest, merge, Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { filter, map, mapTo, scan, shareReplay, withLatestFrom } from 'rxjs/operators';
import { PomodoroConfig } from '../config/config.model';
import { TimeTrackingService } from '../time-tracking/time-tracking.service';
import { select, Store } from '@ngrx/store';
import { FinishPomodoroSession, PausePomodoro, StartPomodoro, StopPomodoro } from './store/pomodoro.actions';
import { selectCurrentCycle, selectIsBreak, selectIsManualPause } from './store/pomodoro.reducer';
import { DEFAULT_CFG } from '../config/default-config.const';

// Tick Duration
const TD = -1000;
const DEFAULT_SOUND = 'assets/snd/positive.ogg';
const DEFAULT_TICK_SOUND = 'assets/snd/tick.mp3';

@Injectable()
export class PomodoroService {
  cfg$: Observable<PomodoroConfig> = this._configService.cfg$.pipe(map(cfg => cfg && cfg.pomodoro));

  // TODO use this somehow
  isEnabled$: Observable<boolean> = this.cfg$.pipe(map(cfg => cfg && cfg.isEnabled));

  isManualPause$: Observable<boolean> = this._store$.pipe(select(selectIsManualPause));
  isBreak$: Observable<boolean> = this._store$.pipe(select(selectIsBreak));
  currentCycle$: Observable<number> = this._store$.pipe(select(selectCurrentCycle));

  isLongBreak$: Observable<boolean> = combineLatest(
    this.isBreak$,
    this.currentCycle$,
    this.cfg$,
  ).pipe(map(([isBreak, currentCycle, cfg]) => {
    return isBreak && cfg.cyclesBeforeLongerBreak && Number.isInteger(((currentCycle + 1) / cfg.cyclesBeforeLongerBreak));
  }));

  isShortBreak$: Observable<boolean> = combineLatest(
    this.isBreak$,
    this.isLongBreak$,
  ).pipe(map(([isBreak, isLongBreak]) => isBreak && !isLongBreak));

  timer$ = this._timeTrackingService.globalInterval$;
  tick$ = this.timer$.pipe(
    withLatestFrom(this.isManualPause$),
    filter(([v, isManualPause]) => !isManualPause),
    mapTo(TD),
  );

  nextSession$: Observable<number> = this.isBreak$.pipe(
    withLatestFrom(
      this.isLongBreak$,
      this.isShortBreak$,
      this.cfg$
    ),
    map(([isBreak, isLong, isShort, cfg]) => {
      // return isBreak ? (isLong ? 20000 : 3000) : 5000;
      if (!isBreak) {
        return cfg.duration || DEFAULT_CFG.pomodoro.duration;
      } else if (isShort) {
        return cfg.longerBreakDuration || DEFAULT_CFG.pomodoro.breakDuration;
      } else if (isLong) {
        return cfg.longerBreakDuration || DEFAULT_CFG.pomodoro.longerBreakDuration;
      }
    }),
    shareReplay(),
  );

  currentSessionTime$: Observable<any> = merge(
    this.tick$,
    this.nextSession$
  ).pipe(
    scan((acc, value) => {
      return (value === TD)
        ? acc + value
        : value;
    }),
    shareReplay(),
  );

  sessionProgress$: Observable<number> = this.currentSessionTime$.pipe(
    withLatestFrom(this.nextSession$),
    map(([currentTime, initialTime]) => {
      return (initialTime - currentTime) / initialTime * 100;
    })
  );


  constructor(
    private _configService: ConfigService,
    private _store$: Store<any>,
    private _timeTrackingService: TimeTrackingService,
  ) {
    this.currentSessionTime$
      .pipe(
        filter(val => (val <= 0)),
        withLatestFrom(this.cfg$, this.isBreak$),
      )
      .subscribe(([val, cfg, isBreak]) => {
        if (cfg.isManualContinue && isBreak) {
          this.pause();
        } else {
          this.finishPomodoroSession();
        }
      });

    this.currentSessionTime$.pipe(
      withLatestFrom(this.cfg$, this.isBreak$),
      filter(([val, cfg, isBreak]) => cfg.isPlayTick),
    ).subscribe(() => this._playTickSound());
  }

  start() {
    this._store$.dispatch(new StartPomodoro());
  }

  pause() {
    this._store$.dispatch(new PausePomodoro());
  }

  stop() {
    this._store$.dispatch(new StopPomodoro());
  }

  finishPomodoroSession(isDontResume = false) {
    this._store$.dispatch(new FinishPomodoroSession({isDontResume}));
  }

  // NON STORE ACTIONS
  playSessionDoneSound() {
    new Audio(DEFAULT_SOUND).play();
  }

  private _playTickSound() {
    new Audio(DEFAULT_TICK_SOUND).play();
  }
}
