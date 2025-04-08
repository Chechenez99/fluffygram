const Input = ({ className, ...props }) => {
  return (
    <input
      className={`border border-green-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full ${className}`}
      {...props}
    />
  )
}

export default Input
