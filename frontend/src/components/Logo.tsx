import { useNavigate } from "react-router-dom";
import logo from "../assets/logo_1.png";

const Logo = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/home");
  };
  return (
    <img src={logo} alt="logo" className="size-20" onClick={handleClick} />
  );
};

export default Logo;
