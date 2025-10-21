

import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { Resource } from '../types';
// FIX: Replaced unsupported 'buttonLabel' and 'onButtonClick' props with a button passed as a child to PageHeader for consistency. This also required importing the PlusIcon.
import { EditIcon, TrashIcon, PlusIcon } from '../components/icons';

const Tools: React.FC = () => {
  const { tools, setTools } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Resource | null>(null);
  const [formState, setFormState] = useState<Omit<Resource, 'id'>>({ name: '', unit: '' });

  const openModal = (item: Resource | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { ...item } : { name: '', unit: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      setTools(prev => prev.map(t => t.id === currentItem.id ? { ...formState, id: currentItem.id } : t));
    } else {
      setTools(prev => [...prev, { ...formState, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="p-8">
      {/* FIX: Replaced unsupported 'buttonLabel' and 'onButtonClick' props with a button passed as a child to PageHeader for consistency. */}
      <PageHeader title="Ferramentas / Equipamentos">
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Equipamento
        </button>
      </PageHeader>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tools.length > 0 ? tools.map(tool => (
              <tr key={tool.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tool.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(tool)} className="text-primary-600 hover:text-primary-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(tool.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            )) : (
                 <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">Nenhum equipamento cadastrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{currentItem ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="Nome do Equipamento" className="w-full p-2 border rounded" required />
                <input type="text" name="unit" value={formState.unit} onChange={handleInputChange} placeholder="Unidade (ex: un, pç, kit)" className="w-full p-2 border rounded" required />
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

export default Tools;