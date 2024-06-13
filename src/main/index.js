import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join, resolve } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { getPgClient, getMysqlClient, getClickhouseClient, testPgConnection, testMysqlConnection, testClickhouseConnection } from './database';

async function createWindow() {


  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    icon: join(__dirname, '../../resources/Icon.ico'),
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
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

  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

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
  
  try {
    if (!query) {
      throw new Error('Query text is empty');
    }

    console.log(`Executing query on client type: ${clientType}`);
    console.log(`Query: ${query}`);

    let result;
    switch (clientType) {
      case 'client1':
        const pgClient = getPgClient(connectionDetails);
        await pgClient.connect();
        console.log('PostgreSQL Client Connected');
        result = await pgClient.query(query);
        console.log('Query Result:', result.rows);
        await pgClient.end();
        return JSON.parse(JSON.stringify(result.rows));
      case 'client2':
        const mysqlClient = await getMysqlClient(connectionDetails);
        console.log('MySQL Client Connected');
        [result] = await mysqlClient.execute(query);
        console.log('Query Result:', result);
        await mysqlClient.end();
        return JSON.parse(JSON.stringify(result));
      case 'client3':
        const clickhouseClient = getClickhouseClient(connectionDetails);
        console.log('ClickHouse Client Connected');
        result = await clickhouseClient.query(query).toPromise();
        console.log('Query Result:', result.data);
        return JSON.parse(JSON.stringify(result.data));
      default:
        throw new Error('Unknown client type');
    }
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
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
