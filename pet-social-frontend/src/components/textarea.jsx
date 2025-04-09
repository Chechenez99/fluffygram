// src/components/Textarea.jsx
const Textarea = ({ className, rows = 4, cols = 50, ...props }) => {
  return (
    <textarea
      rows={rows}
      cols={cols}
      className={`bg-white text-[#4b3f4e] p-3 rounded-2xl border border-[#baa6ba] resize-none focus:outline-none focus:ring-2 focus:ring-[#b46db6] ${className}`}
      {...props}
    />
  );
};

export default Textarea;
