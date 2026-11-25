import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export default function OrganizationAnalyticsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#eaedff" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#777587', fontSize: 12 }} />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#777587', fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="pending" name="Menunggu" stackId="applications" fill="#f59e0b" />
        <Bar dataKey="accepted" name="Diterima" stackId="applications" fill="#10b981" />
        <Bar dataKey="rejected" name="Ditolak" stackId="applications" fill="#e87979" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
