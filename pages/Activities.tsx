import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { Activity, CorrelatedResource } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from '../components/icons';

const Activities: React.FC = () => {
  const { activities, setActivities, tools, materials } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [formState, setFormState] = useState<Omit<Activity, 'id'>>({ name: '', description: '', sla: 0, tools: [], materials: [] });

  const openModal = (activity: Activity | null = null) => {
    setCurrentActivity(activity);
    setFormState(activity ? { ...activity } : { name: '', description: '', sla: 0, tools: [], materials: [] });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentActivity(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };
  
  const addResource = (type: 'tools' | 'materials') => {
      const selectElement = document.getElementById(`select-${type}`) as HTMLSelectElement;
      if (!selectElement) return;

      const resourceId = selectElement.value;
      if (!resourceId || formState[type].some(r => r.resourceId === resourceId)) {
        selectElement.value = "";
        return;
      };
      
      let quantity = 1;
      if (type === 'materials') {
        const material = materials.find(m => m.id === resourceId);
        if (material?.coefficientM2 && material.coefficientM2 > 0) {
          quantity = material.coefficientM2;
        }
      }

      const newResource: CorrelatedResource = { resourceId, quantity };
      setFormState(prev => ({ ...prev, [type]: [...prev[type], newResource] }));
      selectElement.value = "";
  };

  const updateResourceQuantity = (type: 'tools' | 'materials', resourceId: string, quantity: number) => {
      setFormState(prev => ({
          ...prev,
          [type]: prev[type].map(r => r.resourceId === resourceId ? { ...r, quantity: quantity < 0 ? 0 : quantity } : r)
      }));
  };

  const removeResource = (type: 'tools' | 'materials', resourceId: string) => {
      setFormState(prev => ({
          ...prev,
          [type]: prev[type].filter(r => r.resourceId !== resourceId)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentActivity) {
      setActivities(prev => prev.map(a => a.id === currentActivity.id ? { ...formState, id: currentActivity.id } : a));
    } else {
      setActivities(prev => [...prev, { ...formState, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const renderResourceList = (type: 'tools' | 'materials') => {
    const resourceList = type === 'tools' ? tools : materials;
    const title = type === 'tools' ? 'Equipamentos' : 'Materiais';
    return (
        <div className="mt-6">
            <h4 className="text-lg font-medium leading-6 text-gray-900">{title}</h4>
            <div className="mt-4">
              <label htmlFor={`select-${type}`} className="sr-only">Adicionar {title}</label>
              <div className="flex items-stretch space-x-2">
                  <select id={`select-${type}`} className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                      <option value="">Selecione para adicionar...</option>
                      {resourceList.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                  </select>
                  <button type="button" onClick={() => addResource(type)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 whitespace-nowrap">Adicionar</button>
              </div>
            </div>
            <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
                {formState[type].length > 0 ? formState[type].map(correlated => {
                    const resource = resourceList.find(r => r.id === correlated.resourceId);
                    if (!resource) return null;
                    const isCoefficient = type === 'materials' && resource.coefficientM2 && resource.coefficientM2 > 0;
                    return (
                        <div key={correlated.resourceId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                                <span className="text-sm font-medium text-gray-800">{resource.name}</span>
                                {isCoefficient && <span className="text-xs text-blue-600 block">Coeficiente / m²</span>}
                            </div>
                            <div className="flex items-center space-x-3">
                                <input 
                                    type="number" 
                                    aria-label={`Quantidade de ${resource.name}`}
                                    value={correlated.quantity}
                                    onChange={(e) => updateResourceQuantity(type, correlated.resourceId, parseFloat(e.target.value))}
                                    className="block w-24 rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                    min="0"
                                    step="0.001"
                                />
                                <span className="text-sm text-gray-500 min-w-[30px]">{resource.unit}</span>
                                <button type="button" onClick={() => removeResource(type, correlated.resourceId)} className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors" aria-label={`Remover ${resource.name}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )
                }) : (
                  <div className="text-center py-4 text-sm text-gray-500">Nenhum {title.toLowerCase()} adicionado.</div>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader title="Atividades">
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nova Atividade
        </button>
      </PageHeader>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA (min)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recursos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             {activities.length > 0 ? activities.map(activity => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate">{activity.description}</td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.sla}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.tools.length} Equip. / {activity.materials.length} Mat.
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-1">
                    <button onClick={() => openModal(activity)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(activity.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma atividade cadastrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentActivity ? 'Editar Atividade' : 'Nova Atividade'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Nome da Atividade</label>
                      <div className="mt-2">
                        <input type="text" name="name" id="name" value={formState.name} onChange={handleInputChange} placeholder="Ex: Limpeza de Vidros" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                      </div>
                    </div>
                    <div>
                        <label htmlFor="sla" className="block text-sm font-medium leading-6 text-gray-900">SLA (minutos)</label>
                        <div className="mt-2">
                           <input type="number" name="sla" id="sla" value={formState.sla} onChange={handleInputChange} placeholder="Ex: 60" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                        </div>
                    </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Descrição</label>
                  <div className="mt-2">
                    <textarea name="description" id="description" value={formState.description} onChange={handleInputChange} placeholder="Detalhes sobre a atividade..." className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" rows={3}></textarea>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pt-2">
                  {renderResourceList('tools')}
                  {renderResourceList('materials')}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4">
                <button type="button" onClick={closeModal} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;