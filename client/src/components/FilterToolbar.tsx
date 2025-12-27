import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterToolbarProps {
    showFilters: boolean;
    onToggleFilters: () => void;
    onClearFilters: () => void;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
    showFilters,
    onToggleFilters,
    onClearFilters
}) => {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onToggleFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors"
            >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}
            </button>
            <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors"
            >
                <X className="w-4 h-4" />
                Limpar Filtros
            </button>
        </div>
    );
};

export default FilterToolbar;
