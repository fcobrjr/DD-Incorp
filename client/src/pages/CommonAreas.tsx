import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import { EditIcon, TrashIcon, SparklesIcon, EyeIcon, DownloadIcon, UploadIcon, PlusIcon, FilterIcon } from '../components/icons';
import { suggestActivitiesForEnvironment } from '../services/geminiService';
import { apiRequest } from '../lib/queryClient';

declare var XLSX: any;

interface CommonArea {
  id: number;
  client: string;
  location: string;
  subLocation: string;
  environment: string;
  area: number;
}

const CommonAreas: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data: commonAreas = [], isLoading } = useQuery<CommonArea[]>({
    queryKey: ['/api/common-areas'],
  });

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ['/api/activities'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<CommonArea, 'id'>) => {
      const res = await apiRequest('POST', '/api/common-areas', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/common-areas'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CommonArea> }) => {
      const res = await apiRequest('PUT', `/api/common-areas/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/common-areas'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/common-areas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/common-areas'] });
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<CommonArea | null>(null);
  const [formState, setFormState] = useState<Omit<CommonArea, 'id'>>({ client: '', location: '', subLocation: '', environment: '', area: 0 });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    client: '',
    location: '',
    subLocation: '',
    environment: '',
  });

  const openModal = (item: CommonArea | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { client: item.client, location: item.location, subLocation: item.subLocation || '', environment: item.environment || '', area: item.area || 0 } : { client: '', location: '', subLocation: '', environment: '', area: 0 });
    setSuggestions([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const openPreview = (item: CommonArea) => {
    setCurrentItem(item);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setCurrentItem(null);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleGetSuggestions = async () => {
    if (!formState.environment) return;
    setIsLoadingSuggestions(true);
    const result = await suggestActivitiesForEnvironment(formState.environment);
    setSuggestions(result);
    setIsLoadingSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      await updateMutation.mutateAsync({ id: currentItem.id, data: formState });
    } else {
      await createMutation.mutateAsync(formState);
    }
    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta área comum?")) {
      await deleteMutation.mutateAsync(id);
    }
  };
  
  const handleExport = () => {
    const headers = [["client", "location", "subLocation", "environment", "area"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Areas Comuns");
    XLSX.writeFile(wb, "template_areas_comuns.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        for (const row of json as any[]) {
          if (row.client && row.location) {
            await createMutation.mutateAsync({
              client: row.client || '',
              location: row.location || '',
              subLocation: row.subLocation || '',
              environment: row.environment || '',
              area: Number(row.area) || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert("Ocorreu um erro ao processar o arquivo.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'client') {
        newFilters.location = '';
        newFilters.subLocation = '';
        newFilters.environment = '';
      }
      if (name === 'location') {
        newFilters.subLocation = '';
        newFilters.environment = '';
      }
      if (name === 'subLocation') {
        newFilters.environment = '';
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({ search: '', client: '', location: '', subLocation: '', environment: '' });
  };

  const uniqueClients = useMemo(() => Array.from(new Set(commonAreas.map(a => a.client).filter(Boolean))).sort(), [commonAreas]);
  const uniqueLocations = useMemo(() => {
    if (!filters.client) return [];
    return Array.from(new Set(commonAreas.filter(a => a.client === filters.client).map(a => a.location).filter(Boolean))).sort();
  }, [commonAreas, filters.client]);
  const uniqueSubLocations = useMemo(() => {
    if (!filters.client || !filters.location) return [];
    return Array.from(new Set(commonAreas.filter(a => a.client === filters.client && a.location === filters.location).map(a => a.subLocation).filter(Boolean))).sort();
  }, [commonAreas, filters.client, filters.location]);
  const uniqueEnvironments = useMemo(() => {
    if (!filters.client || !filters.location || !filters.subLocation) return [];
    return Array.from(new Set(commonAreas.filter(a => a.client === filters.client && a.location === filters.location && a.subLocation === filters.subLocation).map(a => a.environment).filter(Boolean))).sort();
  }, [commonAreas, filters.client, filters.location, filters.subLocation]);

  const filteredCommonAreas = useMemo(() => {
    return commonAreas.filter(area => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          (area.client || '').toLowerCase().includes(searchTerm) ||
          (area.location || '').toLowerCase().includes(searchTerm) ||
          (area.subLocation || '').toLowerCase().includes(searchTerm) ||
          (area.environment || '').toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      if (filters.client && area.client !== filters.client) return false;
      if (filters.location && area.location !== filters.location) return false;
      if (filters.subLocation && area.subLocation !== filters.subLocation) return false;
      if (filters.environment && area.environment !== filters.environment) return false;
      return true;
    });
  }, [commonAreas, filters]);

  if (isLoading) {
    return (
      <div className="p-8">
        <PageHeader title="Áreas Comuns" />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader title="Áreas Comuns">
        <button type="button" onClick={handleExport} className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 text-sm font-medium">
          <DownloadIcon className="w-5 h-5 mr-2" />
          Exportar Template
        </button>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          style={{ display: 'none' }}
          accept=".xlsx, .xls"
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 text-sm font-medium">
          <UploadIcon className="w-5 h-5 mr-2" />
          Importar em Massa
        </button>
        <button
          type="button"
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150 font-semibold shadow-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nova Área Comum
        </button>
      </PageHeader>
      
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm ${showFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-600 border-gray-200 hover:text-primary-600'}`}
        >
          <FilterIcon className="w-5 h-5 mr-2" />
          {showFilters ? 'Ocultar Filtros' : 'Filtros e Pesquisa'}
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-1">Pesquisa Global</label>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Termo livre..."
                className="block w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="client" className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
              <select name="client" id="client" value={filters.client} onChange={handleFilterChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5">
                <option value="">Todos</option>
                {uniqueClients.map(cli => <option key={cli} value={cli}>{cli}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">Local</label>
              <select name="location" id="location" value={filters.location} onChange={handleFilterChange} disabled={!filters.client} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                <option value="">Todos</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subLocation" className="block text-sm font-semibold text-gray-700 mb-1">Sublocal</label>
              <select name="subLocation" id="subLocation" value={filters.subLocation} onChange={handleFilterChange} disabled={!filters.location} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                <option value="">Todos</option>
                {uniqueSubLocations.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="environment" className="block text-sm font-semibold text-gray-700 mb-1">Ambiente</label>
              <select name="environment" id="environment" value={filters.environment} onChange={handleFilterChange} disabled={!filters.subLocation} className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 disabled:bg-gray-50">
                <option value="">Todos</option>
                {uniqueEnvironments.map(env => <option key={env} value={env}>{env}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline px-4 py-2">Limpar todos os filtros</button>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sublocal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ambiente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área m²</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCommonAreas.length > 0 ? filteredCommonAreas.map(area => (
              <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.subLocation}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.environment}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.area}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-1">
                    <button type="button" onClick={() => openPreview(area)} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors">
                      <EyeIcon className="w-5 h-5"/>
                    </button>
                    <button type="button" onClick={() => openModal(area)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors">
                      <EditIcon className="w-5 h-5"/>
                    </button>
                    <button type="button" onClick={() => handleDelete(area.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors">
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  {commonAreas.length > 0 ? 'Nenhuma área encontrada com os critérios de pesquisa.' : 'Nenhuma área comum cadastrada.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentItem ? 'Editar Área Comum' : 'Nova Área Comum'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-900">Cliente</label>
                  <div className="mt-2">
                    <input type="text" id="client" name="client" value={formState.client} onChange={handleInputChange} placeholder="Ex: Hotel Palace" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm" required/>
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-900">Local</label>
                  <div className="mt-2">
                    <input type="text" id="location" name="location" value={formState.location} onChange={handleInputChange} placeholder="Ex: Bloco A, Térreo" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm" required/>
                  </div>
                </div>
                <div>
                  <label htmlFor="subLocation" className="block text-sm font-medium text-gray-900">Sublocal</label>
                  <div className="mt-2">
                    <input type="text" id="subLocation" name="subLocation" value={formState.subLocation} onChange={handleInputChange} placeholder="Ex: Corredor Principal" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-900">Área (m²)</label>
                  <div className="mt-2">
                    <input type="number" id="area" name="area" value={formState.area} onChange={handleInputChange} placeholder="Ex: 50" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="environment" className="block text-sm font-medium text-gray-900">Ambiente</label>
                  <div className="mt-2 flex items-stretch space-x-2">
                    <input id="environment" type="text" name="environment" value={formState.environment} onChange={handleInputChange} placeholder="Ex: Lobby de Hotel, Cozinha" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm" />
                    <button type="button" onClick={handleGetSuggestions} disabled={!formState.environment || isLoadingSuggestions} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors">
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      {isLoadingSuggestions ? 'Sugerindo...' : 'Sugerir'}
                    </button>
                  </div>
                </div>
              </div>
              
              {suggestions.length > 0 && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50/50">
                  <h4 className="font-semibold text-gray-800">Sugestões de Atividades</h4>
                  <p className="text-sm text-gray-500 mb-3">Sugestões baseadas no ambiente informado.</p>
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                    {suggestions.map((s, i) => (
                      <div key={i} className="p-3 bg-white rounded-md shadow-sm text-sm">
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4">
                <button type="button" onClick={closeModal} className="text-sm font-semibold text-gray-900 hover:text-gray-700 px-4 py-2">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50">
                  {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPreviewOpen && currentItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Detalhes da Área</h3>
            <div className="space-y-4">
              <div><span className="font-medium text-gray-700">Cliente:</span> <span className="text-gray-900">{currentItem.client}</span></div>
              <div><span className="font-medium text-gray-700">Local:</span> <span className="text-gray-900">{currentItem.location}</span></div>
              <div><span className="font-medium text-gray-700">Sublocal:</span> <span className="text-gray-900">{currentItem.subLocation || '-'}</span></div>
              <div><span className="font-medium text-gray-700">Ambiente:</span> <span className="text-gray-900">{currentItem.environment || '-'}</span></div>
              <div><span className="font-medium text-gray-700">Área:</span> <span className="text-gray-900">{currentItem.area} m²</span></div>
            </div>
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={closePreview} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonAreas;
