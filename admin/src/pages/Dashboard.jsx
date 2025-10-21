"use client"

import { useState, useEffect } from "react"
import { Mail, Settings, Calendar, MapPin, Users, GraduationCap, Clock, Edit } from "lucide-react"

const Dashboard = () => {
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

  const splitNumber = (number) => ({
    tens: Math.floor(number / 10),
    units: number % 10,
  });

  useEffect(() => {
    const targetDate = new Date("2024-12-01T00:00:00")
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

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
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const stats = [
    { title: "User Register", current: 1256, total: 1430, icon: Users, color: "violet" },
    { title: "Ceremony Attendance", current: 1250, total: 6, icon: GraduationCap, color: "blue" },
    { title: "Gown Confirmation", current: 1256, total: 0, icon: GraduationCap, color: "gray" },
    { title: "Rehearsal Attendance", current: 365, total: 891, icon: Users, color: "gray" },
  ]

  const upcomingDeadlines = [
    {
      id: 1,
      title: "Attendance Confirmation by UM Graduates",
      date: "1 Nov - 17 Nov 2024",
      location: "Confirmation Tab",
      color: "red",
    },
    {
      id: 2,
      title: "Collection of Academic Attire (Gown)",
      date: "16 - 17 Nov 2024",
      time: "9:00am - 6:00pm",
      location: "Experimental Building, UM / UMConvo Cyberjaya Campus, UM",
      color: "yellow",
    },
    {
      id: 3,
      title: "Collection of Academic Attire (Gown)",
      date: "28 Nov 2024",
      time: "2:30pm - 4:30pm",
      location: "Dewan Tunku Canselor, UM",
      color: "yellow",
    },
  ]

  const chartData = [
    { value: 45, color: "bg-gray-200" },
    { value: 75, color: "bg-blue-900" },
    { value: 60, color: "bg-gray-200" },
    { value: 55, color: "bg-blue-900" },
    { value: 70, color: "bg-gray-200" },
    { value: 65, color: "bg-blue-900" },
    { value: 80, color: "bg-gray-200" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#13274f]">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
            <Settings className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-4 p-6 bg-white rounded-xl shadow w-[270px]">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-lg bg-${stat.color}-100 text-${stat.color}-500`}
              >
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stat.current} / {stat.total}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side */}
          <div className="col-span-2 space-y-8">
            {/* Countdown */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Countdown</h2>
                <Edit className="w-5 h-5 text-gray-500 ml-auto cursor-pointer" />
              </div>
              <div className="flex items-center justify-center gap-4">
                {/* Days */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-2">
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.daysTens}
                    </div>
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.daysUnits}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Days</p>
                </div>
                <span className="text-2xl text-gray-700">:</span>
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-2">
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.hoursTens}
                    </div>
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.hoursUnits}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Hours</p>
                </div>
                <span className="text-2xl text-gray-700">:</span>
                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-2">
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.minutesTens}
                    </div>
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.minutesUnits}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Minutes</p>
                </div>
                <span className="text-2xl text-gray-700">:</span>
                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-2">
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.secondsTens}
                    </div>
                    <div className="w-14 h-20 flex items-center justify-center bg-gray-800 text-white rounded-lg text-2xl font-bold">
                      {countdown.secondsUnits}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Seconds</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
              <div className="flex items-end gap-4 h-72">
                {chartData.map((bar, i) => (
                  <div key={i} className={`flex-1 rounded-t ${bar.color}`} style={{ height: `${bar.value}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side (Deadlines) */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Deadlines</h2>
              <Edit className="w-5 h-5 text-gray-500 ml-auto cursor-pointer" />
            </div>
            <div className="flex flex-col gap-4">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`p-4 bg-gray-50 border-l-4 rounded border-${deadline.color}-500`}
                >
                  <h3 className="text-sm font-semibold text-gray-800">{deadline.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" /> <span>{deadline.date}</span>
                  </div>
                  {deadline.time && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" /> <span>{deadline.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" /> <span>{deadline.location}</span>
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
