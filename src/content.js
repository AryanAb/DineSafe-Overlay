import KDBush from "kdbush";
import * as geokdbush from 'geokdbush';

let lastUrl = location.href;

new MutationObserver(async () => {
  const currentUrl = location.href.split('@')[0];
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (/^https:\/\/www\.google\.[a-z.]+\/maps\/place/.test(currentUrl)) {
      if (isEatingEstablishment()) {
        const { name, address, lat, lon } = getSelectedEstablishmentInfo(location.href);
        const { estId } = await getEstablishmentIdFromInfo(name, address, lat, lon);;
        const { url, score } = await getInspectionDetails(estId);
        injectRatingBadge(score, url);
      }
    }
  }
}).observe(document, { subtree: true, childList: true });

function isEatingEstablishment() {
  const typeBtn = document.getElementsByClassName('DkEaL ')
  const type = typeBtn[0]?.textContent?.toLocaleLowerCase();
  if (type?.includes('bar') || type?.includes('pub') || type?.includes('restaurant') || type?.includes('cafe') || type?.includes('ice cream')) {
    return true;
  }
}

function getSelectedEstablishmentInfo(currentUrl) {
  const regex = /!3d([-.\d]+)!4d([-.\d]+)/;
  const match = currentUrl.match(regex);
  var lat = undefined;
  var lon = undefined;
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
  const nearestIds = geokdbush.around(index, lon, lat, 50, 0.05);
  const nearest = nearestIds.map(id => data[id]);
  console.log(nearest);
  
  // TODO: Add fuzzy matching with name and address to to ensure we are returning the right establishment
  return nearest[0];
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
  badge.setAttribute('target', '_blank')
  if (score < 2.5) {
    badge.innerText = '🟢';
  } else if (score < 6.5) {
    badge.innerText = '🟡';
  } else {
    badge.innerText = '🔴';
  }
  newDiv.appendChild(badge);
  console.log('badge injected');
}
