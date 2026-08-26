// File Path: /src/components/customSelectStyles.ts
import { type StylesConfig } from "react-select";

// Custom styles for react-select matching tailwind theme
export const customSelectStyles: StylesConfig<any, false> = {
  control: (provided, state) => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      ...provided,
      backgroundColor: isDark ? "#292524" : "#ffffff", // zinc-800/white
      borderColor: state.isFocused 
        ? "#b45309" 
        : isDark ? "#44403c" : "#cbd5e1", // zinc-700/zinc-300
      borderRadius: "0.75rem", // rounded-xl
      minHeight: "42px",
      fontSize: "13px",
      fontFamily: "var(--font-sans)",
      boxShadow: state.isFocused ? "0 0 0 2.5px rgba(180, 83, 9, 0.2)" : "none",
      color: isDark ? "#f5f5f4" : "#1c1917",
      "&:hover": {
        borderColor: state.isFocused ? "#b45309" : (isDark ? "#57534e" : "#a8a29e")
      }
    };
  },
  menu: (provided) => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      ...provided,
      backgroundColor: isDark ? "#292524" : "#ffffff",
      borderRadius: "0.75rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: isDark ? "1px solid #44403c" : "1px solid #e7e5e4",
      zIndex: 50
    };
  },
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
  option: (provided, state) => {
    const isDark = document.documentElement.classList.contains("dark");
    let bg = "transparent";
    if (state.isSelected) bg = "#b45309";
    else if (state.isFocused) bg = isDark ? "#44403c" : "#f5f5f4";
    
    return {
      ...provided,
      backgroundColor: bg,
      color: state.isSelected 
        ? "#ffffff" 
        : isDark ? "#fef3c7" : "#1c1917",
      cursor: "pointer",
      fontSize: "13px",
      fontFamily: "var(--font-sans)",
      padding: "0.5rem 0.75rem",
      "&:active": {
        backgroundColor: "#b45309"
      }
    };
  },
  singleValue: (provided) => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      ...provided,
      color: isDark ? "#f1f5f9" : "#0f172a"
    };
  },
  placeholder: (provided) => ({
    ...provided,
    color: "#94a3b8"
  }),
  input: (provided) => ({
    ...provided,
    color: document.documentElement.classList.contains("dark") ? "#f1f5f9" : "#0f172a"
  })
};

export const tableSelectStyles: StylesConfig<any, false> = {
  control: (provided, state) => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      ...provided,
      backgroundColor: "transparent",
      borderColor: "transparent",
      minHeight: "28px",
      height: "28px",
      boxShadow: "none",
      "&:hover": {
        borderColor: "transparent"
      }
    };
  },
  valueContainer: (provided) => ({
    ...provided,
    padding: "0",
    fontSize: "12px",
    fontWeight: "700"
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "28px"
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: "2px",
    color: document.documentElement.classList.contains("dark") ? "#71717a" : "#a1a1aa",
    "&:hover": {
      color: document.documentElement.classList.contains("dark") ? "#a1a1aa" : "#71717a"
    }
  }),
  indicatorSeparator: () => ({
    display: "none"
  }),
  menu: (provided) => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      ...provided,
      backgroundColor: isDark ? "#292524" : "#ffffff",
      borderRadius: "0.75rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      border: isDark ? "1px solid #44403c" : "1px solid #e7e5e4",
      zIndex: 50,
      width: "max-content",
      minWidth: "220px"
    };
  },
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
  option: (provided, state) => {
    const isDark = document.documentElement.classList.contains("dark");
    let bg = "transparent";
    if (state.isSelected) bg = "#b45309";
    else if (state.isFocused) bg = isDark ? "#44403c" : "#f5f5f4";
    
    return {
      ...provided,
      backgroundColor: bg,
      color: state.isSelected 
        ? "#ffffff" 
        : isDark ? "#fef3c7" : "#1c1917",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      padding: "0.375rem 0.75rem",
      "&:active": {
        backgroundColor: "#b45309"
      }
    };
  },
  singleValue: (provided) => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      ...provided,
      color: isDark ? "#f1f5f9" : "#0f172a",
      fontWeight: "700"
    };
  },
  placeholder: (provided) => ({
    ...provided,
    color: "#a1a1aa",
    fontWeight: "700"
  }),
  input: (provided) => ({
    ...provided,
    margin: "0",
    padding: "0",
    color: document.documentElement.classList.contains("dark") ? "#f1f5f9" : "#0f172a"
  })
};
