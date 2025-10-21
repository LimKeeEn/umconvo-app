const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f9fafb",
    },
    mainContent: {
      padding: "24px",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "32px",
    },
    pageTitle: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#13274f",
      margin: 0,
    },
    headerIcons: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    headerIcon: {
      width: "24px",
      height: "24px",
      color: "#6b7280",
      cursor: "pointer",
      transition: "color 0.2s",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "10px",
      marginBottom: "32px",
    },
    statCard: {
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      width: "270px",
    },
    statIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    statContent: {
      flex: 1,
    },
    statTitle: {
      fontSize: "14px",
      color: "#6b7280",
      margin: "0 0 4px 0",
      fontWeight: "500",
    },
    statNumbers: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#1f2937",
      margin: 0,
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "32px",
    },
    section: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1f2937",
    },
    countdownContainer: {
      marginBottom: '32px'
    },
    countdownBox: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingleft: "16px",
      paddingRight: "16px"
    },
    countdownNumberRow: {
      display: "flex",
      gap: "8px", // Space between the two number containers
    },
    countdownNumberContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "80px",
      backgroundColor: "#333",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "1.8rem",
      fontWeight: "bold",
    },
    countdownLabel: {
      fontSize: "0.9rem",
      color: "#333",
      marginTop: "8px",
    },
    countdownGrid: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px", // Adjusts spacing between countdownBox elements
    },
    countdownSeparator: {
      fontSize: "2rem",
      color: "#333",
    },
    editIcon: {
      width: "20px",
      height: "20px",
      color: "#6b7280",
      cursor: "pointer",
      marginLeft: "auto",
    },
    chartContainer: {
      height: "300px",
      display: "flex",
      alignItems: "end",
      gap: "16px",
      padding: "20px 0",
    },
    chartBar: {
      flex: 1,
      borderRadius: "4px 4px 0 0",
      minHeight: "20px",
      transition: "all 0.3s ease",
    },
    deadlinesList: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    deadlineItem: {
      padding: "16px",
      borderRadius: "8px",
      backgroundColor: "#f9fafb",
      borderLeft: "4px solid",
      position: "relative",
    },
    deadlineTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1f2937",
      margin: "0 0 8px 0",
      lineHeight: "1.4",
    },
    deadlineDate: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      color: "#6b7280",
      margin: "4px 0",
    },
    deadlineLocation: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      color: "#6b7280",
      margin: "4px 0",
    },
    deadlineIcon: {
      width: "12px",
      height: "12px",
    },
  }

export default styles;