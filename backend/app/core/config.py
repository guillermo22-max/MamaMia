from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "MamaMia API"
    database_url: str = "sqlite:///./mamamia.db"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    trusted_hosts: str = "localhost,127.0.0.1,testserver"
    openai_api_key: str | None = None
    openai_recipe_model: str = "gpt-4o-mini"
    openai_image_model: str = "gpt-image-1-mini"
    frontend_url: str = "http://localhost:5173"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str = "MamaMia"
    smtp_use_tls: bool = True
    password_reset_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def list_from_csv(self, value: str) -> list[str]:
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return self.list_from_csv(self.cors_origins)

    @property
    def trusted_host_list(self) -> list[str]:
        return self.list_from_csv(self.trusted_hosts)

settings = Settings()
