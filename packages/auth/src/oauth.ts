import type { OAuthProviderConfig } from './types'

interface OAuthUrls {
  [provider: string]: {
    authorize: string
    token: string
    userInfo: string
  }
}

const providerUrls: OAuthUrls = {
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    userInfo: 'https://api.github.com/user',
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
}

export function oauthRedirectUrl(provider: string, config: OAuthProviderConfig): string {
  const urls = providerUrls[provider]
  if (!urls)
    throw new Error(`Unsupported OAuth provider: ${provider}`)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri ?? '',
    scope: (config.scopes ?? []).join(' '),
    response_type: 'code',
  })

  return `${urls.authorize}?${params.toString()}`
}

export async function handleOAuthCallback(
  provider: string,
  code: string,
  config: OAuthProviderConfig,
): Promise<{ accessToken: string, user: Record<string, unknown> }> {
  const urls = providerUrls[provider]
  if (!urls)
    throw new Error(`Unsupported OAuth provider: ${provider}`)

  const tokenResponse = await fetch(urls.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri ?? '',
    }),
  })

  const tokenData = await tokenResponse.json() as { access_token: string }
  const accessToken = tokenData.access_token

  const userResponse = await fetch(urls.userInfo, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const user = await userResponse.json() as Record<string, unknown>

  return { accessToken, user }
}
