request = new XMLHttpRequest
request.open('GET', '../options/options.json', true)
request.send()


request.onload = async function () {
  data = JSON.parse(this.response)
  for (var key in data) {
    data[key] = data[key].val
    if(localStorage[key]) { data[key] = localStorage[key] }
  }

  browser.runtime.onMessage.addListener(function(message, sender, sendMessage) {
    if(message.url) {
      browser.tabs.query(
        {windowId: sender.tab.windowId},
        function(tabs) {
          var position = sender.tab.index;
          for(var i = position; i < tabs.length; i++) {
            if(tabs[i].openerTabId == sender.tab.id) {
              position = i
            }
          }
          var mute = message.mute
          delete message.mute

          message.openerTabId = sender.tab.id
          message.index = position + 1
          browser.tabs.create(message, function(tab) {
            if (mute) listenAndCloseTab(tab, message.url, sender.tab.id)
          })
        }
      )
    } else {
      sendMessage(data)
    }
  })
}

function listenAndCloseTab (tab, url, originalTabId) {
  var listener = setInterval(function () {
    browser.tabs.get(tab.id, function (tab) {
      if (tab.status === 'complete') {
        browser.tabs.remove(tab.id)
        clearInterval(listener)
        // Unsubscription finished
        browser.tabs.sendMessage(originalTabId, {muteURL: url})
      }
    })
  }, 500)
}
