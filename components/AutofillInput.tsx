'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye } from 'lucide-react';

interface AutofillSuggestion {
  value: string;
  relatedData?: Record<string, string | undefined>;
  usageCount?: number;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRelatedDataSelect?: (data: Record<string, string | undefined>) => void;
  onHoverPreview?: (data: Record<string, string | undefined> | null) => void;
  userId: string;
  fieldName: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function AutofillInput({
  label,
  value,
  onChange,
  onRelatedDataSelect,
  onHoverPreview,
  userId,
  fieldName,
  required = false,
  placeholder,
  disabled = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<AutofillSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/autofill?userId=${userId}&fieldName=${fieldName}&query=${encodeURIComponent(query)}`
      );
      const result = await response.json();

      if (result.success) {
        setSuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error('Autofill error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, fieldName]);

  useEffect(() => {
    if (showSuggestions) {
      fetchSuggestions(value);
    }
  }, [showSuggestions, value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHoveredIndex(null);
        if (onHoverPreview) onHoverPreview(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onHoverPreview]);

        const handleSelect = (suggestion: AutofillSuggestion) => {
    // Clear any hover preview state first
    setHoveredIndex(null);
    if (onHoverPreview) onHoverPreview(null);
    
    // Close dropdown
    setShowSuggestions(false);
    
    // Fill the current field value
    onChange(suggestion.value);
    
    // Then fill related data if available
    if (suggestion.relatedData && onRelatedDataSelect) {
      setTimeout(() => {
        onRelatedDataSelect(suggestion.relatedData!);
      }, 150);
    }
  };




  const handleHover = (index: number, suggestion: AutofillSuggestion) => {
    setHoveredIndex(index);
    
    // Send preview data on hover
    if (onHoverPreview && suggestion.relatedData) {
      onHoverPreview(suggestion.relatedData);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    
    // Clear preview when mouse leaves
    if (onHoverPreview) {
      onHoverPreview(null);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        required={required}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          onMouseLeave={handleMouseLeave}
          className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading suggestions...
            </div>
          )}
          {!loading && suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => handleHover(index, suggestion)}
              className={`w-full px-4 py-3 text-left transition-all text-sm border-b border-gray-100 last:border-b-0 flex justify-between items-center ${
                hoveredIndex === index 
                  ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <span className="text-gray-900 font-medium">{suggestion.value}</span>
                {hoveredIndex === index && suggestion.relatedData && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Preview mode - Click to fill permanently
                  </p>
                )}
              </div>
              {suggestion.usageCount && suggestion.usageCount > 1 && (
                <span className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded">
                  Used {suggestion.usageCount}x
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
