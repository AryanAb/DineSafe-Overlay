let lastUrl = location.href;

new MutationObserver(async () => {
  const currentUrl = location.href.split('@')[0];
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (/^https:\/\/www\.google\.[a-z.]+\/maps\/place/.test(currentUrl)) {
      if (isEatingEstablishment()) {
        const { name, address } = getNameAndAddress(currentUrl);
        console.log(name, address);
        const { url, score } = await getInspectionDetails(name, address);
        console.log(url, score);
        injectRatingBadge(score, url);
      }
    }
  }
}).observe(document, { subtree: true, childList: true });

function getNameAndAddress(currentUrl) {
  const components = currentUrl.split('/');
  const name = components[components.length - 2];
  const div = document.getElementsByClassName('Io6YTe fontBodyMedium kR99db fdkmkc ')[0];
  const address = div.innerText;

  return { name, address };
}

function isEatingEstablishment() {
  const typeBtn = document.getElementsByClassName('DkEaL ')
  const type = typeBtn[0]?.textContent?.toLocaleLowerCase();
  if (type?.includes('bar') || type?.includes('pub') || type?.includes('restaurant') || type?.includes('cafe')) {
    return true;
  }
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
