import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111827',
      titleFont: { family: 'DM Sans', size: 12 },
      bodyFont: { family: 'DM Sans', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9CA3AF' },
    },
    y: {
      grid: { color: '#F3F4F6' },
      ticks: { font: { family: 'DM Sans', size: 11 }, color: '#9CA3AF' },
      border: { display: false },
    },
  },
};
