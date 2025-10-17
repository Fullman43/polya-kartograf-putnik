import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAddressSuggestions, AddressSuggestion } from "@/hooks/useAddressSuggestions";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Введите адрес...",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(value);

  // Debounce the query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const { data, isLoading } = useAddressSuggestions(debouncedQuery, open);
  const suggestions = data?.suggestions || [];

  const handleSelect = useCallback((suggestion: AddressSuggestion) => {
    onChange(suggestion.fullAddress, suggestion);
    setOpen(false);
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setOpen(newValue.length >= 3);
  };

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn("pl-10 pr-10", className)}
            onFocus={() => value.length >= 3 && setOpen(true)}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{suggestion.fullAddress}</div>
                {(suggestion.city || suggestion.street) && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[suggestion.city, suggestion.street, suggestion.house]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};