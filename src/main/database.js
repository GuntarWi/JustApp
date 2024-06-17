import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import { ClickHouse } from 'clickhouse';

// Function to create a PostgreSQL client
const getPgClient = (connectionDetails) => {
  return new PgClient({
    host: connectionDetails.host,
    port: Number(connectionDetails.port),
    user: connectionDetails.user,
    password: connectionDetails.password,
    database: connectionDetails.database,
  });
};

// Function to create a MySQL client
const getMysqlClient = async (connectionDetails) => {
  return await mysql.createConnection({
    host: connectionDetails.host,
    port: Number(connectionDetails.port),
    user: connectionDetails.user,
    password: connectionDetails.password,
    database: connectionDetails.database,
  });
};

// Function to create a ClickHouse client
const getClickhouseClient = (connectionDetails) => {
  return new ClickHouse({
    url: connectionDetails.host,
    port: Number(connectionDetails.port),
    basicAuth: {
      username: connectionDetails.user,
      password: connectionDetails.password,
    },
    debug: false,
    isUseGzip: true,
    format: 'json',
    database: connectionDetails.database,
  });
};

// Function to test PostgreSQL connection
const testPgConnection = async (connectionDetails) => {
  const client = getPgClient(connectionDetails);
  try {
    await client.connect();
    console.log('PostgreSQL connection successful');
    await client.end();
    return true;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    return false;
  }
};

// Function to test MySQL connection
const testMysqlConnection = async (connectionDetails) => {
  try {
    const client = await getMysqlClient(connectionDetails);
    console.log('MySQL connection successful');
    await client.end();
    return true;
  } catch (error) {
    console.error('MySQL connection error:', error);
    return false;
  }
};

// Function to test ClickHouse connection
const testClickhouseConnection = async (connectionDetails) => {
  try {
    const client = getClickhouseClient(connectionDetails);
    await client.query('SELECT 1').toPromise();
    console.log('ClickHouse connection successful');
    return true;
  } catch (error) {
    console.error('ClickHouse connection error:', error);
    return false;
  }
};

// In src/main/database.js
async function getTables(client) {
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    return res.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error; // Rethrow to handle in renderer process
  }
}

export { getPgClient, getMysqlClient, getClickhouseClient, testPgConnection, testMysqlConnection, testClickhouseConnection };
