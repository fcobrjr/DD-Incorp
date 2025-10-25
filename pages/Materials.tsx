
import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { Resource } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from '../components/icons';

const Materials: React.FC = () => {
  const { materials, setMaterials } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Resource | null>(null);
  const [formState, setFormState] = useState<Omit<Resource, 'id'>>({ name: '', unit: '', coefficientM2: 0 });

  const openModal = (item: Resource | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { ...item } : { name: '', unit: '', coefficientM2: 0 });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem) {
      setMaterials(prev => prev.map(m => m.id === currentItem.id ? { ...formState, id: currentItem.id } : m));
    } else {
      setMaterials(prev => [...prev, { ...formState, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="p-8">
      <PageHeader title="Materiais">
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Material
        </button>
      </PageHeader>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coeficiente / m²</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.length > 0 ? materials.map(material => (
              <tr key={material.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.coefficientM2 || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-1">
                    <button onClick={() => openModal(material)} className="p-2 rounded-full text-primary-600 hover:bg-primary-100 transition-colors"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(material.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">Nenhum material cadastrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{currentItem ? 'Editar Material' : 'Novo Material'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Nome do Material</label>
                  <div className="mt-2">
                    <input type="text" id="name" name="name" value={formState.name} onChange={handleInputChange} placeholder="Ex: Detergente" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium leading-6 text-gray-900">Unidade</label>
                      <div className="mt-2">
                        <input type="text" id="unit" name="unit" value={formState.unit} onChange={handleInputChange} placeholder="Ex: ml, L, kg, un" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" required />
                      </div>
                    </div>
                     <div>
                      <label htmlFor="coefficientM2" className="block text-sm font-medium leading-6 text-gray-900">Coeficiente / m²</label>
                      <div className="mt-2">
                        <input type="number" id="coefficientM2" name="coefficientM2" value={formState.coefficientM2} onChange={handleInputChange} placeholder="Ex: 0.05" step="0.001" className="block w-full rounded-md border-0 py-1.5 bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                      </div>
                    </div>
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

export default Materials;