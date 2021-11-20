import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { hideNotes, toggleShowNotes } from './layout.actions';
import { filter, mapTo, withLatestFrom } from 'rxjs/operators';
import { setSelectedTask } from '../../../features/tasks/store/task.actions';
import { LayoutService } from '../layout.service';
import { NavigationEnd, Router } from '@angular/router';

// what should happen
// task selected => open panel
// note show => open panel
// task selected, note show => task unselected, note shown
// note show, task selected, note show => task unselected, note shown
// note show, task selected => task shown, note hidden
// task selected, note show, task selected => task shown, note hidden

@Injectable()
export class LayoutEffects {
  hideNotesWhenTaskIsSelected$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setSelectedTask),
      filter(({ id }) => id !== null),
      mapTo(hideNotes()),
    ),
  );

  hideNotesNavigatingToDailySummary$ = createEffect(() =>
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      filter((event) => !!event.url.match(/(daily-summary)$/)),
      mapTo(hideNotes()),
    ),
  );

  hideSelectedTaskWhenNoteShowIsToggled$ = createEffect(() =>
    this.actions$.pipe(
      ofType(toggleShowNotes),
      withLatestFrom(this.layoutService.isShowNotes$),
      filter(([, isShowNotes]) => isShowNotes),
      mapTo(setSelectedTask({ id: null })),
    ),
  );

  constructor(
    private actions$: Actions,
    private layoutService: LayoutService,
    private router: Router,
  ) {}
}
