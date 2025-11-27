import { useState, useEffect } from "react"
import { Mail, Settings, Users, GraduationCap, Edit, Calendar, Clock, MapPin, X, Loader } from "lucide-react"

import { db } from "../firebaseConfig"
import { doc, getDoc, setDoc, collection, getDocs, query } from "firebase/firestore" // Added collection, getDocs, query

// --- Helper Functions for Sorting and Status (Copied from ImportantDates logic) ---

const getStatusColorAndPriority = (dateString, timeString) => {
  const now = new Date();
  const startDate = new Date(dateString);
  startDate.setHours(0, 0, 0, 0);

  let color = "#4CAF50"; // Default: Green/Past
  let priority = 3; // Default: Lowest priority

  let endTime = null;
  if (timeString) {
    try {
      const parts = timeString.split("-");
      const endDateString = parts.length > 1 ? parts[1].trim() : timeString.trim(); 
      endTime = new Date(endDateString);
      endTime.setHours(23, 59, 59, 999);
    } catch (e) {
      endTime = null;
    }
  }

  // Logic to determine status
  if (endTime) {
    if (now >= startDate && now <= endTime) {
      color = "#F44336"; // Red: Ongoing (Current)
      priority = 1;
    } else if (now < startDate) {
      const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        color = "#F44336"; // Red: Urgent (Within 7 days)
        priority = 1;
      } else {
        color = "#FFC107"; // Yellow: Upcoming
        priority = 2;
      }
    } else {
      color = "#4CAF50"; // Green: Past/Completed
      priority = 3;
    }
  } else {
    // Single date logic
    const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      color = "#4CAF50"; // Green: Past/Completed
      priority = 3;
    } else if (diffDays === 0) {
      color = "#F44336"; // Red: Today/Urgent
      priority = 1;
    } else {
      if (diffDays <= 7) {
        color = "#F44336"; // Red: Urgent (Within 7 days)
        priority = 1;
      } else {
        color = "#FFC107"; // Yellow: Upcoming
        priority = 2;
      }
    }
  }

  return { 
    color: color === "#F44336" ? "red" : color === "#FFC107" ? "yellow" : "green", // Map hex to readable string
    priority 
  };
}

const getSortableDate = (dateString, timeString) => {
    if (!dateString) return new Date(0);
    
    let date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    if (timeString) {
      try {
        const parts = timeString.split("-");
        const endDateString = parts.length > 1 ? parts[1].trim() : timeString.trim(); 
        const endDate = new Date(endDateString);
        endDate.setHours(0, 0, 0, 0);
        return date;
      } catch (e) {
          return date;
      }
    }

    return date;
}

const sortDates = (a, b) => {
    const aStatus = getStatusColorAndPriority(a.date, a.time);
    const bStatus = getStatusColorAndPriority(b.date, b.time);

    // 1. Sort by Priority (Red:1, Yellow:2, Green:3) - Ascending (Urgent first)
    if (aStatus.priority !== bStatus.priority) {
        return aStatus.priority - bStatus.priority;
    }

    // 2. If priorities are the same, sort by Date - Ascending (Older date first)
    const aDate = getSortableDate(a.date, a.time);
    const bDate = getSortableDate(b.date, b.time);

    return aDate.getTime() - bDate.getTime();
}

const formatDateDisplay = (date, time) => {
  if (!date) return ""
  const dateObj = new Date(date)
  const options = { day: "numeric", month: "short", year: "numeric" }
  let formatted = dateObj.toLocaleDateString("en-US", options)

  if (time) {
    const timeObj = new Date(time)
    const timeFormatted = timeObj.toLocaleDateString("en-US", options)
    formatted = `${formatted} - ${timeFormatted}`
  }

  return formatted
}

// --- Reusable UI Components (unmodified) ---

