import logo from "../../assets/brand/logo_MamaMia.png";

export default function BrandLogo({ className = "brand-logo", alt = "MamaMia" }) {
  return <img className={className} src={logo} alt={alt} />;
}
