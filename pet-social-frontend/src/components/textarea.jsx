// src/components/Textarea.jsx
const Textarea = ({ className, rows = 4, cols = 50, ...props }) => {
  return (
    <textarea
      rows={rows}
      cols={cols}
      className={`bg-green-100 text-green-700 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-300 ${className}`}
      {...props}
    />
  );
};

export default Textarea;
