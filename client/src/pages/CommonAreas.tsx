
import React, { useState, useContext, useRef, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/SearchableSelect';
import { CommonArea, Activity } from '@shared/types';
import { EditIcon, TrashIcon, SparklesIcon, EyeIcon, DownloadIcon, UploadIcon, PlusIcon } from '../components/icons';
import { suggestActivitiesForEnvironment } from '../services/geminiService';
import FilterToolbar from '../components/FilterToolbar';

declare var XLSX: any;

const CommonAreas: React.FC = () => {
  const { 
    commonAreas, setCommonAreas, 
    activities, setActivities, 
    workPlans, setWorkPlans,
    setScheduledActivities 
  } = useContext(AppContext)!;

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
  const [pageSize, setPageSize] = useState(10);


  const openModal = (item: CommonArea | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { ...item } : { client: '', location: '', subLocation: '', environment: '', area: 0 });
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

  const addSuggestionAsActivity = (suggestionName: string) => {
    if (activities.some(act => act.name.toLowerCase() === suggestionName.toLowerCase())) {
        return;
    }
    const newActivity: Omit<Activity, 'id'> = {
        name: suggestionName,
        description: `Atividade sugerida para ambiente: ${formState.environment}`,
        sla: 0,
        tools: [],
        materials: [],
    };
    setActivities(prev => [...prev, { ...newActivity, id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` }]);
    setSuggestions(prev => prev.filter(s => s !== suggestionName));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      setCommonAreas(prev => prev.map(a => a.id === currentItem.id ? { ...formState, id: currentItem.id } : a));
    } else {
      setCommonAreas(prev => [...prev, { ...formState, id: `area-${Date.now()}` }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta área comum? Isso removerá permanentemente todos os Planos de Trabalho e Agendamentos vinculados a ela.")) {
        const plansToDelete = workPlans.filter(wp => wp.commonAreaId === id);
        const planIds = plansToDelete.map(p => p.id);
        setScheduledActivities(prev => prev.filter(sa => !planIds.includes(sa.workPlanId)));
        setWorkPlans(prev => prev.filter(wp => wp.commonAreaId !== id));
        setCommonAreas(prev => prev.filter(a => a.id !== id));
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
      reader.onload = (event) => {
          try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            const getCompositeKey = (area: Omit<CommonArea, 'id'>) => 
                `${area.client}|${area.location}|${area.subLocation}|${area.environment}`.toLowerCase();

            const newAreas: CommonArea[] = json.map((row: any, index: number) => ({
                id: `area-import-${Date.now()}-${index}`,
                client: row.client || '',
                location: row.location || '',
                subLocation: row.subLocation || '',
                environment: row.environment || '',
                area: Number(row.area) || 0,
            })).filter(area => area.client && area.location); 

            const existingKeys = new Set(commonAreas.map(getCompositeKey));
            const uniqueNewAreas: CommonArea[] = [];
            const processedKeysInFile = new Set<string>();

            newAreas.forEach(area => {
                const key = getCompositeKey(area);
                if (!existingKeys.has(key) && !processedKeysInFile.has(key)) {
                    uniqueNewAreas.push(area);
                    processedKeysInFile.add(key);
                }
            });
            
            setCommonAreas(prev => [...prev, ...uniqueNewAreas]);
          } catch (error) {
              console.error("Error processing Excel file:", error);
              alert("Ocorreu um erro ao processar o arquivo. Verifique se o formato está correto.");
          }
      };
      reader.readAsBinaryString(file);
      e.target.value = '';
  };
  
  const plannedActivitiesDetails = useMemo(() => {
    if (!currentItem) return [];
    return workPlans
        .filter(wp => wp.commonAreaId === currentItem.id)
        .flatMap(plan => 
            (plan.plannedActivities || []).map(pa => {
                const activity = activities.find(a => a.id === pa.activityId);
                return {
                    periodicity: pa.periodicity,
                    activityName: activity?.name || 'Atividade desconhecida',
                    id: pa.id
                };
            })
        );
}, [workPlans, activities, currentItem]);

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
    setFilters({
        search: '',
        client: '',
        location: '',
        subLocation: '',
        environment: '',
    });
    setPageSize(10);
};

const uniqueClients = useMemo(() => [...new Set(commonAreas.map(a => a.client).filter(Boolean))].sort(), [commonAreas]);
    
const uniqueLocations = useMemo(() => {
    if (!filters.client) return [];
    return [...new Set(commonAreas.filter(a => a.client === filters.client).map(a => a.location).filter(Boolean))].sort();
}, [commonAreas, filters.client]);
    
const uniqueSubLocations = useMemo(() => {
    if (!filters.client || !filters.location) return [];
    return [...new Set(commonAreas.filter(a => a.client === filters.client && a.location === filters.location).map(a => a.subLocation).filter(Boolean))].sort();
}, [commonAreas, filters.client, filters.location]);

const uniqueEnvironments = useMemo(() => {
    if (!filters.client || !filters.location || !filters.subLocation) return [];
    return [...new Set(commonAreas.filter(a => a.client === filters.client && a.location === filters.location && a.subLocation === filters.subLocation).map(a => a.environment).filter(Boolean))].sort();
}, [commonAreas, filters.client, filters.location, filters.subLocation]);


const filteredCommonAreas = useMemo(() => {
    return commonAreas.filter(area => {
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesSearch = 
                area.client.toLowerCase().includes(searchTerm) ||
                area.location.toLowerCase().includes(searchTerm) ||
                area.subLocation.toLowerCase().includes(searchTerm) ||
                area.environment.toLowerCase().includes(searchTerm);
            
            if (!matchesSearch) return false;
        }

        if (filters.client && area.client !== filters.client) return false;
        if (filters.location && area.location !== filters.location) return false;
        if (filters.subLocation && area.subLocation !== filters.subLocation) return false;
        if (filters.environment && area.environment !== filters.environment) return false;
        return true;
    });
}, [commonAreas, filters]);


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
        <FilterToolbar
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearFilters={() => setFilters({ search: '', client: '', location: '', subLocation: '', environment: '' })}
        />
      </div>

      {showFilters && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Filtros Avançados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" style={{ gridAutoRows: 'max-content' }}>
                  <div>
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <input
                          type="text"
                          id="search"
                          name="search"
                          value={filters.search}
                          onChange={handleFilterChange}
                          placeholder="Buscar por nome..."
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                  </div>
                  <div>
                      <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <SearchableSelect
                          options={[{value: '', label: 'Todos'}, ...uniqueClients.filter(c => c).map(cli => ({value: cli, label: cli}))]}
                          value={filters.client}
                          onChange={(val) => setFilters({...filters, client: val})}
                          placeholder="Todos"
                      />
                  </div>
                  <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                      <SearchableSelect
                          options={[{value: '', label: 'Todos'}, ...uniqueLocations.filter(l => l).map(loc => ({value: loc, label: loc}))]}
                          value={filters.location}
                          onChange={(val) => setFilters({...filters, location: val})}
                          placeholder="Todos"
                      />
                  </div>
                  <div>
                      <label htmlFor="subLocation" className="block text-sm font-medium text-gray-700 mb-1">Sublocal</label>
                      <SearchableSelect
                          options={[{value: '', label: 'Todos'}, ...uniqueSubLocations.filter(s => s).map(sub => ({value: sub, label: sub}))]}
                          value={filters.subLocation}
                          onChange={(val) => setFilters({...filters, subLocation: val})}
                          placeholder="Todos"
                      />
                  </div>
                  <div>
                      <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
                      <SearchableSelect
                          options={[{value: '', label: 'Todos'}, ...uniqueEnvironments.filter(e => e).map(env => ({value: env, label: env}))]}
                          value={filters.environment}
                          onChange={(val) => setFilters({...filters, environment: val})}
                          placeholder="Todos"
                      />
                  </div>
                  <div>
                      <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-1">Linhas por página</label>
                      <select
                          id="pageSize"
                          value={pageSize}
                          onChange={(e) => setPageSize(parseInt(e.target.value))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                          <option value={10}>10 linhas</option>
                          <option value={20}>20 linhas</option>
                          <option value={30}>30 linhas</option>
                      </select>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-y-auto" style={{ maxHeight: `${pageSize === 10 ? '550px' : pageSize === 20 ? '1100px' : '1650px'}` }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
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
                    <button type="button" onClick={() => openPreview(area)} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors" aria-label={`Visualizar ${area.client}`}>
                      <EyeIcon className="w-5 h-5"/>
                    </button>
                    <button type="button" onClick={() => openModal(area)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors" aria-label={`Editar ${area.client}`}>
                      <EditIcon className="w-5 h-5"/>
                    </button>
                    <button type="button" onClick={() => handleDelete(area.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" aria-label={`Excluir ${area.client}`}>
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
      </div>
      
      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentItem ? 'Editar Área Comum' : 'Nova Área Comum'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="client" className="block text-sm font-medium leading-6 text-gray-900">Cliente</label>
                  <div className="mt-2">
                    <input type="text" id="client" name="client" value={formState.client} onChange={handleInputChange} placeholder="Ex: Hotel Palace" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required/>
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium leading-6 text-gray-900">Local</label>
                  <div className="mt-2">
                    <input type="text" id="location" name="location" value={formState.location} onChange={handleInputChange} placeholder="Ex: Bloco A, Térreo" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required/>
                  </div>
                </div>
                <div>
                  <label htmlFor="subLocation" className="block text-sm font-medium leading-6 text-gray-900">Sublocal</label>
                  <div className="mt-2">
                    <input type="text" id="subLocation" name="subLocation" value={formState.subLocation} onChange={handleInputChange} placeholder="Ex: Corredor Principal" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                  </div>
                </div>
                 <div>
                  <label htmlFor="area" className="block text-sm font-medium leading-6 text-gray-900">Área (m²)</label>
                  <div className="mt-2">
                    <input type="number" id="area" name="area" value={formState.area} onChange={handleInputChange} placeholder="Ex: 50" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                  </div>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="environment" className="block text-sm font-medium leading-6 text-gray-900">Ambiente</label>
                    <div className="mt-2 flex items-stretch space-x-2">
                        <input id="environment" type="text" name="environment" value={formState.environment} onChange={handleInputChange} placeholder="Ex: Lobby de Hotel, Cozinha" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
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
                    <p className="text-sm text-gray-500 mb-3">Clique em uma sugestão para adicioná-la à sua lista de atividades globais.</p>
                    <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                        {suggestions.map((s, i) => (
                             <div key={i} onClick={() => addSuggestionAsActivity(s)} className="cursor-pointer p-3 bg-white rounded-md shadow-sm hover:bg-primary-50 hover:shadow-md transition-all duration-150 text-sm flex justify-between items-center group">
                                <span>{s}</span>
                                <PlusIcon className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                              </div>
                        ))}
                    </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4">
                <button type="button" onClick={closeModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Preview Modal */}
      {isPreviewOpen && currentItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50" role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h3 id="preview-title" className="text-2xl font-bold mb-4 text-primary-700">{`${currentItem.client} - ${currentItem.environment}`}</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-800 text-3xl leading-none transition-colors" aria-label="Fechar visualização">&times;</button>
            </div>
            
            <div className="mb-6 border-b pb-4">
                <table className="w-full text-sm text-left text-gray-700">
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-semibold pr-4 w-1/3 text-gray-900">Cliente</td>
                            <td className="py-2 text-gray-600">{currentItem.client || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-semibold pr-4 text-gray-900">Localização</td>
                            <td className="py-2 text-gray-600">{currentItem.location || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-semibold pr-4 text-gray-900">Sub-localização</td>
                            <td className="py-2 text-gray-600">{currentItem.subLocation || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="py-2 font-semibold pr-4 text-gray-900">Ambiente</td>
                            <td className="py-2 text-gray-600">{currentItem.environment || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td className="py-2 font-semibold pr-4 text-gray-900">Área</td>
                            <td className="py-2 text-gray-600">{currentItem.area || 0} m²</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h4 className="text-lg font-bold text-gray-800 mb-2">Atividades Planejadas</h4>
             <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodicidade</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {plannedActivitiesDetails.length > 0 ? plannedActivitiesDetails.map(detail => (
                            <tr key={detail.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{detail.activityName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{detail.periodicity}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={2} className="text-center py-6 text-gray-500">Nenhuma atividade planejada para esta área.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            <div className="mt-6 flex justify-end">
              <button type="button" onClick={closePreview} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommonAreas;
