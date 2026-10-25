import React, { useEffect, useState } from 'react';
import { usersService } from '../api';
import { cleanDNI } from '../utils/formatters';

/**
 * Dropdown de socios registrados. Un usuario nunca se tipea a mano: se elige del padrón
 * para que el dato (recibo, factura, inscripción, turno) quede vinculado al socio por su DNI.
 *
 * `value` es el DNI del socio elegido; `onSelect(member)` recibe { id, name, dni, memberNumber } o null.
 * `excludeDnis` oculta socios ya usados en el mismo formulario (por ejemplo, el propio jugador al elegir pareja).
 */
export default function MemberSelect({ value, onSelect, excludeDnis = [], placeholder = 'Seleccionar socio', required = true, className }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    usersService.getMembers().then(res => setMembers(res.data || []));
  }, []);

  const sameDni = (a, b) => cleanDNI(a) && cleanDNI(a) === cleanDNI(b);
  const selected = members.find(m => sameDni(m.dni, value));
  const excluded = excludeDnis.map(cleanDNI).filter(Boolean);
  const options = members.filter(m => m === selected || !excluded.includes(cleanDNI(m.dni)));

  return (
    <select
      required={required}
      value={selected?.id ?? ''}
      onChange={(e) => onSelect(members.find(m => String(m.id) === e.target.value) || null)}
      className={className || 'w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-tennis-600 bg-white'}
    >
      <option value="">{placeholder}</option>
      {options.map(m => (
        <option key={m.id} value={m.id}>{m.name} • DNI {m.dni}</option>
      ))}
    </select>
  );
}