const Button = ({ children, variant = "default", size = "default", onClick, disabled = false, className = "", ...props }) => {
  let baseClasses =
    "flex items-center gap-2 p-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap"
  let variantClasses = ""

  switch (variant) {
    case "destructive":
      variantClasses = "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      break
    case "outline":
      variantClasses = "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
      break
    default:
      variantClasses = "bg-[#13274f] text-white hover:bg-[#0f1f41] disabled:opacity-50"
  }

  if (size === "sm") {
    baseClasses = baseClasses.replace("p-3", "p-2").replace("text-sm", "text-xs")
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ value, onChange, placeholder, type = "text", className = "", ...props }) => {
  const inputClasses =
    "w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-[#13274f] box-border"
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${inputClasses} ${className}`}
      {...props}
    />
  )
}

const Label = ({ children, htmlFor, className = "" }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`}>
    {children}
  </label>
)

const Dialog = ({ open, children, onClose }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children, onClose }) => (
  <div className="flex justify-between items-center px-6 pt-6 border-b border-gray-200">
    <h3 className="text-xl font-semibold text-[#13274f] m-0 pb-3">{children}</h3>
    <X className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600" onClick={onClose} />
  </div>
)

const DialogFooter = ({ children }) => (
  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6 px-6 pb-6">{children}</div>
)

