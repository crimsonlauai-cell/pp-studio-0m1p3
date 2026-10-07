// Pet Photo Creator — GAS Backend
// Deploy as Web App: Execute as Me, Access: Anyone
//
// Before deploying, set Script Properties (Project Settings → Script Properties → Add property):
//   GEMINI_API_KEY  your AQ.xxx key
//   ACCESS_TOKEN    the passcode friends type in; unset = every request is rejected
//
// First deploy: run testAll() once in the editor to grant UrlFetchApp / Drive permissions,
// then create a NEW deployment (updating an existing one keeps the old authorization).

const FOLDER_NAME = 'Pet Photo Creator - Generated Photos'
const GEMINI_MODEL = 'gemini-3.1-flash-image'

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    if (!isAuthorized(data.token)) return makeResponse({ success: false, error: 'unauthorized' })
    if (data.action === 'verify') return makeResponse({ success: true })
    if (data.action === 'generateImage') return handleGenerateImage(data)
    if (data.action === 'saveImage') return handleSaveImage(data)
    if (data.action === 'getGallery') return handleGetGallery()
    return makeResponse({ success: false, error: 'Unknown action' })
  } catch (err) {
    return makeResponse({ success: false, error: err.message })
  }
}

// Gallery moved to POST so the token never appears in a URL
function doGet(e) {
  return makeResponse({ success: false, error: 'Unknown action' })
}

function isAuthorized(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN')
  return !!expected && token === expected
}

function handleGetGallery() {
  const folder = getOrCreateFolder()
  const files = folder.getFiles()
  const images = []
  while (files.hasNext()) {
    const file = files.next()
    images.push({
      url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w2000`,
      fileId: file.getId(),
      filename: file.getName(),
      timestamp: file.getDateCreated().getTime(),
    })
  }
  images.sort((a, b) => b.timestamp - a.timestamp)
  return makeResponse({ success: true, images })
}

function handleGenerateImage(data) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')
  if (!apiKey) return makeResponse({ success: false, error: 'API key not configured in Script Properties' })

  const { images, prompt, petCount } = data
  const multiPetNote = petCount > 1
    ? `There are ${petCount} separate pet photos provided. Include ALL ${petCount} pets together in ONE single photorealistic scene.`
    : ''

  const parts = [{ text: `${multiPetNote} ${prompt}` }]
  images.forEach(img => {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
  })

  const payload = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })

  const result = JSON.parse(response.getContentText())
  if (result.error) return makeResponse({ success: false, error: result.error.message })

  const candidate = result.candidates?.[0]
  const imagePart = candidate?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imagePart) return makeResponse({ success: false, error: 'Gemini did not return an image' })

  return makeResponse({
    success: true,
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  })
}

function handleSaveImage(data) {
  const folder = getOrCreateFolder()
  const blob = Utilities.newBlob(
    Utilities.base64Decode(data.base64),
    data.mimeType,
    data.filename
  )
  const file = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)

  return makeResponse({
    success: true,
    fileUrl: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w2000`,
    fileId: file.getId(),
  })
}

function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME)
  if (folders.hasNext()) return folders.next()
  return DriveApp.createFolder(FOLDER_NAME)
}

function makeResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

// 執行這個函數來授權所有需要的 API 權限
function testAll() {
  // 授權 UrlFetchApp
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')
  const fetchRes = UrlFetchApp.fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { muteHttpExceptions: true }
  )
  Logger.log('Gemini API status: ' + fetchRes.getResponseCode())

  // 授權 DriveApp
  const folder = getOrCreateFolder()
  Logger.log('Drive folder: ' + folder.getName())

  // 授權 PropertiesService
  Logger.log('API Key exists: ' + !!apiKey)

  Logger.log('All permissions granted!')
}
