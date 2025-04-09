const variants = {
  primary: 'bg-[#b46db6] text-white hover:bg-[#a157a7] active:bg-[#8e4694]',
  secondary: 'bg-[#f3e6f5] text-[#4b3f4e] border border-[#baa6ba] hover:bg-[#e8d4eb] active:bg-[#ddc2e1]',
  danger: 'bg-[#f76b6b] text-white hover:bg-[#f15b5b] active:bg-[#e05050]',
  disabled: 'bg-[#e2e2e2] text-[#303030] cursor-not-allowed',
  lightGreen: 'bg-[#c4e1c1] text-[#2f4f28] hover:bg-[#a4d0a0] active:bg-[#8bba87]',
  purple: 'bg-[#b46db6] text-white hover:bg-[#a157a7] active:bg-[#8e4694]',
   // светло-зеленая кнопка
};

const Button = ({
  className = '',
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  ...props
}) => {
  const baseStyle = 'px-4 py-2 rounded-2xl shadow-md font-semibold transition-all focus:outline-none';
  const variantStyle = disabled ? variants.disabled : variants[variant] || variants.primary;

  return (
    <button
      type={type}
      className={`${baseStyle} ${variantStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
