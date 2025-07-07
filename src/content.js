import KDBush from "kdbush";
import * as geokdbush from 'geokdbush';
import Fuse from 'fuse.js';

let lastUrl = location.href;

new MutationObserver(async () => {
  const currentUrl = location.href.split('@')[0];
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (/^https:\/\/www\.google\.[a-z.]+\/maps\/place/.test(currentUrl)) {
      // it usually takes a bit of time for the new sidebar to fully load, so just wait it out
      setTimeout(async () => {
        if (isEatingEstablishment()) {
          const { name, address, lat, lon } = getSelectedEstablishmentInfo(location.href);
          const result = await getEstablishmentIdFromInfo(name, address, lat, lon);
          if (result) {
            const { url, score } = await getInspectionDetails(result.estId);
            injectRatingBadge(score, url);
          } else {
            injectUnknownBadge();
          }
        }
      }, 250);
    }
  }
}).observe(document, { subtree: true, childList: true });

function isEatingEstablishment() {
  const typeBtn = document.getElementsByClassName('DkEaL ')
  const type = typeBtn[0]?.textContent?.toLocaleLowerCase();
  if (type?.includes('bar') || type?.includes('pub') || type?.includes('restaurant') || type?.includes('cafe') || type?.includes('ice cream') || type?.includes('diner') || type?.includes('coffee shop')) {
    return true;
  }
}

function getSelectedEstablishmentInfo(currentUrl) {
  const regex = /!3d([-.\d]+)!4d([-.\d]+)/g;
  const matches = Array.from(currentUrl.matchAll(regex));
  const match = matches[matches.length - 1];
  let lat = undefined;
  let lon = undefined;
  if (match) {
    lat = parseFloat(match[1]);
    lon = parseFloat(match[2]);
  }

  const nameDiv = document.getElementsByClassName('DUwDvf lfPIob')[0];
  const name = nameDiv?.innerText;

  const addressDiv = document.getElementsByClassName('Io6YTe fontBodyMedium kR99db fdkmkc ')[0];
  const address = addressDiv?.innerText;

  return { name, address, lat, lon };
}

async function getEstablishmentIdFromInfo(name, address, lat, lon) {
  const { data } = await chrome.storage.local.get(['data']);

  const index = new KDBush(data.length);
  for (const { lon, lat } of data) {
    index.add(lon, lat);
  }
  index.finish();
  const nearestIds = geokdbush.around(index, lon, lat, 50, 0.075);
  const nearest = nearestIds.map(id => data[id]);
  const fuse = new Fuse(nearest, { keys: ['estName', 'addrFull'] });
  let result = fuse.search({
    $and: [
      { 'estName': name },
      { 'addrFull': address },
    ],
  })[0]?.item;
  
  if (result !== undefined) {
    return result;
  }

  // Some establishments have additional text included in their name
  // so strip that text and try again
  const parsedName = name.includes('|') ? name.split('|')[0] : name.split('-')[0];
  result = fuse.search({
    $and: [
      { 'estName': parsedName },
      { 'addrFull': address },
    ],
  })[0]?.item;

  return result;
}

async function getInspectionDetails(id) {
  const url = `https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/#establishment/${id}`;

  const response = await fetch(`https://secure.toronto.ca/opendata/ds/est_summary/v1?format=json&est_id=${id}`);
  const json = await response.json();

  // if the latest year's inspection result is a fail immediately send a bad score
  if (json.inspections[0].insStatus === 'Closed') {
    return { url, score: 99 }
  }

  let totalScore = 0;
  let multiplier = 1.0;
  for (const inspection of json.inspections) {
    let inspectionScore = 0;
    for (const infraction of inspection.infractions ?? []) {
      if (infraction.infDtl[0].infType === 'S - Significant') {
        inspectionScore += 3;
      } else {
        inspectionScore += 1;
      }
    }
    totalScore += inspectionScore * multiplier;
    multiplier = Math.min(0.2, multiplier - 0.2);
  }

  return { url, score: totalScore };
}

function injectRatingBadge(score, url) {
  const ratingDiv = document.getElementsByClassName('fontBodyMedium dmRWX')[0];
  const newDiv = document.createElement('div');
  newDiv.style.display = 'flex';
  newDiv.style.flexDirection = 'row';
  newDiv.style.justifyContent = 'space-between';
  newDiv.style.alignItems = 'center';
  ratingDiv.parentNode.insertBefore(newDiv, ratingDiv);
  newDiv.appendChild(ratingDiv);

  const badge = document.createElement('a');
  badge.setAttribute('href', url);
  badge.setAttribute('target', '_blank');
  badge.setAttribute('style', 'font-size: 0.875rem; text-decoration: none;')
  badge.setAttribute('data-testid', 'DineSafeOverlay-badge');
  if (score <= 3) {
    badge.innerText = '🟢';
  } else if (score <= 6.5) {
    badge.innerText = '🟡';
  } else {
    badge.innerText = '🔴';
  }
  newDiv.appendChild(badge);
}

function injectUnknownBadge() {
  const ratingDiv = document.getElementsByClassName('fontBodyMedium dmRWX')[0];
  const newDiv = document.createElement('div');
  newDiv.style.display = 'flex';
  newDiv.style.flexDirection = 'row';
  newDiv.style.justifyContent = 'space-between';
  newDiv.style.alignItems = 'center';
  ratingDiv.parentNode.insertBefore(newDiv, ratingDiv);
  newDiv.appendChild(ratingDiv);

  const badge = document.createElement('a');
  badge.setAttribute('href', 'https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/#explore_all_establishments/0');
  badge.setAttribute('target', '_blank');
  badge.setAttribute('style', 'font-size: 0.875rem; text-decoration: none;')
  badge.setAttribute('data-testid', 'DineSafeOverlay-badge');
  badge.innerText = '❓';
  newDiv.appendChild(badge);
}
