import data from './name_to_id.json' assert { type: 'json' };
import Fuse from 'fuse.js';

export async function handler(event, context) {
  const { name, address } = event.queryStringParameters;

  if (!name || !address) {
    return {
      statusCode: 400
    };
  }

  const fuse = new Fuse(data, {
    keys: ['Establishment Name', 'Establishment Address'],
  });

  const res = fuse.search({
    $and: [
      { 'Establishment Name': name },
      { 'Establishment Address': address },
    ]
  })[0]?.item;

  return {
    statusCode: 200,
    body: JSON.stringify(res),
  };
}