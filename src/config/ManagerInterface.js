// @flow
type itemValidationType = {
  errorMessages: Array<{
    fieldName: string,
    message: string
  }>,
  passed: bool,
  data?: {
    [prop: string]: string,
  }
};

export interface ManagerInterface<T> {
  add: (item: T) => Promise<itemValidationType>,
  remove: (itemId: string) => Promise<void>,
  removeAll: () => Promise<void>,
  get: (itemId: string) => Promise<T>,
  getAll: () => Promise<Array<T>>,
}