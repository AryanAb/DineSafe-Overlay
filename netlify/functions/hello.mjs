import data from './name_to_id.json' assert { type: 'json' };
import Fuse from 'fuse.js';
import * as cheerio from 'cheerio';

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

  const establishment = fuse.search({
    $and: [
      { 'Establishment Name': name },
      { 'Establishment Address': address },
    ]
  })[0]?.item;

  const id = establishment["Establishment ID"];
  const url = `https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/#infraction_details/${id}/0`;
  
  const response = await fetch(`https://secure.toronto.ca/opendata/ds/est_summary/v1?format=json&est_id=${id}`);
  const json = await response.json();

  // if the latest year's inspection result is a fail immediately send a bad score
  if (json.inspections[0].insStatus === 'Closed') {
    return {
      statusCode: 200,
      body: JSON.stringify({ url, score: 99 })
    }
  }

  let totalScore = 0;
  let multiplier = 1.0;
  for (const inspection of json.inspections) {
    let inspectionScore = 0;
    for (const infraction of inspection.infractions) {
      if (infraction.infDtl[0].infType === 'S - Significant') {
        inspectionScore += 3;
      } else {
        inspectionScore += 1;
      }
    }
    totalScore += inspectionScore * multiplier;
    multiplier = Math.min(0.2, multiplier - 0.2);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ url, score: totalScore }),
  };
}