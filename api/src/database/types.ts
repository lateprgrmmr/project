import {
    RetrievalOptions,
    ResultProcessingOptions,
    PersistenceInsertOptions,
    OrderingOptions
} from 'massive';
import { some } from 'lodash';
import { Connection } from './connection';

export async function connection<T>(
    db: Connection,
    cb: (cx: Connection) => Promise<T>,
    options?: { tag?: string, mode?: any },
): Promise<T> {
    return db.withConnection(cb, options);
}

export function hasEmptyArray<T>(criteria: SearchCriteria<T>): boolean {
    // prevent SQL error in the case of an empty array
    return some(criteria, (val) => Array.isArray(val) && val.length === 0);
};

export interface PantryOrderingOptions<T> extends OrderingOptions {
    field?: Extract<keyof T, string>,
}

export interface PantryRetrievalOptions<T> extends RetrievalOptions {
    fields?: (Extract<keyof T, string>)[]; // TODO: JJT (AKT) need to change the return type to Pick the fields defined here
    ordering?: PantryOrderingOptions<T>[];
    distinct?: boolean;
}

type NestedSearchCriteria = {
    or?: Record<string, string | number | number[] | null>[];
    and?: Record<string, string | number | number[] | null>[];
};

type TableSearchCriteria<T> = {
    [K in keyof T]?: T[K] | T[K][];
}

export type SearchCriteria<T> = TableSearchCriteria<T> & NestedSearchCriteria;

type SaveOptions<T> = ResultProcessingOptions & { onConflictUpdate: (keyof T)[] };

export interface MassiveTableType<T, Insert extends Partial<T>, Update extends Partial<T>> {
    destroy(criteria: SearchCriteria<T>, options?: ResultProcessingOptions): Promise<T[]>;
    destroy(id: number | string, options?: ResultProcessingOptions): Promise<T | null>;

    insert(data: Insert, options?: PersistenceInsertOptions & ResultProcessingOptions): Promise<T | null>;
    insert(data: Insert[], options?: PersistenceInsertOptions & ResultProcessingOptions): Promise<T[]>;

    update(criteria: SearchCriteria<T>, fields: Update, options?: ResultProcessingOptions): Promise<T[]>;
    update(id: number | string, fields: Update, options?: ResultProcessingOptions): Promise<T | null>;

    save(object: Partial<T>, options?: SaveOptions<T>): Promise<T>;

    find(criteria?: SearchCriteria<T>, options?: PantryRetrievalOptions<T> & ResultProcessingOptions): Promise<T[]>;
    findOne(criteria: SearchCriteria<T> | number | string, options?: ResultProcessingOptions): Promise<T | null>;

    count(criteria?: SearchCriteria<T>): Promise<string | null>;
}

export class PantryView<T, Insert extends Partial<T>, Update extends Partial<T>> {
    protected table: MassiveTableType<T, Insert, Update>;
    protected scripts: MassiveTableType<T, Insert, Update>;
    protected defaultRetrievalOptions: PantryRetrievalOptions<T> = {};

    constructor(
        table: MassiveTableType<T, Insert, Update>,
        scripts: MassiveTableType<T, Insert, Update>,
        defaultRetrievalOptions: PantryRetrievalOptions<T> = {}
    ) {
        this.table = table;
        this.scripts = scripts;
        this.defaultRetrievalOptions = defaultRetrievalOptions;
    }

    public async findOne(criteria: SearchCriteria<T> | number | string, options?: ResultProcessingOptions): Promise<T | null> {
        return this.table.findOne(criteria);
    }

    public async find(criteria?: SearchCriteria<T>, options?: PantryRetrievalOptions<T> & ResultProcessingOptions): Promise<T[]> {
        if (criteria && hasEmptyArray<T>(criteria)) {
            return [];
        }
        return this.table.find(criteria, {
            ...this.defaultRetrievalOptions,
            ...options,
        })
    }

    public async count(criteria?: SearchCriteria<T>): Promise<string | null> {
        if (criteria && hasEmptyArray<T>(criteria)) {
            return '0';
        }
        return this.table.count(criteria);
    }

    public script<U extends any[]>(scriptName: string): (obj: Record<string, any>) => Promise<U> {
        if (!this.scripts) {
            throw new Error("No scripts available for this table");
        }
        if (!this.scripts.hasOwnProperty(scriptName)) {
            throw new Error(`Script ${scriptName} does not exist on this table`);
        }
        return this.scripts[scriptName];
    }
}

export class PantryTable<T,
    Insert extends Partial<T> = Partial<T>,
    Update extends Partial<T> = Partial<T>> extends PantryView<T, Insert, Update> {
    public async insertOne(object: Insert, options?: PersistenceInsertOptions & ResultProcessingOptions): Promise<T | null> {
        return this.table.insert(object, options);
    }

    public async insert(objects: Insert[], options?: PersistenceInsertOptions & ResultProcessingOptions): Promise<T[]> {
        if (objects.length === 0) {
            return [];
        }
        return this.table.insert(objects, options);
    }

    public async save(object: Insert): Promise<T | null> {
        return this.table.save(object)
    }

    public async updateOne(id: number | string, updates: Update, options?: ResultProcessingOptions): Promise<T | null> {
        return this.table.update(id, updates, options);
    }

    public async update(criteria: SearchCriteria<T>, updates: Update): Promise<T[]> {

        if (hasEmptyArray<T>(criteria)) {
            return [];
        }

        return this.table.update(criteria, updates);
    }

    public async destroyOne(id: number | string): Promise<T | null> {
        return this.table.destroy(id);
    }

    public async destroy(criteria: SearchCriteria<T>): Promise<T[]> {

        if (hasEmptyArray<T>(criteria)) {
            return [];
        }

        return this.table.destroy(criteria);
    }
}

