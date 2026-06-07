from email.message import EmailMessage
from html import escape
from pathlib import Path
import smtplib
from ...core.config import settings

LOGO_CID = "mamamia-favicon"


def is_email_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def get_email_logo_path() -> Path:
    return Path(__file__).resolve().parents[4] / "frontend" / "public" / "favicon.png"


def get_reset_password_template_path() -> Path:
    return Path(__file__).resolve().parents[2] / "templates" / "reset_password_email.html"


def build_password_reset_email(name: str, reset_url: str) -> str:
    safe_name = escape(name.strip() or "cocinero")
    safe_url = escape(reset_url, quote=True)
    template = get_reset_password_template_path().read_text(encoding="utf-8")
    return template.format(name=safe_name, reset_url=safe_url, logo_cid=LOGO_CID)


def attach_inline_logo(message: EmailMessage) -> None:
    logo_path = get_email_logo_path()
    if not logo_path.exists():
        return

    html_part = message.get_payload()[-1]
    html_part.add_related(
        logo_path.read_bytes(),
        maintype="image",
        subtype="png",
        cid=f"<{LOGO_CID}>",
        filename="mamamia-favicon.png",
        disposition="inline",
    )
    logo_part = html_part.get_payload()[-1]
    logo_part["X-Attachment-Id"] = LOGO_CID


def send_password_reset_email(to_email: str, name: str, reset_url: str) -> None:
    if not is_email_configured():
        raise RuntimeError("SMTP no esta configurado")

    sender = settings.smtp_from_email
    sender_name = settings.smtp_from_name
    message = EmailMessage()
    message["Subject"] = "Restablece tu contrasena de MamaMia"
    message["From"] = f"{sender_name} <{sender}>"
    message["To"] = to_email
    message.set_content(
        f"Hola {name}, recibimos una solicitud para restablecer tu contrasena de MamaMia.\n\n"
        "Usa el boton principal para crear una nueva contrasena.\n\n"
        "Si no pediste este cambio, ignora este correo."
    )
    message.add_alternative(build_password_reset_email(name, reset_url), subtype="html")
    attach_inline_logo(message)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        raise RuntimeError("Gmail rechazo las credenciales.") from exc
    except smtplib.SMTPException as exc:
        raise RuntimeError(f"Error SMTP al enviar el correo: {exc}") from exc
