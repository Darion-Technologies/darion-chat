import { Readable } from 'stream'

export interface GoogleDriveUploadResult {
  success: boolean
  fileId?: string
  webViewLink?: string
  webContentLink?: string
  error?: string
}

/**
 * Gets an authenticated Google Drive client using either:
 * 1. Service Account (GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_JSON)
 * 2. OAuth2 Refresh Token (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)
 */
async function getGoogleDriveClient() {
  let googleapis: any
  try {
    // Dynamic import to avoid build errors if googleapis is not present
    // @ts-ignore
    googleapis = await import('googleapis')
  } catch {
    return null
  }

  const { google } = googleapis
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  // Option 3: OAuth2 Refresh Token (Prioritized)
  if (clientId && clientSecret && refreshToken) {
    const auth = new google.auth.OAuth2(clientId, clientSecret)
    auth.setCredentials({ refresh_token: refreshToken })
    return google.drive({ version: 'v3', auth })
  }

  // Option 1: Full Service Account JSON string
  if (serviceAccountJson) {
    try {
      const credentials = JSON.parse(serviceAccountJson)
      const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      })
      return google.drive({ version: 'v3', auth })
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e)
    }
  }

  // Option 2: Individual Service Account Email + Private Key
  if (clientEmail && rawPrivateKey) {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n')
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    })
    return google.drive({ version: 'v3', auth })
  }

  return null
}

/**
 * Uploads a WebM meeting recording buffer directly to Google Drive.
 */
export async function uploadRecordingToGoogleDrive({
  buffer,
  fileName,
  mimeType = 'video/webm',
}: {
  buffer: Buffer
  fileName: string
  mimeType?: string
}): Promise<GoogleDriveUploadResult> {
  try {
    const drive = await getGoogleDriveClient()
    if (!drive) {
      return {
        success: false,
        error: 'Google Drive credentials not configured.',
      }
    }

    const folderId = process.env.GOOGLE_DRIVE_RECORDINGS_FOLDER_ID

    const bufferStream = new Readable()
    bufferStream.push(buffer)
    bufferStream.push(null)

    const requestBody: any = {
      name: fileName,
      mimeType,
      description: 'Darion Meet recording uploaded automatically.',
    }

    if (folderId) {
      requestBody.parents = [folderId]
    }

    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType,
        body: bufferStream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    })

    const file = response.data

    return {
      success: true,
      fileId: file.id || undefined,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
    }
  } catch (err: any) {
    console.error('Google Drive Upload Failed:', err)
    return {
      success: false,
      error: err.message || 'Unknown error uploading to Google Drive',
    }
  }
}

export const uploadBufferToGoogleDrive = uploadRecordingToGoogleDrive
