const DB_NAME = 'gigcalc-db'
const DB_VERSION = 1

let dbInstance = null

export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('rides')) {
        const store = db.createObjectStore('rides', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('date', 'date', { unique: false })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }

    req.onsuccess = (e) => {
      dbInstance = e.target.result
      resolve(dbInstance)
    }

    req.onerror = () => reject(req.error)
  })
}

export async function saveRide(ride) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rides', 'readwrite')
    const req = tx.objectStore('rides').add(ride)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getRidesByDate(dateStr) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rides', 'readonly')
    const idx = tx.objectStore('rides').index('date')
    const req = idx.getAll(dateStr)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getRidesInRange(startDate, endDate) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rides', 'readonly')
    const store = tx.objectStore('rides').index('date')
    const range = IDBKeyRange.bound(startDate, endDate)
    const req = store.getAll(range)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getSetting(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly')
    const req = tx.objectStore('settings').get(key)
    req.onsuccess = () => resolve(req.result?.value ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function saveSetting(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite')
    const req = tx.objectStore('settings').put({ key, value })
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getAllSettings() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly')
    const req = tx.objectStore('settings').getAll()
    req.onsuccess = () => {
      const map = {}
      req.result.forEach(({ key, value }) => { map[key] = value })
      resolve(map)
    }
    req.onerror = () => reject(req.error)
  })
}
