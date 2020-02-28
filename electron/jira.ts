import {getWin} from './main-window';
import {IPC} from './ipc-events.const';
import {session} from 'electron';
import {JiraCfg} from '../src/app/features/issue/jira/jira.model';
// import rp from 'request-promise';
// const rp = require('request-promise');
import fetch from 'node-fetch';


export const sendJiraRequest = ({requestId, requestInit, url, cfg}: { requestId: string; requestInit: RequestInit; url: string, cfg: any }) => {
  const mainWin = getWin();
  console.log('--------------------------------------------------------------------');
  console.log(url);
  console.log('--------------------------------------------------------------------');

  fetch(url, requestInit)
    .then((response) => {
      // console.log('JIRA_RAW_RESPONSE', response);
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(res => res.text())
    .then(text => text ? JSON.parse(text) : {})
    .then((response) => {
      mainWin.webContents.send(IPC.JIRA_CB_EVENT, {
        response,
        requestId,
      });
    })
    .catch((error) => {
      console.error('JIRA_ERR_ERR', error);
      mainWin.webContents.send(IPC.JIRA_CB_EVENT, {
        error,
        requestId,
      });
    });
};

// TODO simplify and do encoding in frontend service
export const setupRequestHeadersForImages = (jiraCfg: JiraCfg) => {
  const {host, protocol, port} = parseHostAndPort(jiraCfg);

  // TODO export to util fn
  const _b64EncodeUnicode = (str) => {
    return new Buffer(str || '').toString('base64');
  };
  const encoded = _b64EncodeUnicode(`${jiraCfg.userName}:${jiraCfg.password}`);
  const filter = {
    urls: [`${protocol}://${host}/*`]
  };

  // thankfully only the last attached listener will be used
  // @see: https://electronjs.org/docs/api/web-request
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['authorization'] = `Basic ${encoded}`;
    callback({requestHeaders: details.requestHeaders});
  });
};

const MATCH_PROTOCOL_REG_EX = /(^[^:]+):\/\//;
const MATCH_PORT_REG_EX = /:\d{2,4}/;

const parseHostAndPort = (config: JiraCfg) => {
  let host = config.host;
  let protocol;
  let port;

  // parse port from host and remove it
  if (host.match(MATCH_PORT_REG_EX)) {
    const match = MATCH_PORT_REG_EX.exec(host);
    host = host.replace(MATCH_PORT_REG_EX, '');
    port = parseInt(match[0].replace(':', ''), 10);
  }

  // parse protocol from host and remove it
  if (host.match(MATCH_PROTOCOL_REG_EX)) {
    const match = MATCH_PROTOCOL_REG_EX.exec(host);
    host = host
      .replace(MATCH_PROTOCOL_REG_EX, '')
      // remove trailing slash just in case
      .replace(/\/$/, '');

    protocol = match[1];
  } else {
    protocol = 'https';
  }

  // console.log({host, protocol, port});
  return {host, protocol, port};
};
