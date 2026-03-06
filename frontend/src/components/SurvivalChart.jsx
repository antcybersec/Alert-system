import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const SurvivalChart = ({ data }) => {
    // Map input array to data objects with colors (matching previous design)
    // Default: [Resolved, Pending, In Progress]
    const chartData = [
        { name: 'Resolved', value: data?.[0] || 12, color: '#4bc0c0' }, // Teal
        { name: 'Pending', value: data?.[1] || 19, color: '#ff6384' },  // Red/Pink
        { name: 'In Progress', value: data?.[2] || 3, color: '#36a2eb' } // Blue
    ];

    return (
        <div className="w-full h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60} // Creates the "Doughnut" effect
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SurvivalChart;
