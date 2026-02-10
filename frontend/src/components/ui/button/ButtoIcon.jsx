const ButtonIcon = ({
    startIcon,
    endIcon,
    onClick,
    className = "",
    disabled = false
  }) => {
    // Clases para los botones solo con íconos
    const buttonClasses = `w-10 h-10 rounded-full bg-transparent text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition ${className}`;
  
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 ${buttonClasses} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        {startIcon && <span className="flex items-center">{startIcon}</span>}
        {endIcon && <span className="flex items-center">{endIcon}</span>}
      </button>
    );
  };
  
  export default ButtonIcon;
  