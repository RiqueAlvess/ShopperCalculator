import { useState, useEffect, useCallback } from 'react'
import { getAllSettings, saveSetting } from '../lib/db'

const DEFAULTS = {
  gasPrice: 3.50,
  mpg: 30,
  maintenanceCost: 150,
  maintenanceFreqMonths: 3,
  dailyGoal: 150,
  weeklyGoal: 900,
  monthlyGoal: 3600,
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAllSettings().then((saved) => {
      setSettings((prev) => ({ ...prev, ...saved }))
      setLoaded(true)
    })
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    const parsed = isNaN(Number(value)) ? value : Number(value)
    await saveSetting(key, parsed)
    setSettings((prev) => ({ ...prev, [key]: parsed }))
  }, [])

  const costPerMile = settings.gasPrice / settings.mpg

  return { settings, updateSetting, costPerMile, loaded }
}
