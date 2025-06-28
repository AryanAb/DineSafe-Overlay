let lastUrl = location.href;

new MutationObserver(async () => {
  const currentUrl = location.href.split('@')[0];
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (/^https:\/\/www\.google\.[a-z.]+\/maps\/place/.test(currentUrl)) {
      if (isEatingEstablishment()) {
        const { name, address, lat, lon } = getSelectedEstablishmentInfo(location.href);
        getEstablishmentIdFromInfo(name, address, lat, lon);
        // const { url, score } = await getInspectionDetails(name, address);
        // console.log(url, score);
        injectRatingBadge(0, 'url');
      }
    }
  }
}).observe(document, { subtree: true, childList: true });

function isEatingEstablishment() {
  const typeBtn = document.getElementsByClassName('DkEaL ')
  const type = typeBtn[0]?.textContent?.toLocaleLowerCase();
  if (type?.includes('bar') || type?.includes('pub') || type?.includes('restaurant') || type?.includes('cafe')) {
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

function getEstablishmentIdFromInfo(name, address, lat, lon) {
  chrome.storage.local.get(['data'], ({ data }) => {
    console.log(data);
  });
}

async function getInspectionDetails(name, address) {
  const response = await fetch(`https://health-inspector.netlify.app/.netlify/functions/hello?name=${name}&address=${address}`);
  const json = await response.json();
  return json;
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
}
