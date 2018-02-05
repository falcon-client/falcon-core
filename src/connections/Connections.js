// @flow
// Manage saved connections to databases. Encrypts passwords
import keytar from 'keytar';
import Store from 'electron-store';
import { error } from 'util';


type connectionValidationType = {
  errorMessages: Array<{
    fieldName: string,
    message: string
  }>,
  passed: bool
};

type connectionType = {
  // The internal id for the connection
  id: string,
  // The name of the connection
  name: string,
  // Which database the connection is for
  type: 'sqlite' | 'mysql' | 'postgres' | 'mssql',
  // These are properties that are specific to certain databases.
  // The pervious properties are required for all databases
  meta?: {
    password?: string,
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

/**
 * This class is a general manager for falcon database connections.
 * It can be extended to fit the needs of specific databases. For
 * example, if a specific database requires encryption, the .get()
 * method can be modified
 */
export default class Connections {
  store = new FinalStore({
    defaults: {
      connections: []
    }
  });

  /**
   * @TODO
   */
  async validateBeforeCreation(connection: connectionType): Promise<connectionValidationType> {
    const isFilePath = await import('is-valid-path');
    const Joi = await import('joi');
    const fs = await import('fs');

    const customJoi = Joi.extend(joi => ({
      base: joi.string(),
      name: 'string',
      language: {
        file: 'needs to be a file',
        file_exists: 'does not exist'
      },
      rules: [
        {
          name: 'file',
          validate(params, value, state, options) {
            return !isFilePath(value)
              ? this.createError('string.file', { v: value, q: params.q }, state, options)
              : value;
          }
        },
        {
          name: 'file_exists',
          validate(params, value, state, options) {
            return fs.existsSync(value)
              ? value
              : this.createError('string.file_exists', { v: value, q: params.q }, state, options);
          }
        }
      ]
    }));

    const schema = (() => {
      switch (connection.type) {
        case 'sqlite': {
          return customJoi.object().keys({
            id: customJoi.string().required(),
            name: customJoi.string().required(),
            database: customJoi.string().file().file_exists().required(),
            type: customJoi.string().required()
          });
        }
        default: {
          throw new Error(`Unknown database type "${connection.type}". This probably means it is not supported`);
        }
      }
    })();

    const errors = customJoi.validate(connection, schema, { abortEarly: false });
    if (errors.error) {
      if (errors.error.details.length > 0) {
        return errors.error.details;
      }
    }

    return [];
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
