import React from 'react';
import styles from '../StyleSheetWeb/dashboard.styles.js';

const Dashboard = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Admin Dashboard</h1>
      <div style={styles.card}>
        <h2>Total Attendees</h2>
        <p>1240</p>
      </div>
      <div style={styles.card}>
        <h2>Pending Approvals</h2>
        <p>23</p>
      </div>
    </div>
  );
};

export default Dashboard;