import stockMovementsData from "@/services/mockData/stockMovements.json"

let stockMovements = [...stockMovementsData]

const delay = () => new Promise(resolve => setTimeout(resolve, 250))

export const stockMovementService = {
  async getAll() {
    await delay()
    return [...stockMovements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  },

  async getById(id) {
    await delay()
    const movement = stockMovements.find(sm => sm.Id === parseInt(id))
    return movement ? { ...movement } : null
  },

  async create(movement) {
    await delay()
    const newId = Math.max(...stockMovements.map(sm => sm.Id), 0) + 1
    const newMovement = {
      ...movement,
      Id: newId,
      timestamp: new Date().toISOString(),
      userId: "admin"
    }
    stockMovements.push(newMovement)
    return { ...newMovement }
  },

  async getByProductId(productId) {
    await delay()
    return stockMovements
      .filter(sm => sm.productId === parseInt(productId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(sm => ({ ...sm }))
  },

  async getRecentMovements(limit = 10) {
    await delay()
    return [...stockMovements]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  },

  async delete(id) {
    await delay()
    const index = stockMovements.findIndex(sm => sm.Id === parseInt(id))
    if (index !== -1) {
      stockMovements.splice(index, 1)
      return true
    }
    throw new Error("Stock movement not found")
  }
}