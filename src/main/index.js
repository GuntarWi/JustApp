import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { getPgClient, getMysqlClient, getClickhouseClient, testPgConnection, testMysqlConnection, testClickhouseConnection } from './database';

const __dirname = dirname(fileURLToPath(import.meta.url));

let blockingWindow = null;
let blockingTimeoutId = null;
let countdownIntervalId = null;
let currentClient = null;
let activeClients = [];

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    icon: join(__dirname, '../../resources/Icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeAllConnections();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('close-connection', async () => {
  closeBlockingWindow();
  closeCurrentConnection();
});

ipcMain.on('close-all-connections', async () => {
  closeAllConnections();
});

function createBlockingWindow(timeout) {
  blockingWindow = new BrowserWindow({
    width: 300,
    height: 200,
    frame: false,
    modal: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  blockingWindow.loadFile(join(__dirname, '../renderer/blocking.html'));
  blockingWindow.on('closed', () => {
    blockingWindow = null;
  });

  blockingWindow.webContents.on('did-finish-load', () => {
    let countdown = timeout / 1000;
    blockingWindow.webContents.send('update-countdown', countdown);

    countdownIntervalId = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(countdownIntervalId);
      }
      blockingWindow.webContents.send('update-countdown', countdown);
    }, 1000);
  });
}

function closeBlockingWindow() {
  if (blockingWindow) {
    blockingWindow.close();
    blockingWindow = null;
  }
  clearTimeout(blockingTimeoutId);
  clearInterval(countdownIntervalId);
}

function closeCurrentConnection() {
  if (currentClient) {
    try {
      currentClient.end();
      currentClient = null;
      console.log('Current database connection closed');
    } catch (error) {
      console.error('Error closing current database connection:', error);
    }
  }
}

function closeAllConnections() {
  activeClients.forEach(client => {
    try {
      client.end();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  });
  activeClients = [];
}

ipcMain.on('save-config', async (event, key, value) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  store.set(key, value);
});

ipcMain.handle('get-config', async (event, key) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  return store.get(key);
});

ipcMain.handle('execute-query', async (event, { clientType, query }) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  const connectionDetails = store.get(clientType);

  const TIMEOUT_MS = 10000; // 10 seconds
  const BLOCKING_WINDOW_DELAY = 0; // 3 seconds
  let timeoutId;
  let result;

  const showBlockingWindow = () => {
    createBlockingWindow(TIMEOUT_MS - BLOCKING_WINDOW_DELAY);
  };

  blockingTimeoutId = setTimeout(showBlockingWindow, BLOCKING_WINDOW_DELAY);

  try {
    if (!query) {
      throw new Error('Query text is empty');
    }

    console.log(`Executing query on client type: ${clientType}`);
    console.log(`Query: ${query}`);

    const timeoutPromise = new Promise((_, reject) =>
      timeoutId = setTimeout(() => reject(new Error('Query timed out')), TIMEOUT_MS)
    );

    switch (clientType) {
      case 'client1':
        currentClient = getPgClient(connectionDetails);
        activeClients.push(currentClient);
        await currentClient.connect();
        console.log('PostgreSQL Client Connected');
        result = await Promise.race([currentClient.query(query), timeoutPromise]);
        console.log('Query Result:', result.rows);
        await currentClient.end();
        activeClients = activeClients.filter(client => client !== currentClient);
        clearTimeout(timeoutId);
        closeBlockingWindow();
        return JSON.parse(JSON.stringify(result.rows));
      case 'client2':
        currentClient = await getMysqlClient(connectionDetails);
        activeClients.push(currentClient);
        console.log('MySQL Client Connected');
        [result] = await Promise.race([currentClient.execute(query), timeoutPromise]);
        console.log('Query Result:', result);
        await currentClient.end();
        activeClients = activeClients.filter(client => client !== currentClient);
        clearTimeout(timeoutId);
        closeBlockingWindow();
        return JSON.parse(JSON.stringify(result));
      case 'client3':
        currentClient = getClickhouseClient(connectionDetails);
        activeClients.push(currentClient);
        console.log('ClickHouse Client Connected');
        result = await Promise.race([currentClient.query(query).toPromise(), timeoutPromise]);
        console.log('Query Result:', result.data);
        clearTimeout(timeoutId);
        closeBlockingWindow();
        return JSON.parse(JSON.stringify(result.data));
      default:
        throw new Error('Unknown client type');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    closeBlockingWindow();
    console.error('Error executing query:', error);
    throw error;
  } finally {
    closeCurrentConnection();
  }
});

ipcMain.handle('test-connection', async (event, clientType) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  const connectionDetails = store.get(clientType);

  try {
    let isConnected;
    switch (clientType) {
      case 'client1':
        isConnected = await testPgConnection(connectionDetails);
        break;
      case 'client2':
        isConnected = await testMysqlConnection(connectionDetails);
        break;
      case 'client3':
        isConnected = await testClickhouseConnection(connectionDetails);
        break;
      default:
        throw new Error('Unknown client type');
    }
    console.log(`Connection status for ${clientType}: ${isConnected}`);
    return isConnected;
  } catch (error) {
    console.error('Error testing connection:', error);
    throw error;
  }
});

ipcMain.handle('get-tables', async (event, clientType) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  const connectionDetails = store.get(clientType);

  try {
    let tables = [];
    switch (clientType) {
      case 'client1':
        const pgClient = getPgClient(connectionDetails);
        try {
          await pgClient.connect();
          console.log('PostgreSQL Client Connected for fetching tables');
          const pgResult = await pgClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
          tables = pgResult.rows.map(row => row.table_name);
          await pgClient.end();
        } catch (pgError) {
          console.error('PostgreSQL Error:', pgError);
          throw pgError;
        }
        break;
      case 'client2':
        const mysqlClient = await getMysqlClient(connectionDetails);
        try {
          console.log('MySQL Client Connected for fetching tables');
          const [mysqlResult] = await mysqlClient.query("SHOW TABLES");
          tables = mysqlResult.map(row => Object.values(row)[0]);
          await mysqlClient.end();
        } catch (mysqlError) {
          console.error('MySQL Error:', mysqlError);
          throw mysqlError;
        }
        break;
      case 'client3':
        const clickhouseClient = getClickhouseClient(connectionDetails);
        try {
          console.log('ClickHouse Client Connected for fetching tables');
          const clickhouseResult = await clickhouseClient.query("SHOW TABLES").toPromise();
          tables = clickhouseResult.data.map(row => row.name);
        } catch (clickhouseError) {
          console.error('ClickHouse Error:', clickhouseError);
          throw clickhouseError;
        }
        break;
      default:
        throw new Error('Unknown client type');
    }
    console.log(`Fetched tables for ${clientType}:`, tables); // Add logging
    return tables;
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
});

ipcMain.handle('get-databases', async (event, connectionDetails) => {
  try {
    const pgClient = getPgClient(connectionDetails);
    await pgClient.connect();
    const result = await pgClient.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    await pgClient.end();
    return result.rows.map(row => row.datname);
  } catch (error) {
    console.error('Error fetching databases:', error);
    throw error;
  }
});

ipcMain.handle('load-connection-details', async (event, clientType) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  return store.get(clientType);
});

ipcMain.handle('save-connection-details', async (event, clientType, details) => {
  const { default: Store } = await import('electron-store');
  const store = new Store();
  store.set(clientType, details);
  return true;
});
