import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface PlanningFilters {
  selectedPompier: string;
  selectedSlot: number;
  currentMonth: number;
  currentYear: number;
  viewMode: 'disponibilites' | 'planning';
}

interface PlanningContextType {
  filters: PlanningFilters;
  setFilters: (filters: Partial<PlanningFilters>) => void;
  clearFilters: () => void;
}

const defaultFilters: PlanningFilters = {
  selectedPompier: '',
  selectedSlot: 0,
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  viewMode: 'disponibilites'
};

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const PlanningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<PlanningFilters>(defaultFilters);

  const setFilters = (newFilters: Partial<PlanningFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFiltersState(defaultFilters);
  };

  return (
    <PlanningContext.Provider value={{ filters, setFilters, clearFilters }}>
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanningContext = () => {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error('usePlanningContext must be used within a PlanningProvider');
  }
  return context;
};
