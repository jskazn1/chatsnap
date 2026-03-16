// Get Google OAuth token via chrome.identity and pass it to the web app
chrome.identity.getAuthToken({ interactive: true }, function (token) {
  if (chrome.runtime.lastError || !token) {
    console.error('Auth failed:', chrome.runtime.lastError?.message)
    document.body.innerHTML = '<p style="padding:20px;font-family:sans-serif;">Sign-in failed. Please try again.</p>'
    return
  }

  // Load the hosted app with the token as a URL parameter
  // The app will detect this and use signInWithCredential
  const appUrl = 'https://jordansk-chatter202020.web.app'
  const iframe = document.getElementById('app')
  iframe.src = `${appUrl}?chromeToken=${encodeURIComponent(token)}`
})
