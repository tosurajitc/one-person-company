import httpx
from typing import Dict, Any, Optional
from urllib.parse import urlencode
import json
from app.core.config import settings
from app.models.user import OAuthProvider

class OAuthClient:
    """HTTP client for OAuth provider interactions"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def exchange_code_for_token(
        self, 
        provider: str, 
        code: str, 
        client_id: str, 
        client_secret: str, 
        redirect_uri: str
    ) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token"""
        
        token_urls = {
            "google": "https://oauth2.googleapis.com/token",
            "facebook": "https://graph.facebook.com/v18.0/oauth/access_token",
            "github": "https://github.com/login/oauth/access_token",
            "linkedin": "https://www.linkedin.com/oauth/v2/accessToken"
        }
        
        if provider not in token_urls:
            return None
        
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        headers = {"Accept": "application/json"}
        
        try:
            response = await self.client.post(
                token_urls[provider],
                data=token_data,
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception:
            return None
    
    async def get_user_info(
        self, 
        provider: str, 
        access_token: str
    ) -> Optional[Dict[str, Any]]:
        """Get user information from OAuth provider"""
        
        user_info_urls = {
            "google": "https://www.googleapis.com/oauth2/v2/userinfo",
            "facebook": "https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture",
            "github": "https://api.github.com/user",
            "linkedin": "https://api.linkedin.com/v2/userinfo"
        }
        
        if provider not in user_info_urls:
            return None
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = await self.client.get(
                user_info_urls[provider],
                headers=headers
            )
            
            if response.status_code == 200:
                user_data = response.json()
                
                # GitHub users with private emails won't have email on /user
                if provider == "github" and not user_data.get("email"):
                    email_data = await self._get_github_email(access_token)
                    if email_data:
                        user_data["email"] = email_data
                
                return self._normalize_user_data(provider, user_data)
            return None
        except Exception:
            return None
    
    async def _get_linkedin_email(self, access_token: str) -> Optional[str]:
        """Get email from LinkedIn (separate API call)"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = await self.client.get(
                "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                elements = data.get("elements", [])
                if elements:
                    return elements[0].get("handle~", {}).get("emailAddress")
            return None
        except Exception:
            return None
    
    async def _get_github_email(self, access_token: str) -> Optional[str]:
        """Get primary verified email from GitHub (separate API call for private-email users)"""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }
        try:
            response = await self.client.get(
                "https://api.github.com/user/emails",
                headers=headers
            )
            if response.status_code == 200:
                emails = response.json()
                # Prefer primary+verified, fall back to any verified, then any
                primary = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
                if primary:
                    return primary
                verified = next((e["email"] for e in emails if e.get("verified")), None)
                if verified:
                    return verified
                if emails:
                    return emails[0].get("email")
            return None
        except Exception:
            return None

    def _normalize_user_data(self, provider: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize user data from different providers to common format"""
        
        if provider == "google":
            return {
                "id": raw_data.get("id"),
                "email": raw_data.get("email"),
                "name": raw_data.get("name"),
                "first_name": raw_data.get("given_name"),
                "last_name": raw_data.get("family_name"),
                "avatar_url": raw_data.get("picture"),
                "verified_email": raw_data.get("verified_email", True)
            }
        
        elif provider == "facebook":
            return {
                "id": str(raw_data.get("id")),
                "email": raw_data.get("email"),
                "name": raw_data.get("name"),
                "first_name": raw_data.get("first_name", ""),
                "last_name": raw_data.get("last_name", ""),
                "avatar_url": raw_data.get("picture", {}).get("data", {}).get("url"),
                "verified_email": True  # Facebook only returns verified emails
            }
        
        elif provider == "github":
            return {
                "id": str(raw_data.get("id")),
                "email": raw_data.get("email"),
                "name": raw_data.get("name") or raw_data.get("login"),
                "first_name": raw_data.get("name", "").split(" ")[0] if raw_data.get("name") else raw_data.get("login"),
                "last_name": " ".join(raw_data.get("name", "").split(" ")[1:]) if raw_data.get("name") and " " in raw_data.get("name") else "",
                "avatar_url": raw_data.get("avatar_url"),
                "verified_email": True  # GitHub OAuth provides verified emails
            }
        
        elif provider == "linkedin":
            # OpenID Connect /v2/userinfo returns: sub, email, name, given_name, family_name, picture
            return {
                "id": raw_data.get("sub"),
                "email": raw_data.get("email"),
                "name": raw_data.get("name"),
                "first_name": raw_data.get("given_name", ""),
                "last_name": raw_data.get("family_name", ""),
                "avatar_url": raw_data.get("picture"),
                "verified_email": raw_data.get("email_verified", True)
            }
        
        return {}
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

class OAuthConfig:
    """OAuth configuration manager"""
    
    @staticmethod
    def get_client_credentials(provider: str) -> tuple[Optional[str], Optional[str]]:
        """Get OAuth client credentials for provider"""
        
        credentials_map = {
            "google": (
                getattr(settings, 'GOOGLE_CLIENT_ID', None),
                getattr(settings, 'GOOGLE_CLIENT_SECRET', None)
            ),
            "facebook": (
                getattr(settings, 'FACEBOOK_CLIENT_ID', None),
                getattr(settings, 'FACEBOOK_CLIENT_SECRET', None)
            ),
            "github": (
                getattr(settings, 'GITHUB_CLIENT_ID', None),
                getattr(settings, 'GITHUB_CLIENT_SECRET', None)
            ),
            "linkedin": (
                getattr(settings, 'LINKEDIN_CLIENT_ID', None),
                getattr(settings, 'LINKEDIN_CLIENT_SECRET', None)
            )
        }
        
        return credentials_map.get(provider, (None, None))
    
    @staticmethod
    def is_provider_configured(provider: str) -> bool:
        """Check if OAuth provider is properly configured"""
        client_id, client_secret = OAuthConfig.get_client_credentials(provider)
        return bool(client_id and client_secret)
    
    @staticmethod
    def get_configured_providers() -> list[str]:
        """Get list of configured OAuth providers"""
        providers = []
        for provider in ["google", "facebook", "github", "linkedin"]:
            if OAuthConfig.is_provider_configured(provider):
                providers.append(provider)
        return providers

# Global OAuth client instance
oauth_client = OAuthClient()