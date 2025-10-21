

import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { Activity, CorrelatedResource } from '../types';
// FIX: Replaced unsupported 'buttonLabel' and 'onButtonClick' props with a button passed as a child to PageHeader for consistency. This also required importing the PlusIcon.
import { EditIcon, TrashIcon, PlusIcon } from '../components/icons';

const Activities: React.FC = () => {
  const { activities, setActivities, tools, materials } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [formState, setFormState] = useState<Omit<Activity, 'id'>>({ name: '', description: '', tools: [], materials: [] });

  const openModal = (activity: Activity | null = null) => {
    setCurrentActivity(activity);
    setFormState(activity ? { ...activity } : { name: '', description: '', tools: [], materials: [] });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentActivity(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const addResource = (type: 'tools' | 'materials') => {
      const resourceId = (document.getElementById(`select-${type}`) as HTMLSelectElement).value;
      if (!resourceId || formState[type].some(r => r.resourceId === resourceId)) return;
      
      const newResource: CorrelatedResource = { resourceId, quantity: 1 };
      setFormState(prev => ({ ...prev, [type]: [...prev[type], newResource] }));
  };

  const updateResourceQuantity = (type: 'tools' | 'materials', resourceId: string, quantity: number) => {
      setFormState(prev => ({
          ...prev,
          [type]: prev[type].map(r => r.resourceId === resourceId ? { ...r, quantity: quantity < 1 ? 1 : quantity } : r)
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
    return (
        <div>
            <h4 className="font-semibold text-gray-700 mt-4 mb-2">{type === 'tools' ? 'Equipamentos' : 'Materiais'}</h4>
            <div className="flex space-x-2">
                <select id={`select-${type}`} className="w-full p-2 border rounded">
                    <option value="">Selecione um item...</option>
                    {resourceList.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                </select>
                <button type="button" onClick={() => addResource(type)} className="px-4 py-2 bg-gray-200 rounded">Adicionar</button>
            </div>
            <ul className="mt-2 space-y-2">
                {formState[type].map(correlated => {
                    const resource = resourceList.find(r => r.id === correlated.resourceId);
                    if (!resource) return null;
                    return (
                        <li key={correlated.resourceId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{resource.name}</span>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="number" 
                                    value={correlated.quantity}
                                    onChange={(e) => updateResourceQuantity(type, correlated.resourceId, parseInt(e.target.value))}
                                    className="w-20 p-1 border rounded"
                                    min="1"
                                />
                                <span className="text-sm text-gray-500">{resource.unit}</span>
                                <button type="button" onClick={() => removeResource(type, correlated.resourceId)} className="text-red-500 hover:text-red-700">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
  }

  return (
    <div className="p-8">
      {/* FIX: Replaced unsupported 'buttonLabel' and 'onButtonClick' props with a button passed as a child to PageHeader for consistency. */}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recursos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             {activities.length > 0 ? activities.map(activity => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate">{activity.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.tools.length} Equip. / {activity.materials.length} Mat.
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(activity)} className="text-primary-600 hover:text-primary-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(activity.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">Nenhuma atividade cadastrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{currentActivity ? 'Editar Atividade' : 'Nova Atividade'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="Nome da Atividade" className="w-full p-2 border rounded" required />
                <textarea name="description" value={formState.description} onChange={handleInputChange} placeholder="Descrição" className="w-full p-2 border rounded" rows={3}></textarea>
                
                {renderResourceList('tools')}
                {renderResourceList('materials')}
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;