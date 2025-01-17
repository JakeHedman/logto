import type { SchemaLike, GeneratedSchema } from '@logto/schemas';
import { convertToIdentifiers } from '@logto/shared';
import type { CommonQueryMethods } from 'slonik';
import { sql, NotFoundError } from 'slonik';

import RequestError from '#src/errors/RequestError/index.js';
import assertThat from '#src/utils/assert-that.js';
import { isKeyOf } from '#src/utils/schema.js';

type WithId<Key> = Key | 'id';

export const buildFindEntityByIdWithPool =
  (pool: CommonQueryMethods) =>
  <
    Key extends string,
    CreateSchema extends Partial<SchemaLike<WithId<Key>>>,
    Schema extends SchemaLike<WithId<Key>>,
  >(
    schema: GeneratedSchema<WithId<Key>, CreateSchema, Schema>
  ) => {
    const { table, fields } = convertToIdentifiers(schema);
    const isKeyOfSchema = isKeyOf(schema);

    // Make sure id is key of the schema
    assertThat(isKeyOfSchema('id'), 'entity.not_exists');

    return async (id: string) => {
      try {
        return await pool.one<Schema>(sql`
          select ${sql.join(Object.values(fields), sql`, `)}
          from ${table}
          where ${fields.id}=${id}
        `);
      } catch (error: unknown) {
        if (error instanceof NotFoundError) {
          throw new RequestError({
            code: 'entity.not_exists_with_id',
            name: schema.table,
            id,
            status: 404,
          });
        }
        throw error;
      }
    };
  };
