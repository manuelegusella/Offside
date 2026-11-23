// src/charts.jsx
// I grafici dell'andamento (dolore, feeling, rigidità). Stanno in un file a parte perché la
// libreria dei grafici (Recharts) è pesante: così si carica solo quando serve un grafico
// (Premium, schermata dell'andamento) e l'app si apre più in fretta. Vedi LazyTrendChart in App.jsx.

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

// Stessi colori dell'app (App.jsx: LED_GREEN, colors.red, colors.orange, colors.mutedInk).
export const CHART_COLORS = { green: '#7DFFA8', red: '#FF6B5E', orange: '#FFB25C', muted: '#9DB3A7' };

const tooltipStyle = {
  contentStyle: { background: '#0C1A14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#ECF5EF' },
  labelStyle: { color: '#9DB3A7' },
  itemStyle: { color: '#ECF5EF' },
};

// Linea dell'andamento giorno per giorno.
// dataKey: 'feeling' | 'stiffness' | 'pain'. formatter: etichette dell'asse e del tooltip.
// zones: le tre fasce del semaforo del dolore (verde 0-3, giallo 4-5, rosso 6-10).
export function TrendChart({
  data, dataKey, color = CHART_COLORS.green, height = 180, domain = [1, 3], ticks = [1, 2, 3],
  formatter, tooltipFormatter, yWidth = 70, compact = false, zones = false, animationDuration = 900,
}) {
  const tick = { fontSize: compact ? 10 : 11, fill: CHART_COLORS.muted };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: compact ? 5 : 10, left: 0, bottom: 5 }}>
        {zones && <ReferenceArea y1={0} y2={3.5} fill={CHART_COLORS.green} fillOpacity={0.07} stroke="none" />}
        {zones && <ReferenceArea y1={3.5} y2={5.5} fill={CHART_COLORS.orange} fillOpacity={0.1} stroke="none" />}
        {zones && <ReferenceArea y1={5.5} y2={10} fill={CHART_COLORS.red} fillOpacity={0.1} stroke="none" />}
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="date" tick={tick} stroke="rgba(255,255,255,0.15)" />
        <YAxis domain={domain} ticks={ticks} tickFormatter={formatter} tick={tick} width={yWidth} stroke="rgba(255,255,255,0.15)" />
        <Tooltip formatter={tooltipFormatter || formatter} isAnimationActive={false} {...tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: compact ? 3 : 4, fill: color }} connectNulls animationDuration={animationDuration} animationEasing="ease-out" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Dolore da 0 a 10 con le fasce del semaforo sullo sfondo.
export function PainChart({ data, isEN, height = 180 }) {
  return (
    <TrendChart
      data={data}
      dataKey="pain"
      color={CHART_COLORS.red}
      height={height}
      domain={[0, 10]}
      ticks={[0, 2, 4, 6, 8, 10]}
      yWidth={34}
      zones
      tooltipFormatter={(v) => [v, isEN ? 'Pain' : 'Dolore']}
    />
  );
}
