import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns"
import type { ChartData } from "~/components/admin/chart"

/**
 * Get the date range for metrics (last 30 days)
 * @returns Object with today, startDate, and formatted dateRange array
 */
export const getMetricDateRange = () => {
  const today = new Date()
  const startDate = startOfDay(subDays(today, 29))
  const dateRange = [format(startDate, "yyyy-MM-dd"), format(today, "yyyy-MM-dd")]

  return { today, startDate, dateRange }
}

/**
 * Fill in missing dates with zero values
 * @param dataByDate - Record of date strings to values
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of ChartData with all dates filled in
 */
export const fillMissingDates = (
  dataByDate: Record<string, number>,
  startDate: Date,
  endDate: Date,
): ChartData[] => {
  return eachDayOfInterval({ start: startOfDay(startDate), end: endDate }).map(day => ({
    date: format(day, "yyyy-MM-dd"),
    value: dataByDate[format(day, "yyyy-MM-dd")] || 0,
  }))
}

/**
 * Calculate total and average from chart data
 * @param results - Array of ChartData
 * @returns Object with total and average values
 */
export const calculateMetricStats = (results: ChartData[]) => {
  const total = results.reduce((sum, day) => sum + day.value, 0)
  const average = results.length > 0 ? total / results.length : 0

  return { total, average }
}
