// Rocket Inspector: always on. The toolbar icon PAUSES one tab and resumes it.
// The per-tab badge is the single source of truth for the paused state, so a
// restarted service worker can never drift out of sync with what the icon shows.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  const current = await chrome.action.getBadgeText({ tabId: tab.id });
  const pausing = current !== 'OFF';
  await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#6b7280' });
  await chrome.action.setBadgeText({ tabId: tab.id, text: pausing ? 'OFF' : '' });
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'set-armed', armed: !pausing });
  } catch (e) {
    // No content script in this tab (a browser page, or a tab opened before
    // install). Clear the badge so it never claims a state nothing heard.
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  }
});
