
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { CommonArea, Activity } from '../types';
import { EditIcon, TrashIcon, SparklesIcon, EyeIcon, DownloadIcon, UploadIcon, PlusIcon } from '../components/icons';
import { suggestActivitiesForEnvironment } from '../services/geminiService';

declare var XLSX: any;

const CommonAreas: React.FC = () => {
  const { commonAreas, setCommonAreas, activities, setActivities, workPlans, teamMembers } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<CommonArea | null>(null);
  const [formState, setFormState] = useState<Omit<CommonArea, 'id'>>({ name: '', client: '', location: '', subLocation: '', environment: '', area: 0 });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const openModal = (item: CommonArea | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { ...item } : { name: '', client: '', location: '', subLocation: '', environment: '', area: 0 });
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
        tools: [],
        materials: [],
    };
    setActivities(prev => [...prev, { ...newActivity, id: Date.now().toString() }]);
    setSuggestions(prev => prev.filter(s => s !== suggestionName));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      setCommonAreas(prev => prev.map(a => a.id === currentItem.id ? { ...formState, id: currentItem.id } : a));
    } else {
      setCommonAreas(prev => [...prev, { ...formState, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setCommonAreas(prev => prev.filter(a => a.id !== id));
  };
  
  const handleExport = () => {
    const headers = [["name", "client", "location", "subLocation", "environment", "area"]];
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
            // FIX: Removed unnecessary and incorrect type argument from untyped function call.
            const json = XLSX.utils.sheet_to_json(worksheet);

            const newAreas: CommonArea[] = json.map((row: any, index: number) => ({
                id: `${Date.now()}-${index}`,
                name: row.name || '',
                client: row.client || '',
                location: row.location || '',
                subLocation: row.subLocation || '',
                environment: row.environment || '',
                area: Number(row.area) || 0,
            })).filter(area => area.name); // Basic validation: name is required

            const existingNames = new Set(commonAreas.map(a => a.name.toLowerCase()));
            const uniqueNewAreas = newAreas.filter(a => !existingNames.has(a.name.toLowerCase()));

            setCommonAreas(prev => [...prev, ...uniqueNewAreas]);
          } catch (error) {
              console.error("Error processing Excel file:", error);
              alert("Ocorreu um erro ao processar o arquivo. Verifique se o formato está correto.");
          }
      };
      reader.readAsBinaryString(file);
      e.target.value = ''; // Reset file input to allow re-uploading the same file
  };

  const areaWorkPlans = workPlans.filter(wp => wp.commonAreaId === currentItem?.id);

  return (
    <div className="p-8">
      <PageHeader title="Áreas Comuns">
        <button onClick={handleExport} className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 text-sm font-medium">
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
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 text-sm font-medium">
            <UploadIcon className="w-5 h-5 mr-2" />
            Importar em Massa
        </button>
        <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
        >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nova Área Comum
        </button>
      </PageHeader>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ambiente</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commonAreas.length > 0 ? commonAreas.map(area => (
              <tr key={area.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.environment}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-2">
                    <button onClick={() => openPreview(area)} className="text-blue-600 hover:text-blue-900" aria-label={`Preview ${area.name}`}>
                      <EyeIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => openModal(area)} className="text-primary-600 hover:text-primary-900" aria-label={`Edit ${area.name}`}>
                      <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleDelete(area.id)} className="text-red-600 hover:text-red-900" aria-label={`Delete ${area.name}`}>
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
                 <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma área comum cadastrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{currentItem ? 'Editar Área Comum' : 'Nova Área Comum'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Área</label>
                  <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} placeholder="Nome da Área" className="mt-1 w-full p-2 border rounded" required />
                </div>
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700">Cliente</label>
                  <input type="text" id="client" name="client" value={formState.client} onChange={handleInputChange} placeholder="Cliente" className="mt-1 w-full p-2 border rounded" />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Localização</label>
                  <input type="text" id="location" name="location" value={formState.location} onChange={handleInputChange} placeholder="Localização" className="mt-1 w-full p-2 border rounded" />
                </div>
                <div>
                  <label htmlFor="subLocation" className="block text-sm font-medium text-gray-700">Sub-localização</label>
                  <input type="text" id="subLocation" name="subLocation" value={formState.subLocation} onChange={handleInputChange} placeholder="Sub-localização" className="mt-1 w-full p-2 border rounded" />
                </div>
                 <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">Área (m²)</label>
                  <input type="number" id="area" name="area" value={formState.area} onChange={handleInputChange} placeholder="Área (m²)" className="mt-1 w-full p-2 border rounded" />
                </div>
                <div className="md:col-span-2">
                    <div className="flex items-end space-x-2">
                        <div className="flex-grow">
                            <label htmlFor="environment" className="block text-sm font-medium text-gray-700">Ambiente</label>
                            <input id="environment" type="text" name="environment" value={formState.environment} onChange={handleInputChange} placeholder="Ex: Lobby de Hotel, Cozinha" className="w-full p-2 border rounded mt-1" />
                        </div>
                        <button type="button" onClick={handleGetSuggestions} disabled={!formState.environment || isLoadingSuggestions} className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300 flex items-center h-10">
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoadingSuggestions ? 'Sugerindo...' : 'Sugerir Atividades'}
                        </button>
                    </div>
                </div>
              </div>
              
              {suggestions.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-gray-800">Sugestões de Atividades</h4>
                    <p className="text-sm text-gray-500 mb-2">Clique em uma sugestão para adicioná-la à sua lista de atividades globais.</p>
                    <ul className="space-y-2">
                        {suggestions.map((s, i) => (
                            <li key={i} onClick={() => addSuggestionAsActivity(s)} className="cursor-pointer p-2 bg-white rounded hover:bg-primary-50 text-sm">{s}</li>
                        ))}
                    </ul>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <div className="bg-white rounded-lg p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h3 id="preview-title" className="text-2xl font-bold mb-4 text-primary-700">{currentItem.name}</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-800 text-3xl leading-none" aria-label="Close preview">&times;</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mb-6 border-b pb-4">
              <div><strong>Cliente:</strong> {currentItem.client || 'N/A'}</div>
              <div><strong>Localização:</strong> {currentItem.location || 'N/A'}</div>
              <div><strong>Sub-localização:</strong> {currentItem.subLocation || 'N/A'}</div>
              <div><strong>Ambiente:</strong> {currentItem.environment || 'N/A'}</div>
              <div><strong>Área:</strong> {currentItem.area || 0} m²</div>
            </div>

            <h4 className="text-lg font-bold text-gray-800 mb-2">Planos de Trabalho Associados</h4>
            {areaWorkPlans.length > 0 ? (
                <div className="space-y-4">
                    {areaWorkPlans.map(plan => (
                        <div key={plan.id} className="p-4 border rounded-md bg-gray-50">
                            <p className="font-semibold">Plano de {new Date(plan.date).toLocaleDateString()}</p>
                            <ul className="list-disc list-inside mt-2 ml-4 text-sm">
                                {plan.plannedActivities.map(pa => {
                                    const activity = activities.find(a => a.id === pa.activityId);
                                    const member = teamMembers.find(t => t.id === pa.assignedTeamMemberId);
                                    return (
                                        <li key={pa.id}>
                                            {activity?.name || 'Atividade desconhecida'} 
                                            {member && <span className="text-xs bg-primary-100 text-primary-800 rounded-full px-2 py-0.5 ml-2">{member.name}</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">Nenhum plano de trabalho encontrado para esta área.</p>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={closePreview} className="px-4 py-2 bg-gray-200 rounded">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommonAreas;