import React, { useState, useEffect } from 'react';
import { usersService, coachesAndClassesService } from '../../services/api';
import { Users, Search, Edit3, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';
import MemberCardModal from '../../components/common/MemberCardModal';
import UserDiscountsModal from '../../components/admin/UserDiscountsModal';
import TablePaginationBar, { TableSortHeader } from '../../components/common/TablePaginationBar';
import { useTablePagination } from '../../hooks/useTablePagination';
import { formatDNI, formatPhone, isValidDNI, isValidEmail } from '../../utils/formatters';
import { useFeedback } from '../../context/FeedbackContext';

export default function UsersManagementPage() {
  const { notify } = useFeedback();
  const [users, setUsers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userForDiscounts, setUserForDiscounts] = useState(null);
  const [createData, setCreateData] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    address: '',
    role: 'client'
  });
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    address: '',
    role: 'client'
  });

  useEffect(() => {
    loadUsers();
    coachesAndClassesService.getCoaches().then(res => setCoaches(res.data));
  }, []);

  const loadUsers = async () => {
    const res = await usersService.getAll();
    setUsers(res.data);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      dni: user.dni,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!isValidDNI(formData.dni)) {
      notify({ variant: 'warning', message: 'Por favor ingrese un DNI válido (entre 7 y 8 dígitos).' });
      return;
    }
    if (!isValidEmail(formData.email)) {
      notify({ variant: 'warning', message: 'Por favor ingrese un correo electrónico válido.' });
      return;
    }
    await usersService.update(selectedUser.id, formData);
    setShowEditModal(false);
    loadUsers();
    notify({ variant: 'success', title: 'Usuario actualizado', message: '¡Datos de usuario actualizados correctamente!' });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isValidDNI(createData.dni)) {
      notify({ variant: 'warning', message: 'Por favor ingrese un DNI válido (entre 7 y 8 dígitos).' });
      return;
    }
    if (!isValidEmail(createData.email)) {
      notify({ variant: 'warning', message: 'Por favor ingrese un correo electrónico válido.' });
      return;
    }
    try {
      await usersService.create(createData);
      setShowCreateModal(false);
      setCreateData({ name: '', dni: '', email: '', phone: '', address: '', role: 'client' });
      loadUsers();
      notify({ variant: 'success', title: 'Usuario registrado', message: '¡Usuario registrado correctamente!' });
    } catch (err) {
      notify({ variant: 'error', title: 'Error al registrar', message: err.message || 'No se pudo registrar el usuario.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    await usersService.delete(userToDelete.id);
    setUserToDelete(null);
    loadUsers();
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side pagination and column sorting (Point 8)
  const keyExtractors = {
    name: (u) => u.name,
    dni: (u) => u.dni,
    email: (u) => u.email,
    address: (u) => u.address,
    role: (u) => u.role
  };

  const {
    paginatedData,
    sortKey,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalRecords,
    startRecord,
    endRecord
  } = useTablePagination(filteredUsers, {
    defaultSortKey: 'name',
    defaultSortOrder: 'asc',
    defaultPageSize: 10,
    keyExtractors
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Padrón de Usuarios y Socios
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Imprimir Padrón de Usuarios
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-tennis-600 hover:bg-tennis-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Users Directory Table */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Directorio de Socios Registrados</h2>
              <span className="text-xs text-slate-400">Haz clic en los encabezados para ordenar</span>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-tennis-600"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase bg-slate-50/50">
                <TableSortHeader
                  label="Socio / N°"
                  sortField="name"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Documento (DNI)"
                  sortField="dni"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Contacto (Email / Tel)"
                  sortField="email"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Dirección"
                  sortField="address"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                />
                <TableSortHeader
                  label="Rol"
                  sortField="role"
                  currentSortKey={sortKey}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  align="center"
                />
                <th className="py-3 px-3 text-center no-print">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No se encontraron socios o usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedData.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{u.name}</div>
                      <span className="text-[10px] font-bold text-tennis-700">
                        {u.memberNumber || 'TA-8821'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700 font-mono">
                      {u.dni}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{u.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {u.address}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold ${
                        u.role === 'admin' 
                          ? 'text-tennis-300' 
                          : 'text-tennis-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : u.role === 'coach' ? 'Profesional' : 'Socio'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForCard(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-tennis-50 hover:bg-tennis-100 text-tennis-800 text-[11px] font-bold flex items-center gap-1 border border-tennis-200 transition-colors"
                          title="Imprimir Carnet de Socio "
                        >
                          Carnet
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-800 transition-colors"
                          title="Modificar datos"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserForDiscounts(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-tennis-50 text-slate-700 hover:text-tennis-700 transition-colors relative"
                          title={`Descuentos del usuario (${(u.activeDiscounts || []).length} activos)`}
                        >
                          {(u.activeDiscounts || []).length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-tennis-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {(u.activeDiscounts || []).length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-50 text-slate-700 hover:text-slate-600 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        <TablePaginationBar
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRecords={totalRecords}
          startRecord={startRecord}
          endRecord={endRecord}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Modificar Ficha de Usuario: ${selectedUser?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">DNI (XX.XXX.XXX) *</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="38.452.129"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: formatDNI(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Teléfono *</label>
              <input
                type="text"
                required
                placeholder="+54 11 4892-1234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Dirección / Domicilio *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-3 py-2 text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal (RF001) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Registrar Nuevo Usuario"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">DNI (XX.XXX.XXX) *</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="38.452.129"
                value={createData.dni}
                onChange={(e) => setCreateData({ ...createData, dni: formatDNI(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Teléfono *</label>
              <input
                type="text"
                required
                placeholder="+54 11 4892-1234"
                value={createData.phone}
                onChange={(e) => setCreateData({ ...createData, phone: formatPhone(e.target.value) })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Email *</label>
            <input
              type="email"
              required
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Dirección / Domicilio *</label>
            <input
              type="text"
              required
              value={createData.address}
              onChange={(e) => setCreateData({ ...createData, address: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Rol *</label>
            <select
              value={createData.role}
              onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
              className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
            >
              <option value="client">Socio</option>
              <option value="coach">Profesional (profesor o entrenador)</option>
              <option value="admin">Administrador / Empleado</option>
            </select>
          </div>

          {createData.role === 'coach' && (
            <div>
              <label className="font-bold text-slate-700 uppercase block mb-1">Ficha de profesional *</label>
              <select
                required
                value={createData.coachId || ''}
                onChange={(e) => setCreateData({ ...createData, coachId: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white font-bold"
              >
                <option value="" disabled>Elegir profesional</option>
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-2 text-slate-600">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-tennis-600 hover:bg-tennis-700 text-white font-bold rounded-xl">
              Registrar Usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal (RF004) */}
      <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Confirmar Eliminación de Usuario" maxWidth="max-w-md">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            ¿Está seguro de eliminar a <strong>{userToDelete?.name}</strong> (N° {userToDelete?.memberNumber}) del padrón? Esta acción no puede deshacerse.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setUserToDelete(null)} className="px-3 py-2 text-slate-600">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl">
              Eliminar Usuario
            </button>
          </div>
        </div>
      </Modal>

      {/* User Discounts Modal (RF138 - RF141) */}
      <UserDiscountsModal
        isOpen={!!userForDiscounts}
        onClose={() => setUserForDiscounts(null)}
        user={userForDiscounts}
        onSaved={loadUsers}
      />

      {/* Official Member Card Modal  */}
      <MemberCardModal
        isOpen={!!selectedUserForCard}
        onClose={() => setSelectedUserForCard(null)}
        member={selectedUserForCard}
      />

    </div>
  );
}
