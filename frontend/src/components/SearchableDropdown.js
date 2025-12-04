import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import './SearchableDropdown.css';

const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Type or select...',
  allowCustom = true,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter options based on input with smart matching
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredOptions(options);
    } else {
      const searchTerm = inputValue.toLowerCase().trim();
      const filtered = options.filter(option => {
        const optionText = typeof option === 'string' ? option : option.label || option.value || '';
        const optionLower = optionText.toLowerCase();
        
        // Exact match (highest priority)
        if (optionLower === searchTerm) return true;
        
        // Starts with search term
        if (optionLower.startsWith(searchTerm)) return true;
        
        // Contains search term
        if (optionLower.includes(searchTerm)) return true;
        
        // Smart abbreviation matching (e.g., "CS" matches "Computer Science")
        // Check if search term matches first letters of words
        const words = optionLower.split(/\s+/);
        const firstLetters = words.map(w => w[0]).join('');
        if (firstLetters.startsWith(searchTerm) || firstLetters.includes(searchTerm)) return true;
        
        // Check if search term matches first few characters of each word
        const wordStarts = words.map(w => w.substring(0, Math.min(searchTerm.length, w.length))).join('');
        if (wordStarts.includes(searchTerm)) return true;
        
        return false;
      });
      
      // Sort results: exact matches first, then starts with, then contains
      filtered.sort((a, b) => {
        const aText = typeof a === 'string' ? a : a.label || a.value || '';
        const bText = typeof b === 'string' ? b : b.label || b.value || '';
        const aLower = aText.toLowerCase();
        const bLower = bText.toLowerCase();
        
        // Exact match
        if (aLower === searchTerm && bLower !== searchTerm) return -1;
        if (bLower === searchTerm && aLower !== searchTerm) return 1;
        
        // Starts with
        if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
        if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;
        
        return 0;
      });
      
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [inputValue, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustom && inputValue.trim()) {
          handleCustomValue(inputValue.trim());
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, inputValue, allowCustom]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    
    // If allowCustom, update parent immediately for real-time typing
    if (allowCustom) {
      onChange(newValue);
    }
  };

  const handleSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : (option.value || option.label || '');
    setInputValue(selectedValue);
    onChange(selectedValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCustomValue = (customValue) => {
    setInputValue(customValue);
    onChange(customValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const getDisplayValue = (option) => {
    if (typeof option === 'string') return option;
    return option.label || option.value || '';
  };

  return (
    <div 
      ref={containerRef} 
      className={`searchable-dropdown ${className} ${disabled ? 'disabled' : ''}`}
    >
      <div 
        className="searchable-dropdown-input-wrapper"
        onClick={!disabled ? handleFocus : undefined}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="searchable-dropdown-input"
          autoComplete="off"
        />
        <div className="searchable-dropdown-actions">
          {inputValue && !disabled && (
            <button
              type="button"
              className="searchable-dropdown-clear"
              onClick={handleClear}
              tabIndex={-1}
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            className={`searchable-dropdown-arrow ${isOpen ? 'open' : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            tabIndex={-1}
            disabled={disabled}
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div ref={dropdownRef} className="searchable-dropdown-menu">
          {filteredOptions.length > 0 ? (
            <ul className="searchable-dropdown-list">
              {filteredOptions.map((option, index) => {
                const displayValue = getDisplayValue(option);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <li
                    key={index}
                    className={`searchable-dropdown-item ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {displayValue}
                  </li>
                );
              })}
            </ul>
          ) : allowCustom && inputValue.trim() ? (
            <div className="searchable-dropdown-list">
              <div
                className="searchable-dropdown-item searchable-dropdown-custom"
                onClick={() => handleCustomValue(inputValue.trim())}
              >
                Use "{inputValue.trim()}"
              </div>
            </div>
          ) : (
            <div className="searchable-dropdown-empty">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;

