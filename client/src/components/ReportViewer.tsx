// src/components/ReportViewer.js
import React from 'react';
import { ReportData } from '../types';

interface ReportDataProps {
  reportData: ReportData | null
}

const ReportViewer: React.FC<ReportDataProps> = ({ reportData }): JSX.Element => {
  if (!reportData) return <p>No report data available</p>;
  console.log("Report Data: ", reportData);
  return (
    <div style={{ padding: '20px' }}>
      <h1>npChatbot Final Report</h1>
      <div className="report-section">
        <h2>Report Summary</h2>
        <p>{reportData.dj_name || 'Summary not available'}</p>
      </div>
      {/* Add more sections with styled data from the report */}
    </div>
  );
};

export default ReportViewer;
