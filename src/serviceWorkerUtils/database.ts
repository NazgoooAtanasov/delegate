export type Storage = {
  conncect(): Promise<void>;
  getAll<T>(storage: string): Promise<T[]>;
  find<T>(storage: string, id: number): Promise<T>;
  findIndex<T, K extends IDBValidKey>(storage: string, index: string, key: K): Promise<T>;
  add<T>(storage: string, data: T): Promise<number>;
  update<T>(storage: string, data: T): Promise<void>;
  remove(storage: string, id: number): Promise<number>;
  removeAll(storage: string): Promise<void>;
};

export default class Database implements Storage {
  private db: IDBDatabase | null = null;

  constructor() {}

  async conncect(): Promise<void> {
    return new Promise((res, rej) => {
      const dbOpenRequest = indexedDB.open("delegate", 3);

      dbOpenRequest.addEventListener("success", (_) => {
        this.db = dbOpenRequest.result;
        res();
      });

      dbOpenRequest.addEventListener("error", (err) => rej(err));

      dbOpenRequest.addEventListener("upgradeneeded", () => {
        this.db = dbOpenRequest.result;

        if (!this.db.objectStoreNames.contains("permissions")) {
          const permissions = this.db.createObjectStore("permissions", {
            keyPath: "id",
            autoIncrement: true,
          });
          permissions.createIndex("url", "url", { unique: true });
        }

        if (!this.db.objectStoreNames.contains("activites")) {
          this.db.createObjectStore("activites", {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        if (!this.db.objectStoreNames.contains("missions")) {
          const missions = this.db.createObjectStore("missions", {
            keyPath: "id",
            autoIncrement: true,
          });
          missions.createIndex("name", "name", { unique: true });
        }

        res();
      });
    });
  }

  async getAll<T>(storage: string): Promise<T[]> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readonly");
      const objectStore = transaction?.objectStore(storage);
      const request = objectStore?.getAll();

      request?.addEventListener("success", () => {
        res(request.result);
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }

  async find<T>(storage: string, id: number): Promise<T> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readonly");
      const objectStore = transaction?.objectStore(storage);
      const request = objectStore?.get(id);

      request?.addEventListener("success", () => {
        res(request.result);
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }

  async findIndex<T, K extends IDBValidKey>(storage: string, index: string, key: K): Promise<T> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readonly");
      const objectStore = transaction?.objectStore(storage);
      const indexStore = objectStore?.index(index);
      const request = indexStore?.get(key);

      request?.addEventListener("success", () => {
        res(request.result);
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }

  async add<T>(storage: string, data: T): Promise<number> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readwrite");
      const objectStore = transaction?.objectStore(storage);
      const request = objectStore?.add(data);

      request?.addEventListener("success", () => {
        res(request.result as number);
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }

  async update<T>(storage: string, data: T): Promise<void> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readwrite");
      const objectStore = transaction?.objectStore(storage);
      const request = objectStore?.put(data);

      request?.addEventListener("success", () => {
        res();
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }

  async remove(storage: string, id: number): Promise<number> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readwrite");
      const objectStore = transaction?.objectStore(storage);
      const request = objectStore?.delete(id);

      request?.addEventListener("success", () => {
        res(id);
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }

  async removeAll(storage: string): Promise<void> {
    return new Promise((res, rej) => {
      const transaction = this.db?.transaction(storage, "readwrite");
      const objectStore = transaction?.objectStore(storage);
      const request = objectStore?.clear();

      request?.addEventListener("success", () => {
        res();
      });

      request?.addEventListener("error", (err) => {
        rej(err);
      });
    });
  }
}
