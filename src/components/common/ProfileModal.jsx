import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { mensajeDeError } from '../../services/api';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_SIDE = 320;

/** Reduce la imagen a un cuadrado de 320px para guardarla liviana como data URL. */
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('La foto tiene que ser una imagen JPG, PNG o WebP.'));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      reject(new Error('La foto no puede superar los 2 MB.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_SIDE;
      canvas.height = PHOTO_SIDE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PHOTO_SIDE, PHOTO_SIDE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

/**
 * Edición del perfil propio (socios, profesionales y empleados): nombre, teléfono y foto.
 */
export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const { notify } = useFeedback();
  const fileRef = useRef(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setPhoto(user.photo || '');
      setError('');
    }
  }, [isOpen, user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhoto(await readPhoto(file));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresá tu nombre y apellido.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim(), photo });
      onClose();
      notify({ variant: 'success', title: 'Perfil actualizado', message: 'Tus datos se guardaron correctamente.' });
    } catch (err) {
      setError(mensajeDeError(err, err?.message || 'No se pudieron guardar los cambios.'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const preview = { ...user, name: name || user.name, photo };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mi Perfil" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Foto */}
        <div className="flex items-center gap-4">
          <Avatar user={preview} size="w-20 h-20" rounded="rounded-2xl" textClass="text-2xl" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-tennis-50 hover:bg-tennis-100 text-tennis-800 font-bold border border-tennis-200 inline-flex items-center gap-1.5 transition-colors"
              >
                {photo ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto('')}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  Quitar
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>

        {/* Datos editables */}
        <div className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Nombre y Apellido *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-sm"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 0000-0000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-tennis-600 hover:bg-tennis-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
