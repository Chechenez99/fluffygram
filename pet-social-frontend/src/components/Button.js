// src/components/Button.js
const Button = ({ className, children, type = "button", ...props }) => {
  return (
    <button
      type={type} 
      className={`bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
