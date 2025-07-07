const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // One week

chrome.runtime.onInstalled.addListener(() => {
  initializeEstablishmentsCache();
});

chrome.runtime.onStartup.addListener(() => {
  initializeEstablishmentsCache();
});

async function fetchEstablishments() {
  const BATCH_SIZE = 7;
  const ALPHABET = ['0', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  let res = [];
  for (let i = 0; i < Math.ceil(ALPHABET.length / BATCH_SIZE); i++) {
    const batch = ALPHABET.slice(i * (BATCH_SIZE + 1), (i + 1) * (BATCH_SIZE + 1));
    const responses = await Promise.all(batch.map(letter => fetch(`https://secure.toronto.ca/opendata/ds/establishments/v1?format=json&first_letter=${letter}`)));
    const jsons = await Promise.all(responses.map(response => response.json()));
    res = res.concat(jsons.flat());
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log(res);
  return res;
}

function initializeEstablishmentsCache() {
  chrome.storage.local.get(['data', 'lastFetched'], async (items) => {
    const now = Date.now();
    if (items.data == undefined || items.lastFetched == undefined || now - items.lastFetched > CACHE_TTL) {
      const establishments = await fetchEstablishments();
      chrome.storage.local.set({ data: establishments, lastFetched: now });
    }
  });
}
