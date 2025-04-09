const Input = ({ className, ...props }) => {
  return (
    <input
      className={`border border-[#d8b4e2] p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c084cf] focus:border-[#a157a7] w-full ${className}`}
      {...props}
    />
  );
};

export default Input;
