"use client"

import { useState, useEffect } from "react"
import { Mail, Settings, Calendar, MapPin, Users, GraduationCap, Clock, Edit } from "lucide-react"
import styles from '../StyleSheetWeb/dashboard.styles.js';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [countdown, setCountdown] = useState({
    daysTens: 0,
    daysUnits: 0,
    hoursTens: 0,
    hoursUnits: 0,
    minutesTens: 0,
    minutesUnits: 0,
    secondsTens: 0,
    secondsUnits: 0,
  })

  // Helper to split numbers into tens and units
  const splitNumber = (number) => ({
    tens: Math.floor(number / 10),
    units: number % 10,
  });

  // Sample data - replace with your actual data source
  const stats = [
    {
      title: "User Register",
      current: 1256,
      total: 1430,
      icon: Users,
      color: "#8b5cf6",
    },
    {
      title: "Ceremony Attendance",
      current: 1250,
      total: 6,
      icon: GraduationCap,
      color: "#3b82f6",
    },
    {
      title: "Gown Confirmation",
      current: 1256,
      total: 0,
      icon: GraduationCap,
      color: "#1f2937",
    },
    {
      title: "Rehearsal Attendance",
      current: 365,
      total: 891,
      icon: Users,
      color: "#1f2937",
    },
  ]

  const upcomingDeadlines = [
    {
      id: 1,
      title: "Attendance Confirmation by UM Graduates",
      date: "1 Nov - 17 Nov 2024",
      location: "Confirmation Tab",
      color: "#ef4444",
    },
    {
      id: 2,
      title: "Collection of Academic Attire (Gown)",
      date: "16 - 17 Nov 2024",
      time: "9:00am - 6:00pm",
      location: "Experimental Building, UM / UMConvo Cyberjaya Campus, UM",
      color: "#f59e0b",
    },
    {
      id: 3,
      title: "Collection of Academic Attire (Gown)",
      date: "28 Nov 2024",
      time: "2:30pm - 4:30pm",
      location: "Dewan Tunku Canselor, UM",
      color: "#f59e0b",
    },
  ]

  const chartData = [
    { value: 45, color: "#e5e7eb" },
    { value: 75, color: "#1e40af" },
    { value: 60, color: "#e5e7eb" },
    { value: 55, color: "#1e40af" },
    { value: 70, color: "#e5e7eb" },
    { value: 65, color: "#1e40af" },
    { value: 80, color: "#e5e7eb" },
  ]

  // Update countdown timer
  useEffect(() => {
    const targetDate = new Date("2024-12-01T00:00:00") // Set your target date

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({
          daysTens: splitNumber(days).tens,
          daysUnits: splitNumber(days).units,
          hoursTens: splitNumber(hours).tens,
          hoursUnits: splitNumber(hours).units,
          minutesTens: splitNumber(minutes).tens,
          minutesUnits: splitNumber(minutes).units,
          secondsTens: splitNumber(seconds).tens,
          secondsUnits: splitNumber(seconds).units,
        });
      } else {
        setCountdown({
          daysTens: 0,
          daysUnits: 0,
          hoursTens: 0,
          hoursUnits: 0,
          minutesTens: 0,
          minutesUnits: 0,
          secondsTens: 0,
          secondsUnits: 0,
        });
      }
    }, 1000);

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={styles.container}>
      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <div style={styles.headerIcons}>
            <Mail style={styles.headerIcon} />
            <Settings style={styles.headerIcon} />
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  backgroundColor: `${stat.color}20`,
                  color: stat.color,
                }}
              >
                <stat.icon size={24} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statTitle}>{stat.title}</p>
                <p style={styles.statNumbers}>
                  {stat.current} / {stat.total}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.contentGrid}>
          <div>
            {/* Countdown Section */}
            <div style={styles.countdownContainer}>
            <div style={styles.section}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={styles.sectionTitle}>Countdown</h2>
                <Edit style={styles.editIcon} />
              </div>
              <div style={styles.countdownGrid}>
                {/* Days */}
                <div style={styles.countdownBox}>
                  <div style={styles.countdownNumberRow}>
                    <div style={styles.countdownNumberContainer}>{countdown.daysTens}</div>
                    <div style={styles.countdownNumberContainer}>{countdown.daysUnits}</div>
                  </div>
                  <p style={styles.countdownLabel}>Days</p>
                </div>
                {/* Separator */}
                <div style={styles.countdownSeparator}>:</div>
                {/* Hours */}
                <div style={styles.countdownBox}>
                  <div style={styles.countdownNumberRow}>
                    <div style={styles.countdownNumberContainer}>{countdown.hoursTens}</div>
                    <div style={styles.countdownNumberContainer}>{countdown.hoursUnits}</div>
                  </div>
                  <p style={styles.countdownLabel}>Hours</p>
                </div>
                {/* Separator */}
                <div style={styles.countdownSeparator}>:</div>
                {/* Minutes */}
                <div style={styles.countdownBox}>
                  <div style={styles.countdownNumberRow}>
                    <div style={styles.countdownNumberContainer}>{countdown.minutesTens}</div>
                    <div style={styles.countdownNumberContainer}>{countdown.minutesUnits}</div>
                  </div>
                  <p style={styles.countdownLabel}>Minutes</p>
                </div>
                {/* Separator */}
                <div style={styles.countdownSeparator}>:</div>
                {/* Seconds */}
                <div style={styles.countdownBox}>
                  <div style={styles.countdownNumberRow}>
                    <div style={styles.countdownNumberContainer}>{countdown.secondsTens}</div>
                    <div style={styles.countdownNumberContainer}>{countdown.secondsUnits}</div>
                  </div>
                  <p style={styles.countdownLabel}>Seconds</p>
                </div>
              </div>
            </div>
          </div>

            {/* Statistics Chart */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Statistics</h2>
              <div style={styles.chartContainer}>
                {chartData.map((bar, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.chartBar,
                      height: `${bar.value}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div style={styles.section}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={styles.sectionTitle}>Upcoming Deadlines</h2>
              <Edit style={styles.editIcon} />
            </div>
            <div style={styles.deadlinesList}>
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  style={{
                    ...styles.deadlineItem,
                    borderLeftColor: deadline.color,
                  }}
                >
                  <h3 style={styles.deadlineTitle}>{deadline.title}</h3>
                  <div style={styles.deadlineDate}>
                    <Calendar style={styles.deadlineIcon} />
                    <span>{deadline.date}</span>
                  </div>
                  {deadline.time && (
                    <div style={styles.deadlineDate}>
                      <Clock style={styles.deadlineIcon} />
                      <span>{deadline.time}</span>
                    </div>
                  )}
                  <div style={styles.deadlineLocation}>
                    <MapPin style={styles.deadlineIcon} />
                    <span>{deadline.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
