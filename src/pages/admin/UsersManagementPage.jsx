import React, { useState, useEffect } from 'react';
import { usersService } from '../../services/api';
import { 
  Users, 
  Search, 
  Plus, 
  Printer, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  CheckCircle2,
  Shield,
  FileText
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import MemberCardModal from '../../components/common/MemberCardModal';
import TablePaginationBar, { TableSortHeader } from '../../components/common/TablePaginationBar';
import { useTablePagination } from '../../hooks/useTablePagination';
import { formatDNI, formatPhone, isValidDNI, isValidEmail } from '../../utils/formatters';

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
      alert('Por favor ingrese un DNI válido (entre 7 y 8 dígitos).');
      return;
    }
    if (!isValidEmail(formData.email)) {
      alert('Por favor ingrese un correo electrónico válido.');
      return;
    }
    await usersService.update(selectedUser.id, formData);
    setShowEditModal(false);
    loadUsers();
    alert('¡Datos de usuario actualizados correctamente!');
  };

  const handleDeleteUser = (userId) => {
    if (confirm('¿Está seguro de eliminar este usuario del sistema?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
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
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro, modificación, consulta, eliminación e impresión de fichas de socios del club.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir Padrón de Usuarios
        </button>
      </div>

      {/* Users Directory Table */}
      <div id="printable-area" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-tennis-600" />
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
                      <span className="text-[10px] font-bold text-tennis-700 bg-tennis-50 px-1.5 py-0.5 rounded">
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin' 
                          ? 'bg-slate-900 text-tennis-300' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Socio'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForCard(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-200 transition-colors"
                          title="Imprimir Carnet de Socio "
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
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
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 transition-colors"
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

      {/* Official Member Card Modal  */}
      <MemberCardModal
        isOpen={!!selectedUserForCard}
        onClose={() => setSelectedUserForCard(null)}
        member={selectedUserForCard}
      />

    </div>
  );
}