// --- Dashboard Component ---
const Dashboard = () => {
  const [targetDateMs, setTargetDateMs] = useState(null)
  const [showSetDateModal, setShowSetDateModal] = useState(false)
  const [dateInput, setDateInput] = useState("")
  const [timeInput, setTimeInput] = useState("00:00")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // New state for dynamic deadlines
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [isDeadlinesLoading, setIsDeadlinesLoading] = useState(true);

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

  const COUNTDOWN_DOC_REF = doc(db, "settings", "countdown")
  const DEADLINE_COLLECTION_REF = collection(db, "importantDates"); // Reference to "importantDates"

  // Function to fetch and process deadlines
  const fetchUpcomingDeadlines = async () => {
      setIsDeadlinesLoading(true);
      try {
          const querySnapshot = await getDocs(DEADLINE_COLLECTION_REF);
          
          const rawDates = querySnapshot.docs.map(doc => ({
              id: doc.id,
              title: doc.data().title || "Untitled Event",
              date: doc.data().date || "", // This is the start date
              time: doc.data().time || "", // This is the end date/range
              location: doc.data().location || "N/A",
          }));

          const filteredAndProcessedDeadlines = rawDates
              .map(dateItem => {
                  const { color, priority } = getStatusColorAndPriority(dateItem.date, dateItem.time);
                  return {
                      ...dateItem,
                      color,
                      priority,
                      displayDate: formatDateDisplay(dateItem.date, dateItem.time), // Use existing formatter
                  };
              })
              // Filter: Only include Red (Urgent) or Yellow (Upcoming) events
              .filter(item => item.color === "red" || item.color === "yellow");
              
          // Sort: Red first, then Yellow, then by date (using the sortDates helper)
          filteredAndProcessedDeadlines.sort(sortDates); 

          setUpcomingDeadlines(filteredAndProcessedDeadlines);

      } catch (error) {
          console.error("Error fetching upcoming deadlines:", error);
      } finally {
          setIsDeadlinesLoading(false);
      }
  };

  const fetchTargetDate = async () => {
    setIsLoading(true)
    try {
      const docSnap = await getDoc(COUNTDOWN_DOC_REF)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const ms = data.targetDateMs
        if (ms && ms > new Date().getTime()) {
          setTargetDateMs(ms)
          const dateObj = new Date(ms)
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, "0")
          const day = String(dateObj.getDate()).padStart(2, "0")
          setDateInput(`${year}-${month}-${day}`)
          setTimeInput(dateObj.toTimeString().substring(0, 5))
        } else {
          setTargetDateMs(null)
        }
      }
    } catch (error) {
      console.error("Error fetching countdown target date:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTargetDate();
    fetchUpcomingDeadlines(); // Fetch deadlines on mount
  }, [])

  const splitNumber = (number) => ({
    tens: Math.floor(number / 10),
    units: number % 10,
  })

  useEffect(() => {
    if (!targetDateMs) return
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDateMs - now
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        setCountdown({
          daysTens: splitNumber(days).tens,
          daysUnits: splitNumber(days).units,
          hoursTens: splitNumber(hours).tens,
          hoursUnits: splitNumber(hours).units,
          minutesTens: splitNumber(minutes).tens,
          minutesUnits: splitNumber(minutes).units,
          secondsTens: splitNumber(seconds).tens,
          secondsUnits: splitNumber(seconds).units,
        })
      } else {
        clearInterval(timer)
        setTargetDateMs(null)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDateMs])

  const handleSaveTargetDate = async () => {
    if (!dateInput) return alert("Please select a date.")
    const dateTimeString = `${dateInput}T${timeInput}`
    const newTargetDate = new Date(dateTimeString)
    const newTargetDateMs = newTargetDate.getTime()
    if (isNaN(newTargetDateMs)) return alert("Invalid date or time.")
    if (newTargetDateMs < new Date().getTime()) return alert("Target date must be in the future.")
    setIsSaving(true)
    try {
      await setDoc(COUNTDOWN_DOC_REF, {
        targetDateMs: newTargetDateMs,
        targetDateTime: dateTimeString,
      })
      setTargetDateMs(newTargetDateMs)
      setShowSetDateModal(false)
    } catch (error) {
      console.error("Error saving countdown target date:", error)
      alert("Failed to save target date. Please check the console.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCountdown = async () => {
    if (!window.confirm("Are you sure you want to clear the countdown?")) return
    setIsSaving(true)
    try {
      // Clear Firestore document
      await setDoc(COUNTDOWN_DOC_REF, {
        targetDateMs: null,
        targetDateTime: null,
      })

      // Reset states
      setTargetDateMs(null)
      setCountdown({
        daysTens: 0,
        daysUnits: 0,
        hoursTens: 0,
        hoursUnits: 0,
        minutesTens: 0,
        minutesUnits: 0,
        secondsTens: 0,
        secondsUnits: 0,
      })
      alert("Countdown cleared successfully.")
    } catch (error) {
      console.error("Error clearing countdown:", error)
      alert("Failed to clear countdown. Please check the console.")
    } finally {
      setIsSaving(false)
    }
  }


  const stats = [
    { title: "User Register", current: 1256, total: 1430, icon: Users, color: "violet" },
    { title: "Ceremony Attendance", current: 1250, total: 6, icon: GraduationCap, color: "blue" },
    { title: "Gown Confirmation", current: 1256, total: 0, icon: GraduationCap, color: "gray" },
    { title: "Rehearsal Attendance", current: 365, total: 891, icon: Users, color: "gray" },
  ]

  // Removed hardcoded upcomingDeadlines array

  const getColorClasses = (color) => {
    switch (color) {
      case "violet":
        return { bg: "bg-violet-100", text: "text-violet-600", border: "border-violet-500" }
      case "blue":
        return { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-500" }
      case "red":
        // Using red-600 for border to match your current design logic
        return { bg: "bg-red-100", text: "text-red-600", border: "border-red-600" } 
      case "yellow":
        return { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-yellow-600" }
      default:
        return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-500" }
    }
  }

  const chartData = [
    { value: 45, color: "bg-gray-400" },
    { value: 75, color: "bg-[#13274f]" },
    { value: 60, color: "bg-gray-400" },
    { value: 55, color: "bg-[#13274f]" },
    { value: 70, color: "bg-gray-400" },
    { value: 65, color: "bg-[#13274f]" },
    { value: 80, color: "bg-gray-400" },
  ]

  const Digit = ({ value }) => (
    <div className="w-12 sm:w-14 h-16 sm:h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-xl sm:text-2xl font-bold shadow-md">
      {value}
    </div>
  )

  const TimeSegment = ({ tens, units, label }) => (
    <div className="flex flex-col items-center">
      <div className="flex gap-1.5 sm:gap-2">
        <Digit value={tens} />
        <Digit value={units} />
      </div>
      <p className="mt-2 text-sm text-gray-600 font-medium">{label}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {(isLoading || isDeadlinesLoading) && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-[2000]">
          <div className="flex flex-col items-center justify-center p-10">
            <Loader className="w-8 h-8 text-gray-500 animate-spin" />
            <p className="text-gray-500 mt-3 text-sm">Loading data...</p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#13274f]">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
            <Settings className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const { bg, text } = getColorClasses(stat.color)
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow border border-gray-100 min-w-0"
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${bg} ${text}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {stat.current} / {stat.total}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Countdown & Chart */}
          <div className="lg:col-span-2 space-y-8">
            {/* Countdown */}
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {targetDateMs ? "Time Until Event" : "Set Your Countdown Target"}
                </h2>
                <Edit
                  className="w-5 h-5 text-gray-500 ml-auto cursor-pointer hover:text-[#13274f]"
                  onClick={() => setShowSetDateModal(true)}
                />
              </div>

              <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6 lg:gap-8">
                <TimeSegment tens={countdown.daysTens} units={countdown.daysUnits} label="Days" />
                <span className="text-3xl text-gray-700 font-bold">:</span>
                <TimeSegment tens={countdown.hoursTens} units={countdown.hoursUnits} label="Hours" />
                <span className="text-3xl text-gray-700 font-bold">:</span>
                <TimeSegment tens={countdown.minutesTens} units={countdown.minutesUnits} label="Minutes" />
                <span className="text-3xl text-gray-700 font-bold">:</span>
                <TimeSegment tens={countdown.secondsTens} units={countdown.secondsUnits} label="Seconds" />
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Statistics</h2>
              <div className="flex items-end gap-3 sm:gap-4 h-64 border-b border-l border-gray-300 pl-2 pb-2">
                {chartData.map((bar, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-md shadow-md transition-all duration-500 hover:scale-105 ${bar.color}`}
                    style={{ height: `${bar.value}%` }}
                    title={`Metric ${i + 1}: ${bar.value}%`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines (Dynamically Populated) */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Deadlines</h2>
              {/* Added logic to re-fetch/refresh deadlines on edit click */}
              <Edit 
                className="w-5 h-5 text-gray-500 ml-auto cursor-pointer hover:text-[#13274f]" 
                onClick={fetchUpcomingDeadlines}
                title="Refresh Deadlines"
              />
            </div>
            <div className="flex flex-col gap-4">
              {isDeadlinesLoading ? (
                <div className="text-center py-4 text-gray-500">
                    <Loader className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Fetching deadlines...</p>
                </div>
              ) : upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => {
                  const { border } = getColorClasses(deadline.color) // Uses dynamic color: red or yellow
                  return (
                    <div
                      key={deadline.id}
                      className={`p-4 bg-gray-50 border-l-4 rounded-lg shadow-sm transition-shadow duration-200 hover:shadow-md ${border}`}
                    >
                      <h3 className="text-sm font-semibold text-gray-800">{deadline.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" /> <span>{deadline.displayDate}</span>
                      </div>
                      {/* You don't have a separate time field in the 'importantDates' data, 
                          but you have it in the display, so I'll render the timeSlot 
                          if you plan to use it from the location/description. 
                          Using location as the secondary detail for simplicity.
                      */}
                      {deadline.time && ( // Renders time if available (based on data structure in previous component)
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" /> <span>{deadline.time}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{" "}
                        <span className="break-words">{deadline.location}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No urgent or upcoming deadlines found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal (Unmodified) */}
      <Dialog open={showSetDateModal} onClose={() => setShowSetDateModal(false)}>
        <DialogHeader onClose={() => setShowSetDateModal(false)}>Set Countdown Target</DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleClearCountdown}
            disabled={isSaving || !targetDateMs}
          >
            Clear Countdown
          </Button>

          <Button variant="outline" onClick={() => setShowSetDateModal(false)}>
            Cancel
          </Button>

          <Button onClick={handleSaveTargetDate} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default Dashboard