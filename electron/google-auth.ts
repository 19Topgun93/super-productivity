import { google } from 'googleapis';
import { BrowserWindow, ipcMain } from 'electron';
import { getWin } from './main-window';
import { IPC_GOOGLE_AUTH_TOKEN, IPC_GOOGLE_AUTH_TOKEN_ERROR, IPC_TRIGGER_GOOGLE_AUTH } from './ipc-events.const';

const A = {
  CLIENT_ID: '37646582031-e281jj291amtk805td0hgfqss2jfkdcd.apps.googleusercontent.com',
  API_KEY: 'AIzaSyBqr3r5B5QGb_drLTK8_q9HW7YUez83Bik',
  EL_CLIENT_ID: '37646582031-qo0kc0p6amaukfd5ub16hhp6f8smrk1n.apps.googleusercontent.com',
  EL_API_KEY: 'Er6sAwgXCDKPgw7y8jSuQQTv',
  DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets.readonly' +
    ' https://www.googleapis.com/auth/drive'
};

const clientId = A.EL_CLIENT_ID;
const clientSecret = A.EL_API_KEY;
const scopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];


/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'urn:ietf:wg:oauth:2.0:oob'
);


google.options({auth: oauth2Client});

async function authenticate(refreshToken) {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' ')
    });

    // grab the url that will be used for authorization
    if (refreshToken) {
      // console.log('SETTING REFRESH TOKEN', refreshToken);
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      oauth2Client.getAccessToken()
        .then((res) => {
          // console.log('TOKEN REFRESH ', res.res.data);
          resolve(res.res.data);
        })
        .catch(reject);
    } else {
      // open the browser window to the authorize url to start the workflow
      openAuthWindow(authorizeUrl)
        .then((code: any) => {
          oauth2Client.getToken(code)
            .then((res) => resolve(res.tokens))
            .catch(reject);
        })
        .catch(reject);
    }
  });
}

function openAuthWindow(url) {
  const browserWindowParams = {
    center: true,
    show: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false
    }
  };

  return new Promise((resolve, reject) => {
    /* tslint:disable-next-line */
    const win = new BrowserWindow(browserWindowParams || {useContentSize: true});

    win.loadURL(url);

    win.on('closed', () => {
      reject(new Error('User closed the window'));
    });

    win.on('page-title-updated', () => {
      setImmediate(() => {
        const title = win.getTitle();
        if (title.startsWith('Denied')) {
          reject(new Error(title.split(/[ =]/)[2]));
          win.removeAllListeners('closed');
          win.close();
        } else if (title.startsWith('Success')) {
          console.log(title);

          resolve(title.split(/[ =]/)[2]);
          win.removeAllListeners('closed');
          win.close();
        }
      });
    });
  });
}

// oauth2Client.on('tokens', (tokens) => {
//   console.log('TOKENS');
//   if (tokens.refresh_token) {
//     // store the refresh_token in my database!
//     console.log(tokens.refresh_token);
//   }
//   console.log(tokens.access_token);
// });


export const initGoogleAuth = function () {
  ipcMain.on(IPC_TRIGGER_GOOGLE_AUTH, (ev, refreshToken) => {
    console.log('refreshToken', (refreshToken && refreshToken.length));
    const mainWin = getWin();
    authenticate(refreshToken).then((res: any) => {
      mainWin.webContents.send(IPC_GOOGLE_AUTH_TOKEN, res);
    }).catch((err) => {
      mainWin.webContents.send(IPC_GOOGLE_AUTH_TOKEN_ERROR);
      console.log('error');
      console.log(err);
    });
  });
};

