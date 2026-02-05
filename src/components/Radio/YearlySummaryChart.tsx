import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { YearlyScrapSummary } from '../../types/radio';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface YearlySummaryChartProps {
    data: YearlyScrapSummary | null;
    loading: boolean;
}

const YearlySummaryChart: React.FC<YearlySummaryChartProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[400px] flex items-center justify-center text-gray-500">
                No data available
            </div>
        );
    }

    const chartData = {
        labels: [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ],
        datasets: [
            {
                label: 'Trunking',
                data: data.trunking.monthly,
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
            {
                label: 'Conventional',
                data: data.conventional.monthly,
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Scrap Summary ${data.year}`,
                font: {
                    size: 16,
                    weight: 'bold' as const
                }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-[350px]">
                <Bar options={options} data={chartData} />
            </div>
            <div className="flex justify-center gap-8 mt-4 pt-4 border-t">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Total Trunking</p>
                    <p className="text-xl font-bold text-blue-600">{data.trunking.total}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Total Conventional</p>
                    <p className="text-xl font-bold text-emerald-600">{data.conventional.total}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Grand Total</p>
                    <p className="text-xl font-bold text-gray-900">{data.grandTotal}</p>
                </div>
            </div>
        </div>
    );
};

export default YearlySummaryChart;
