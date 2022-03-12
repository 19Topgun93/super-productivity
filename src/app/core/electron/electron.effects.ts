import { Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { fromEvent, Observable } from 'rxjs';
import { IS_ELECTRON } from '../../app.constants';
import { ElectronService } from './electron.service';
import { IpcRenderer, shell } from 'electron';
import { IPC } from '../../../../electron/shared-with-frontend/ipc-events.const';
import { tap } from 'rxjs/operators';
import { SnackService } from '../snack/snack.service';
import { T } from '../../t.const';

@Injectable()
export class ElectronEffects {
  fileDownloadedSnack$: Observable<unknown> | false =
    IS_ELECTRON &&
    createEffect(
      () =>
        fromEvent(
          this._electronService.ipcRenderer as IpcRenderer,
          IPC.ANY_FILE_DOWNLOADED,
        ).pipe(
          tap((args) => {
            const fileParam = (args as any)[1];
            const path = fileParam.path;
            const fileName = path.replace(/^.*[\\\/]/, '');
            const dir = path.replace(/[^\/]*$/, '');
            this._snackService.open({
              ico: 'file_download',
              // ico: 'file_download_done',
              // ico: 'download_done',
              msg: T.GLOBAL_SNACK.FILE_DOWNLOADED,
              translateParams: {
                fileName,
              },
              actionStr: T.GLOBAL_SNACK.FILE_DOWNLOADED_BTN,
              actionFn: () => {
                (this._electronService.shell as typeof shell).openPath(dir);
              },
            });
          }),
        ),
      { dispatch: false },
    );

  constructor(
    private _electronService: ElectronService,
    private _snackService: SnackService,
  ) {}
}
