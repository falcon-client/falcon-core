import { GraphQLInt, GraphQLString } from 'graphql';
import JSONType from './types/jsonType';

export default function () {
  return {
    limit: {
      type: GraphQLInt
    },
    order: {
      type: GraphQLString
    },
    where: {
      type: JSONType,
      description: 'A JSON object conforming the the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/'
    },
    offset: {
      type: GraphQLInt
    }
  };
};
//# sourceMappingURL=defaultListArgs.js.map