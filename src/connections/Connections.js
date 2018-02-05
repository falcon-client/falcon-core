// @flow
// Manage saved connections to databases. Encrypts passwords
import keytar from 'keytar';
import Store from 'electron-store';
import validator from 'validator';

type connectionValidationType = {
  message: string,
  passed: bool
};

type connectionType = {
  id: string,
  name: string,
  password: string,
  type: 'sqlite' | 'mysql' | 'postgres' | 'mssql',
  // These are properties that are specific to certain databases.
  // The pervious properties are required for all databases
  meta?: {
    database?: string,
    port?: number,
    host?: string,
    username?: string,
    [otherKeys: string]: string
  }
};

// We can't import electron in jest so electron-store won't work.
// We need to use 'conf' as a drop-in replacement for electron-store
// in the testing environment
const FinalStore = process.env.NODE_ENV === 'test'
  ? require('conf') // eslint-disable-line
  : Store;

export default class Connections {
  store = new FinalStore({
    defaults: {
      connections: []
    }
  });

  async validateBeforeCreation(connection: connectionType): Promise<connectionValidationType> {
    switch (connection.type) {
      case 'sqlite': {
        // connection is require and is a string
        // database is required and is a string
        return [];
      }
      default: {
        throw new Error(`Unknown database type "${connection.type}". This probably means it is not supported`);
      }
    }
  }

  async create(connection: connectionType) {
    const connections = await this.getAll();
    connections.push(connection);
    this.store.set('connections', connections);
  }

  /**
   * Delete a connection by it's id
   */
  async delete(connectionId: string) {
    const connections = await this.getAll();
    const filteredConnections =
      connections.filter(connection => connection.id !== connectionId);
    this.store.set('connections', filteredConnections);
  }

  async deleteAll() {
    await this.store.set('connections', []);
  }

  /**
   * Update a connection by giving a new config
   */
  async update(connectionId: string, connection: connectionType): Promise<void> {
    const connections = await this.getAll();
    const connectionToUpdateIndex =
      connections.findIndex(conn => conn.id === connectionId);

    switch (connectionToUpdateIndex) {
      case -1: {
        throw new Error(`Connection with id "${connectionId}" not found`);
      }
      default: {
        connections[connectionToUpdateIndex] = connection;
      }
    }

    this.store.set('connections', connections);
  }

  async getAll(): Promise<Array<connectionType>> {
    return this.store.get('connections');
  }

  async get(connectionId: string): Promise<connectionType> {
    const connections = await this.getAll();
    const connectionIndex =
      connections.findIndex(conn => conn.id === connectionId);

    switch (connectionIndex) {
      case -1: {
        throw new Error(`Connection with id "${connectionId}" not found`);
      }
      default: {
        return connections[connectionIndex];
      }
    }
  }
}
