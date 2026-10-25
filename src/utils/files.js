// Archivos adjuntos (reglamentos y títulos habilitantes): validación, lectura y descarga.

// Documentos adjuntos (reglamentos, títulos habilitantes): mismos límites que la API.
export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export function checkFile(file) {
  if (!DOCUMENT_TYPES.includes(file.type)) throw new Error('Solo se aceptan archivos PDF, JPG o PNG.');
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error('El archivo supera el máximo de 5 MB.');
}

// Base64 sin el prefijo `data:...;base64,`.
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
