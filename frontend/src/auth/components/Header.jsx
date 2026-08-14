import Logo from "@/components/Logo";
import Nav from "./Nav";
const Header = ({ transparent = false, className = "" }) => {
  return (
    <div
      className={`header w-full h-16 flex items-center px-2 justify-between ${
        transparent ? "bg-transparent" : "shadow-md bg-linear-to-r"
      } ${className}`}
    >
      <Logo />
      <Nav />
    </div>
  );
};

export default Header;