abstract class CreateAndReadDAO<
    T extends SearchCriteria<T>,
    Insert extends Partial<T> = Partial<T>,
> {

    protected abstract getTable(db: Connection): Promise<PantryTable<T, Insert>>;

    // override when needed
    protected defaultMapper(record: T): T {
        return record;
    }

    protected sanitizeInsertRecord(record: Insert): Insert {
        return record;
    }

    async script<U extends any[]>(db: Connection, scriptName: string, params: Record<string, any>): Promise<U> {
        const table = await this.getTable(db);

        const records: U = await table.script<U>(scriptName)(params);
        return records;
    }

    async findById(db: Connection, id: number | string): Promise<T | null> {
        const table = await this.getTable(db);
        const record = await table.findOne(id);
        return record ? this.defaultMapper(record) : null;
    }

    async findOneFor(db: Connection, criteria: SearchCriteria<T>): Promise<T | null> {
        const table = await this.getTable(db);
        const record = await table.findOne(criteria);
        return record ? this.defaultMapper(record) : null;
    }

    async findAll(db: Connection, options?: PantryRetrievalOptions<T> & ResultProcessingOptions): Promise<T[]> {
        const table = await this.getTable(db);
        const records = await table.find(undefined, options);
        return records.map(this.defaultMapper);
    }

    async findAllFor(db: Connection, criteria: SearchCriteria<T>, options?: PantryRetrievalOptions<T> & ResultProcessingOptions): Promise<T[]> {
        const table = await this.getTable(db);

        const records = await table.find(criteria, options);
        return records.map(this.defaultMapper);
    }

    async count(db: Connection, criteria?: SearchCriteria<T>): Promise<number> {
        const table = await this.getTable(db);

        const count: string | null = await table.count(criteria);
        const countAsNumber = Number(count);
        if (Number.isNaN(countAsNumber)) {
            console.error('Massive count returned NaN', 500, { count, countAsNumber, criteria });
        }
        return countAsNumber;
    }

    async insert(db: Connection, record: Insert, options?: PersistenceInsertOptions): Promise<T | null> {
        const table = await this.getTable(db);
        const sanitizedRecord = this.sanitizeInsertRecord(record);
        const newRecord = await table.insertOne(sanitizedRecord, options);
        return newRecord ? this.defaultMapper(newRecord) : null;
    }

    async batchInsert(db: Connection, records: Insert[]): Promise<T[]> {
        const sanitizedRecords = records.map((r) => this.sanitizeInsertRecord(r));
        const table = await this.getTable(db);

        const newRecords = await table.insert(sanitizedRecords);
        if (newRecords.length !== sanitizedRecords.length) {
            console.warn('Number of inserted records does not match requested number to be inserted', { newRecords, sanitizedRecords, records });
        }
        return newRecords.map(this.defaultMapper);
    }

    async batchInsertWithIds(db: Connection, records: Insert[], options?: PersistenceInsertOptions): Promise<T[]> {
        const sanitizedRecords = records.map((r) => this.sanitizeInsertRecord(r));
        const table = await this.getTable(db);

        const newRecords = await table.insert(sanitizedRecords, options);
        return newRecords.map(this.defaultMapper);
    }

    async save(db: Connection, record: Insert): Promise<T | null> {
        const table = await this.getTable(db);
        const sanitizedRecord = this.sanitizeInsertRecord(record);
        const upsertedRecord = await table.save(sanitizedRecord);
        return upsertedRecord ?this.defaultMapper(upsertedRecord) : null;
    }
}

export abstract class ImmutableBaseDAO<
    T extends SearchCriteria<T>,
    Insert extends Partial<T>,
> extends CreateAndReadDAO<T, Insert> { }

export abstract class BaseDAO<
    T extends SearchCriteria<T>,
    Insert extends Partial<T> = Partial<T>,
    Update extends Partial<T> = Partial<T>,
> extends CreateAndReadDAO<T, Insert> {

    protected sanitizeUpdateRecord(record: Update): Update {
        return record;
    }

    async updateById(db: Connection, id: number | string, record: Update): Promise<T | null> {
        const table = await this.getTable(db);

        const sanitizedRecord = this.sanitizeUpdateRecord(record);

        const updatedRecord = await table.updateOne(id, sanitizedRecord);
        return updatedRecord ? this.defaultMapper(updatedRecord) : null;
    }

    async update(db: Connection, criteria: SearchCriteria<T>, record: Update): Promise<T[]> {
        const table = await this.getTable(db);

        const sanitizedRecord = this.sanitizeUpdateRecord(record);

        const updatedRecord = await table.update(criteria, sanitizedRecord);
        return updatedRecord.map(this.defaultMapper);
    }

    async removeById(db: Connection, id: number | string): Promise<T | null> {
        const table = await this.getTable(db);
        return await table.destroyOne(id);
    }

    async removeAllFor(db: Connection, criteria: SearchCriteria<T>): Promise<T[]> {
        const table = await this.getTable(db);
        return await table.destroy(criteria);
    }
}
