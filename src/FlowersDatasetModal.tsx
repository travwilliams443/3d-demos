import { Modal } from "./components/Modal";
import { Bar, Pie, Scatter } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, BarElement, ArcElement } from "chart.js";
import type { ScatterDataPoint } from "chart.js";
import { useMemo } from "react";

Chart.register(CategoryScale, LinearScale, PointElement, BarElement, ArcElement);

interface FlowersDatasetModalProps {
  onClose: () => void;
}

export default function FlowersDatasetModal({ onClose }: FlowersDatasetModalProps) {
  // Mock counts for Kaggle Flowers dataset classes
  const classes = useMemo(() => ["daisy", "dandelion", "rose", "sunflower", "tulip"], []);
  const counts = [769, 1052, 784, 734, 984];

  const scatterData = useMemo(() => {
    // generate random feature pairs for each class
    const points: ScatterDataPoint[] = [];
    classes.forEach((_, idx) => {
      for (let i = 0; i < 20; i++) {
        points.push({
          x: Math.random() * 5 + idx * 1.5,
          y: Math.random() * 5 + idx,
        });
      }
    });
    return {
      datasets: [
        {
          label: "Random feature scatter",
          data: points,
          backgroundColor: "rgba(99, 102, 241, 0.6)",
        },
      ],
    };
  }, [classes]);

  return (
    <Modal onClose={onClose} width={700} height={600}>
      <h2 className="text-lg font-bold mb-4">Flowers Dataset</h2>
      <div className="grid grid-cols-2 gap-4" style={{height: '90%'}}>
        <Bar
          data={{
            labels: classes,
            datasets: [
              {
                label: 'Image count',
                data: counts,
                backgroundColor: [
                  '#f87171',
                  '#fbbf24',
                  '#34d399',
                  '#60a5fa',
                  '#a78bfa',
                ],
              },
            ],
          }}
          options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }}
        />
        <Pie
          data={{
            labels: classes,
            datasets: [
              {
                data: counts,
                backgroundColor: [
                  '#f87171',
                  '#fbbf24',
                  '#34d399',
                  '#60a5fa',
                  '#a78bfa',
                ],
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
        <Scatter
          data={scatterData}
          options={{ scales: { x: { beginAtZero: true }, y: { beginAtZero: true } }, responsive: true, maintainAspectRatio: false }}
        />
      </div>
    </Modal>
  );
}
