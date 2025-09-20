import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchPatients, type Patient } from "../../api/entities/Patient";
import { useAuth } from "../../contexts/AuthContext";
import "./PatientSearchAutocomplete.css";

export interface PatientSearchAutocompleteProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  onAddNewPatient: (searchQuery?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const PatientSearchAutocomplete: React.FC<PatientSearchAutocompleteProps> = ({
  selectedPatient,
  onPatientSelect,
  onAddNewPatient,
  disabled = false,
  placeholder = "Buscar paciente...",
}) => {
  const { organizationId } = useAuth(); // Use organizationId directly from context
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        setShowDropdown(false);
        setIsLoading(false);
        return;
      }

      // Validate organization_id
      if (!organizationId) {
        console.error("No organization_id available for patient search");
        setError("Error: No se pudo obtener la información de la organización");
        setIsLoading(false);
        return;
      }

      // Cancel any previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this search
      abortControllerRef.current = new AbortController();
      const currentController = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      try {
        // Starting patient search
        const patients = await searchPatients(searchQuery, organizationId);

        // Check if this search was aborted
        if (currentController.signal.aborted) {
          // Patient search aborted
          return;
        }

        // Patient search completed
        setResults(patients);
        setShowDropdown(true);
        setFocusedIndex(-1);
      } catch (err) {
        // Don't update state if the request was aborted
        if (currentController.signal.aborted) {
          // Patient search aborted (in catch)
          return;
          return;
        }

        console.error("❌ Patient search error:", err);
        setError("Error searching patients. Please try again.");
        setResults([]);
        setShowDropdown(true); // Still show dropdown to display error
      } finally {
        // Only update loading state if not aborted
        if (!currentController.signal.aborted) {
          // Patient search finished
          setIsLoading(false);
        }
      }
    },
    [organizationId]
  );

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300);
  };

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    setQuery(patient.name);
    setShowDropdown(false);
    setFocusedIndex(-1);
    onPatientSelect(patient);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setQuery("");
    setShowDropdown(false);
    setFocusedIndex(-1);
    onPatientSelect(null);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const totalItems =
      results.length + (results.length === 0 && query.length >= 2 ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          if (focusedIndex < results.length) {
            handlePatientSelect(results[focusedIndex]);
          } else {
            // "Add New Patient" option selected
            onAddNewPatient(query);
            setShowDropdown(false);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowDropdown(true);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout and abort requests on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Safety mechanism: Reset loading state if it's been loading for too long
  useEffect(() => {
    let safetyTimer: NodeJS.Timeout;

    if (isLoading) {
      // Setting safety timer for patient search loading state
      safetyTimer = setTimeout(() => {
        console.warn("⚠️ Patient search loading timeout - forcing reset");
        setIsLoading(false);
        setError("Search timeout. Please try again.");
      }, 10000); // 10 second timeout
    }

    return () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
      }
    };
  }, [isLoading]);

  // Highlight search term in text
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="search-highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Initialize query when selectedPatient changes
  useEffect(() => {
    // Cancel any pending searches first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (selectedPatient) {
      setQuery(selectedPatient.name);
      // Clear all search-related state when a patient is selected
      setIsLoading(false);
      setShowDropdown(false);
      setResults([]);
      setError(null);
      setFocusedIndex(-1);
    } else {
      setQuery("");
      // Clear loading state when selection is cleared
      setIsLoading(false);
      setShowDropdown(false);
      setResults([]);
      setError(null);
      setFocusedIndex(-1);
    }
  }, [selectedPatient]);

  return (
    <div className="patient-search-container">
      <div className="patient-search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="patient-search-input"
          autoComplete="off"
        />

        {selectedPatient && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="patient-search-clear"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}

        {isLoading && (
          <div className="patient-search-loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className="patient-search-dropdown">
          {error && <div className="patient-search-error">{error}</div>}

          {!error && results.length > 0 && (
            <div className="patient-search-results">
              {results.map((patient, index) => (
                <div
                  key={patient.id}
                  className={`patient-search-result ${
                    focusedIndex === index ? "focused" : ""
                  }`}
                  onClick={() => handlePatientSelect(patient)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="patient-name">
                    {highlightMatch(patient.name, query)}
                  </div>
                  {patient.phone && (
                    <div className="patient-phone">{patient.phone}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!error &&
            results.length === 0 &&
            query.length >= 2 &&
            !isLoading && (
              <div className="patient-search-no-results">
                <div className="no-results-message">
                  No se encontraron pacientes
                </div>
                <button
                  type="button"
                  className={`add-new-patient-btn ${
                    focusedIndex === 0 ? "focused" : ""
                  }`}
                  onClick={() => {
                    onAddNewPatient(query);
                    setShowDropdown(false);
                  }}
                  onMouseEnter={() => setFocusedIndex(0)}
                >
                  + Agregar Nuevo Paciente
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PatientSearchAutocomplete;
