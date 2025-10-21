
import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import PageHeader from '../components/PageHeader';
import { TeamMember } from '../types';
import { EditIcon, TrashIcon } from '../components/icons';

const Team: React.FC = () => {
  const { teamMembers, setTeamMembers } = useContext(AppContext)!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<TeamMember | null>(null);
  const [formState, setFormState] = useState<Omit<TeamMember, 'id'>>({ name: '', role: '' });

  const openModal = (item: TeamMember | null = null) => {
    setCurrentItem(item);
    setFormState(item ? { ...item } : { name: '', role: '' });
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
      setTeamMembers(prev => prev.map(t => t.id === currentItem.id ? { ...formState, id: currentItem.id } : t));
    } else {
      setTeamMembers(prev => [...prev, { ...formState, id: Date.now().toString() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setTeamMembers(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="p-8">
      <PageHeader title="Equipes / Usuários" buttonLabel="Novo Membro" onButtonClick={() => openModal()} />
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teamMembers.length > 0 ? teamMembers.map(member => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(member)} className="text-primary-600 hover:text-primary-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">Nenhum membro de equipe cadastrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{currentItem ? 'Editar Membro' : 'Novo Membro'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="Nome do Membro" className="w-full p-2 border rounded" required />
                <input type="text" name="role" value={formState.role} onChange={handleInputChange} placeholder="Função (ex: Camareira, ASG)" className="w-full p-2 border rounded" required />
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

export default Team;
