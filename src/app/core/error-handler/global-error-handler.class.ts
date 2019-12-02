import {ErrorHandler, Injectable} from '@angular/core';
import {isObject} from '../../util/is-object';
import {getJiraResponseErrorTxt} from '../../util/get-jira-response-error-text';
import {HANDLED_ERROR_PROP_STR, IS_ELECTRON} from '../../app.constants';
import {ElectronService} from 'ngx-electron';
import {BannerService} from '../banner/banner.service';
import * as StackTrace from 'stacktrace-js';

let isWasErrorAlertCreated = false;

const _createErrorAlert = (eSvc: ElectronService, err: string, stackTrace: string, origErr: any) => {
  if (isWasErrorAlertCreated) {
    return;
  }

  const errorAlert = document.createElement('div');
  errorAlert.classList.add('global-error-alert');
  errorAlert.style.color = 'black';
  errorAlert.innerHTML = `
    <h2>Snap! A critical error occurred...<h2>
    <p><a href="https://github.com/johannesjo/super-productivity/issues/new" target="_blank">! Please Report !</a></p>
    <pre style="line-height: 1.3;">${err}</pre>
    <pre id="stack-trace"
         style="line-height: 1.3; text-align: left; max-height: 240px; font-size: 12px; overflow: auto;">${stackTrace}</pre>
    <pre style="line-height: 1.3; font-size: 12px;">${getSimpleMeta()}</pre>
  `;
  const btnReload = document.createElement('BUTTON');
  btnReload.innerText = 'Reload App';
  btnReload.addEventListener('click', () => {
    if (IS_ELECTRON) {
      eSvc.remote.getCurrentWindow().webContents.reload();
    } else {
      window.location.reload();
    }
  });
  errorAlert.append(btnReload);
  document.body.append(errorAlert);
  isWasErrorAlertCreated = true;
  getStacktrace(origErr).then(stack => {
    console.log(stack);
    document.getElementById('stack-trace').innerText = stack;
  });

  if (IS_ELECTRON) {
    eSvc.remote.getCurrentWindow().webContents.openDevTools();
  }
};

async function getStacktrace(err): Promise<string> {
  return StackTrace.fromError(err)
    .then((stackframes) => {
      return stackframes
        .splice(0, 20)
        .map((sf) => {
          return sf.toString();
        }).join('\n');
    });
}

const getSimpleMeta = (): string => {
  const n = window.navigator;
  return `META: ${IS_ELECTRON ? 'Electron' : 'Browser'} – ${n.language} – ${n.platform} – ${n.userAgent}`;
};

const isHandledError = (err): boolean => {
  const errStr = (typeof err === 'string') ? err : err.toString();
  // NOTE: for some unknown reason sometimes err is undefined while err.toString is not...
  // this is why we also check the string value
  return (err && err.hasOwnProperty(HANDLED_ERROR_PROP_STR)) || (errStr.match(HANDLED_ERROR_PROP_STR));
};

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private _electronLogger: any;

  constructor(
    private _bannerService: BannerService,
    private _electronService: ElectronService,
  ) {
    if (IS_ELECTRON) {
      this._electronLogger = this._electronService.remote.require('electron-log');
    }
  }

  // TODO Cleanup this mess
  handleError(err: any) {
    const errStr = (typeof err === 'string') ? err : err.toString();
    // tslint:disable-next-line
    const simpleStack = err && err.stack;
    console.log(isHandledError(err), err[HANDLED_ERROR_PROP_STR], errStr);

    // if not our custom error handler we have a critical error on our hands
    if (!isHandledError(err)) {
      const errorStr = this._getErrorStr(err) || errStr;

      // NOTE: dom exceptions will break all rendering that's why
      if (err.constructor && err.constructor === DOMException) {
        _createErrorAlert(this._electronService, 'DOMException: ' + errorStr, simpleStack, err);
      } else {
        _createErrorAlert(this._electronService, errorStr, simpleStack, err);
      }
    }

    console.error('GLOBAL_ERROR_HANDLER', err);
    console.log(getSimpleMeta());
    if (IS_ELECTRON) {
      this._electronLogger.error('Frontend Error:', err, simpleStack);
      getStacktrace(err).then(stack => {
        this._electronLogger.error('Frontend Error Stack:', err, stack);
      });
    }

    // NOTE: rethrow the error otherwise it gets swallowed
    throw err;
  }

  private _getErrorStr(err: any): string {
    if (isObject(err)) {
      return getJiraResponseErrorTxt(err);
    } else {
      return err.toString();
    }
  }
}
