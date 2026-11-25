import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export default function OrganizationEventChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 14, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#e2e7ff" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#777587', fontSize: 10 }} />
        <YAxis type="category" dataKey="label" width={118} axisLine={false} tickLine={false} tick={{ fill: '#464555', fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="applications" name="Pendaftar" fill="#4f46e5" radius={[0, 5, 5, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
